import { ofxImporter, type ParsedEntry } from "./importers/ofx";
import { db, type Direction } from "./db";
import { categorize } from "./categorize";

export interface ManualEntryInput {
  date: string;        // ISO yyyy-mm-dd
  description: string;
  amountCents: number; // always positive
  direction: Direction;
  category: string;
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

export async function importOfx(fileText: string): Promise<{ added: number; skipped: number }> {
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
  }));

  await db.entries.bulkAdd(toInsert);

  return { added: toInsert.length, skipped: entries.length - toInsert.length };
}

function generateHash(entry: ParsedEntry): string {
  return `${entry.date}|${entry.amountCents}|${entry.description}`;
}
