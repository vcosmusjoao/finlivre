import { ofxImporter, type ParsedEntry } from "./importers/ofx";
import { db } from "./db";
import { categorize } from "./categorize";

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
