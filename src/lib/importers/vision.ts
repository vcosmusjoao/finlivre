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

/** A single uploaded file, already read into base64 (no data: prefix). */
export interface VisionFile {
  base64: string;
  mediaType: string; // e.g. "image/png", "image/jpeg", "application/pdf"
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

// Structured-output schema. Every field is required (structured outputs needs
// `additionalProperties: false` + all-required), so optional installment data is
// modeled as nullable rather than optional.
const TransactionSchema = z.object({
  date: z.string().describe("Purchase date as ISO yyyy-mm-dd. Infer the year from the statement if the line omits it."),
  description: z.string().describe("Merchant / description, as printed."),
  amountCents: z.number().int().describe("Amount as a POSITIVE integer number of cents (e.g. R$ 24,90 -> 2490)."),
  direction: z.enum(["expense", "income"]).describe("expense for purchases/fees; income for payments received, credits or refunds."),
  installmentCurrent: z.number().int().nullable().describe("Current installment number if the line is a parcela (e.g. 3 in '3/12'), else null."),
  installmentTotal: z.number().int().nullable().describe("Total installments if the line is a parcela (e.g. 12 in '3/12'), else null."),
});

const StatementSchema = z.object({
  transactions: z.array(TransactionSchema),
});

const PROMPT = `Você é um extrator de faturas de cartão de crédito brasileiras.
Extraia TODAS as transações individuais que aparecem na(s) imagem(ns)/PDF.

Regras:
- Valores em centavos inteiros e positivos (R$ 1.234,56 -> 123456). Nunca use ponto flutuante.
- Datas no formato ISO yyyy-mm-dd. Se a linha não tiver o ano, infira pelo período da fatura.
- direction = "expense" para compras, anuidades, juros e tarifas; "income" para pagamentos recebidos, créditos e estornos.
- Parcelamentos ("3/12", "Parcela 3 de 12"): preencha installmentCurrent e installmentTotal; caso contrário use null.
- NÃO inclua linhas de resumo/total da fatura, saldo anterior, limites ou subtotais — apenas transações reais.`;

/** Raised when the model declines the request via the refusal stop reason. */
export class VisionRefusalError extends Error {
  constructor() {
    super("A IA recusou a solicitação. Tente outra imagem ou revise o conteúdo.");
    this.name = "VisionRefusalError";
  }
}

/**
 * Sends the uploaded files to Claude Vision and returns parsed entries.
 * Throws on auth/network errors (caller shows a friendly message) and on refusal.
 */
export async function parseStatement(
  files: VisionFile[],
  apiKey: string,
  billingMonth?: string,
): Promise<ParsedEntry[]> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const content: Anthropic.ContentBlockParam[] = files.map((f) =>
    f.mediaType === "application/pdf"
      ? {
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: f.base64 },
        }
      : {
          type: "image" as const,
          source: { type: "base64" as const, media_type: f.mediaType as ImageMediaType, data: f.base64 },
        },
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
  if (!parsed) return [];

  return parsed.transactions.map((t): ParsedEntry => {
    const hasInstallment = t.installmentCurrent != null && t.installmentTotal != null;
    return {
      date: t.date,
      billingMonth,
      description: t.description,
      amountCents: Math.abs(Math.round(t.amountCents)), // always positive; trust but verify the model
      direction: t.direction,
      installment: hasInstallment
        ? { current: t.installmentCurrent as number, total: t.installmentTotal as number }
        : undefined,
      source: "pdf",
    };
  });
}
