import { ofxImporter, parseOfxMeta, type ParsedEntry } from "./importers/ofx";
import { db, type Direction } from "./db";
import { categorize } from "./categorize";

export interface ManualEntryInput {
  date: string;
  description: string;
  amountCents: number;
  direction: Direction;
  category: string;
  accountId?: number;
}

export async function addManualEntry(input: ManualEntryInput): Promise<void> {
  const hash = `manual|${input.date}|${input.amountCents}|${input.description}`;
  const exists = await db.entries.where('hash').equals(hash).count();
  if (exists > 0) return;

  await db.entries.add({
    ...input,
    source: 'manual',
    importedAt: new Date().toISOString(),
    hash,
  });
}

export async function importOfx(
  fileText: string,
  accountId?: number
): Promise<{ added: number; skipped: number }> {
  const entries = ofxImporter.parse(fileText);

  const existingHashes = new Set(
    await db.entries.where("hash").anyOf(entries.map(generateHash)).keys()
  );

  const newEntries = entries.filter(entry => !existingHashes.has(generateHash(entry)));

  const categories = await Promise.all(
    newEntries.map(entry => categorize(entry.description))
  );

  const toInsert = newEntries.map((entry, i) => ({
    ...entry,
    category: categories[i],
    hash: generateHash(entry),
    importedAt: new Date().toISOString(),
    ...(accountId !== undefined && { accountId }),
  }));

  await db.entries.bulkAdd(toInsert);

  // Store LEDGERBAL as an InvoiceStatement so the invoice card can show it
  if (accountId !== undefined) {
    const meta = parseOfxMeta(fileText);
    if (meta.ledgerBalanceCents !== undefined && meta.statementMonth) {
      await db.invoiceStatements
        .where('[accountId+month]')
        .equals([accountId, meta.statementMonth])
        .delete()
        .catch(() => {
          // compound index may not exist in older DB versions — safe to ignore
        });
      await db.invoiceStatements.add({
        accountId,
        month: meta.statementMonth,
        balanceCents: meta.ledgerBalanceCents,
        importedAt: new Date().toISOString(),
      });
    }
  }

  return { added: toInsert.length, skipped: entries.length - toInsert.length };
}

/** Creates a demo Nubank account (if not already present) and imports the sample OFX. */
export async function importSampleData(): Promise<{ added: number; skipped: number }> {
  const existing = await db.accounts.where('name').equals('Nubank (demo)').first();
  const accountId = existing?.id ?? await db.accounts.add({
    name: 'Nubank (demo)',
    type: 'credit_card',
    color: '#820AD1',
    closingDay: 5,
  });

  const res = await fetch('/sample.ofx');
  const text = await res.text();
  return importOfx(text, accountId as number);
}

function generateHash(entry: ParsedEntry): string {
  return `${entry.date}|${entry.amountCents}|${entry.description}`;
}
