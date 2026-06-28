import type { Entry } from "../db";

/**
 * An importer turns a file's text into raw entries. Categorization, hashing and
 * persistence happen later in the pipeline — importers only parse. Every format
 * (OFX/CSV/PDF) implements this same interface. (Angular bridge: like several
 * classes implementing one interface, chosen at runtime.)
 */
export type ParsedEntry = Pick<
  Entry,
  "date" | "description" | "amountCents" | "direction" | "installment"
> & { source: "ofx" };

export interface Importer {
  format: "ofx" | "csv" | "pdf";
  parse(fileText: string): ParsedEntry[];
}

/**
 * ===== MILESTONE 1 EXERCISE — implement this. =====
 *
 * OFX is an SGML/XML-ish format. Inside it, each transaction is a <STMTTRN> block:
 *
 *   <STMTTRN>
 *     <TRNTYPE>DEBIT
 *     <DTPOSTED>20260615
 *     <TRNAMT>-24.90
 *     <MEMO>UBER *TRIP
 *   </STMTTRN>
 *
 * Steps:
 *   1. Find every <STMTTRN>...</STMTTRN> block (a global regex is fine to start).
 *   2. For each block, read:
 *        - DTPOSTED  -> date (first 8 chars = YYYYMMDD -> "YYYY-MM-DD")
 *        - TRNAMT    -> signed amount; amountCents = Math.round(Math.abs(value) * 100)
 *        - direction -> value < 0 ? "expense" : "income"
 *        - MEMO/NAME -> description
 *   3. Detect installments in the description ("Parcela 3/12" or "03/12") -> { current, total }.
 *   4. Return ParsedEntry[]. Do NOT categorize or hash here — that's the pipeline's job.
 *
 * Try it yourself first against a real Nubank .ofx export. Ask for help only if stuck.
 */


function getField(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([^<\n]+)`, 'i'));
  return match?.[1].trim() ?? '';
}

function parseDate(dateStr: string): string {
  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})/);

  if (!match) {
    throw new Error("Data inválida");
  }

  const [, year, month, day] = match;

  return `${year}-${month}-${day}`;
}

function detectInstallment(description: string): { current: number; total: number } | undefined {
  const match = description.match(/(?:Parcela\s?)?(\d{1,2})\/(\d{1,2})/i);
  if (!match) return undefined;
  return { current: Number(match[1]), total: Number(match[2]) };
}

export const ofxImporter: Importer = {
  format: "ofx",
  parse(fileText: string): ParsedEntry[] {
    const results : ParsedEntry[] = [];
    const matches = fileText.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi);
    for (const match of matches) {
      const block= match[1];
      const rawDate = getField(block, 'DTPOSTED'); 
      const rawAmount = getField(block, 'TRNAMT');
      const description =  getField(block, 'MEMO') || getField(block, 'NAME');

      const date = parseDate(rawDate);                        
      const amount = parseFloat(rawAmount);
      const amountCents = Math.abs(Math.round(amount * 100));
      const direction = amount < 0 ? "expense" : "income";
      const installment = detectInstallment(description);

      results.push({ date, description, amountCents, direction,installment, source: 'ofx' });
    }
    return results;
  },


};
