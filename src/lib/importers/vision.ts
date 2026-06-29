import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import type { ParsedEntry } from "./ofx";

/**
 * Vision importer — turns a photo/screenshot OR PDF of a bank/credit-card invoice
 * into ParsedEntry[] using Claude Vision. This is the ONE source that needs a
 * network call: pixels have no deterministic local parse. The request goes
 * directly from the browser to Anthropic under the *user's own* API key
 * (`dangerouslyAllowBrowser`), so there is still no backend. Data persistence
 * stays 100% local. See PLAN.md §8 and the M5 plan.
 *
 * Like every importer it only PARSES — categorization, hashing and persistence
 * happen later via `commitParsedEntries`.
 */

const MODEL = "claude-sonnet-4-6";
const CACHE_STORAGE_KEY = "finlivre.visionCache";
const MAX_CACHE_ENTRIES = 30;

/** A single uploaded file, already read into base64 (no data: prefix). */
export interface VisionFile {
  base64: string;
  mediaType: string; // e.g. "image/png", "image/jpeg", "application/pdf"
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

// ─── Cache ────────────────────────────────────────────────────────────────────
// We cache the RAW model output (before billingMonth is applied) so the same
// file can be re-imported in a different billing month without another API call.

interface RawTransaction {
  date: string;
  description: string;
  amountCents: number;
  direction: "expense" | "income";
  installmentCurrent: number | null;
  installmentTotal: number | null;
}

interface CacheEntry {
  transactions: RawTransaction[];
  invoiceTotalCents: number | null;
  savedAt: number; // Date.now() — used for LRU eviction
}

type VisionCache = Record<string, CacheEntry>;

// Two-layer cache: memory (fast, current session) + localStorage (cross-session persistence).
// Memory is the source of truth for same-session lookups; localStorage hydrates it on first read.
const memCache = new Map<string, CacheEntry>();

function getCached(hash: string): CacheEntry | undefined {
  if (memCache.has(hash)) return memCache.get(hash);
  // Cold start: try to hydrate from localStorage
  if (typeof window === "undefined") return undefined;
  try {
    const stored: VisionCache = JSON.parse(localStorage.getItem(CACHE_STORAGE_KEY) ?? "{}");
    if (stored[hash]) { memCache.set(hash, stored[hash]); return stored[hash]; }
  } catch { /* ignore */ }
  return undefined;
}

function setCached(hash: string, entry: CacheEntry): void {
  memCache.set(hash, entry);
  if (typeof window === "undefined") return;
  try {
    const stored: VisionCache = JSON.parse(localStorage.getItem(CACHE_STORAGE_KEY) ?? "{}");
    stored[hash] = entry;
    // Keep only the MAX_CACHE_ENTRIES most-recent entries
    const trimmed = Object.fromEntries(
      Object.entries(stored)
        .sort(([, a], [, b]) => b.savedAt - a.savedAt)
        .slice(0, MAX_CACHE_ENTRIES),
    );
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

/** djb2 fingerprint of all uploaded files — synchronous, no crypto.subtle needed. */
function hashFiles(files: VisionFile[]): string {
  let h = 5381;
  for (const f of files) {
    for (let i = 0; i < f.mediaType.length; i++) h = (((h << 5) + h) ^ f.mediaType.charCodeAt(i)) | 0;
    h = (((h << 5) + h) ^ 124) | 0; // '|' separator
    for (let i = 0; i < f.base64.length; i++) h = (((h << 5) + h) ^ f.base64.charCodeAt(i)) | 0;
    h = (((h << 5) + h) ^ 124) | 0;
  }
  return (h >>> 0).toString(36);
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const TransactionSchema = z.object({
  date: z.string().describe("Purchase date as ISO yyyy-mm-dd. Infer the year from the statement if the line omits it."),
  description: z.string().describe("Merchant / description, as printed."),
  amountCents: z.number().int().describe("Amount as a POSITIVE integer number of cents (e.g. R$ 24,90 -> 2490)."),
  direction: z.enum(["expense", "income"]).describe("expense for purchases/fees; income for payments received, credits or refunds."),
  installmentCurrent: z.number().int().nullable().describe("Current installment number if the line is a parcela (e.g. 3 in '3/12'), else null."),
  installmentTotal: z.number().int().nullable().describe("Total installments if the line is a parcela (e.g. 12 in '3/12'), else null."),
});

const StatementSchema = z.object({
  invoiceTotalCents: z.number().int().nullable().describe(
    "Total amount owed on the invoice in cents (e.g. 'Total a Pagar: R$ 1.558,78' → 155878). Null if not found."
  ),
  transactions: z.array(TransactionSchema),
});

const PROMPT = `Você é um extrator de faturas de cartão de crédito brasileiras.
Extraia TODAS as transações individuais que aparecem na(s) imagem(ns)/PDF.

Regras para transactions:
- Valores em centavos inteiros e positivos (R$ 1.234,56 -> 123456). Nunca use ponto flutuante.
- Datas no formato ISO yyyy-mm-dd. Se a linha não tiver o ano, infira pelo período da fatura.
- direction = "expense" para compras, anuidades, juros e tarifas; "income" para pagamentos recebidos, créditos e estornos.
- Parcelamentos ("3/12", "Parcela 3 de 12"): preencha installmentCurrent e installmentTotal; caso contrário use null.
- NÃO inclua linhas de resumo/total da fatura, saldo anterior, limites ou subtotais — apenas transações reais.

Regras para invoiceTotalCents:
- Procure pelo total a pagar da fatura (ex: "Total a Pagar", "Valor da Fatura", "Total da Fatura").
- Converta para centavos inteiros positivos. Null se não encontrado.`;

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ParsedStatement {
  entries: ParsedEntry[];
  /** Invoice total extracted by the AI (same role as LEDGERBAL in OFX). Null when not found. */
  invoiceTotalCents: number | null;
  /** True when the result was served from the local cache (no API call was made). */
  fromCache: boolean;
}

/** Raised when the model declines the request via the refusal stop reason. */
export class VisionRefusalError extends Error {
  constructor() {
    super("A IA recusou a solicitação. Tente outra imagem ou revise o conteúdo.");
    this.name = "VisionRefusalError";
  }
}

function mapRaw(raw: RawTransaction[], billingMonth?: string): ParsedEntry[] {
  return raw.map((t): ParsedEntry => {
    const hasInstallment = t.installmentCurrent != null && t.installmentTotal != null;
    return {
      date: t.date,
      billingMonth,
      description: t.description,
      amountCents: Math.abs(Math.round(t.amountCents)),
      direction: t.direction,
      installment: hasInstallment
        ? { current: t.installmentCurrent as number, total: t.installmentTotal as number }
        : undefined,
      source: "pdf",
    };
  });
}

/**
 * Sends the uploaded files to Claude Vision and returns parsed entries + invoice total.
 * Results are cached in localStorage by file content hash — re-uploading the same
 * file skips the API call entirely (cache persists across sessions, up to 30 entries).
 * Throws on auth/network errors (caller shows a friendly message) and on refusal.
 */
export async function parseStatement(
  files: VisionFile[],
  apiKey: string,
  billingMonth?: string,
): Promise<ParsedStatement> {
  const hash = hashFiles(files);

  // Cache hit — apply current billingMonth to cached raw transactions and return
  const cached = getCached(hash);
  if (cached) {
    return { entries: mapRaw(cached.transactions, billingMonth), invoiceTotalCents: cached.invoiceTotalCents, fromCache: true };
  }

  // Cache miss — call the API
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const content: Anthropic.ContentBlockParam[] = files.map((f) =>
    f.mediaType === "application/pdf"
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: f.base64 } }
      : { type: "image" as const, source: { type: "base64" as const, media_type: f.mediaType as ImageMediaType, data: f.base64 } },
  );
  content.push({ type: "text", text: PROMPT });

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: "user", content }],
    output_config: { format: zodOutputFormat(StatementSchema) },
  });

  if (response.stop_reason === "refusal") throw new VisionRefusalError();

  const parsed = response.parsed_output;
  if (!parsed) return { entries: [], invoiceTotalCents: null, fromCache: false };

  const invoiceTotalCents =
    parsed.invoiceTotalCents != null ? Math.abs(Math.round(parsed.invoiceTotalCents)) : null;

  // Persist raw output to cache (billingMonth excluded — applied on each retrieval)
  setCached(hash, { transactions: parsed.transactions as RawTransaction[], invoiceTotalCents, savedAt: Date.now() });

  return { entries: mapRaw(parsed.transactions as RawTransaction[], billingMonth), invoiceTotalCents, fromCache: false };
}

/** Wipes the vision cache from both memory and localStorage. */
export function clearVisionCache(): void {
  memCache.clear();
  if (typeof window !== "undefined") localStorage.removeItem(CACHE_STORAGE_KEY);
}
