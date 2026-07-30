import type { Entry } from "../db";

/** Metadata extracted from an OFX file that isn't part of individual transactions. */
export interface OFXMeta {
  ledgerBalanceCents?: number; // absolute value of LEDGERBAL (what is owed on the card)
  statementMonth?: string;     // yyyy-MM derived from DTEND
}

/** Extracts invoice-level metadata from an OFX file (LEDGERBAL, statement period). */
export function parseOfxMeta(fileText: string): OFXMeta {
  const dtEndMatch = fileText.match(/<DTEND>(\d{8})/i);
  const statementMonth = dtEndMatch
    ? `${dtEndMatch[1].slice(0, 4)}-${dtEndMatch[1].slice(4, 6)}`
    : undefined;

  // LEDGERBAL block: <LEDGERBAL><BALAMT>-1658.76<DTASOF>...
  const balMatch = fileText.match(/<LEDGERBAL>[\s\S]*?<BALAMT>\s*(-?[\d.]+)/i);
  const ledgerBalanceCents = balMatch
    ? Math.abs(Math.round(parseFloat(balMatch[1]) * 100))
    : undefined;

  return { ledgerBalanceCents, statementMonth };
}

/**
 * An importer turns a file's text into raw entries. Categorization, hashing and
 * persistence happen later in the pipeline — importers only parse. Every format
 * (OFX/CSV/PDF) implements this same interface. (Angular bridge: like several
 * classes implementing one interface, chosen at runtime.)
 */
export type ParsedEntry = Pick<
  Entry,
  "date" | "billingMonth" | "description" | "amountCents" | "direction" | "installment"
> & { source: "ofx" | "pdf" };

export interface Importer {
  format: "ofx" | "csv" | "pdf";
  parse(fileText: string): ParsedEntry[];
}

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
    // <CCACCTFROM> signals a credit card statement. Positive amounts there are
    // bill payments (money flowing into the card to settle debt), not real income.
    const isCreditCard =
      /<CCACCTFROM>/i.test(fileText) ||
      /<ACCTTYPE>CREDITLINE/i.test(fileText);

    // DTEND marks the end of the statement period — its month is the billing month
    // for all transactions in this file, even those dated in the previous month.
    // e.g. DTEND=20260628 → billingMonth='2026-06', so a purchase on 2026-05-29
    // correctly lands in June's budget instead of May's.
    const dtEndMatch = fileText.match(/<DTEND>(\d{8})/i);
    const billingMonth = dtEndMatch
      ? `${dtEndMatch[1].slice(0, 4)}-${dtEndMatch[1].slice(4, 6)}`
      : undefined;

    const results: ParsedEntry[] = [];
    const matches = fileText.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi);

    for (const match of matches) {
      const block = match[1];
      const rawDate = getField(block, 'DTPOSTED');
      const rawAmount = getField(block, 'TRNAMT');
      const description = getField(block, 'MEMO') || getField(block, 'NAME');

      const date = parseDate(rawDate);
      const amount = parseFloat(rawAmount);
      const amountCents = Math.abs(Math.round(amount * 100));
      // On credit card statements, positive amounts are either bill payments
      // ("Pagamento recebido") or refunds/chargebacks ("Estorno ...").
      // Payments settle debt → transfer. Refunds return money → income.
      const direction =
        amount < 0 ? "expense"
        : isCreditCard && /pagamento/i.test(description) ? "transfer"
        : "income";
      const installment = detectInstallment(description);

      results.push({ date, billingMonth, description, amountCents, direction, installment, source: 'ofx' });
    }
    return results;
  },
};
