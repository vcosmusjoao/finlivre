import "fake-indexeddb/auto";
import { importOfx, commitParsedEntries } from "../import-pipeline";
import { db } from "../db";
import type { ParsedEntry } from "../importers/ofx";

const SAMPLE_OFX = `
<OFX><CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS><BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260615120000[-3:BRT]
<TRNAMT>-24.90
<MEMO>UBER *TRIP
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260616120000[-3:BRT]
<TRNAMT>-89.50
<MEMO>IFOOD*RESTAURANTE
</STMTTRN>
</BANKTRANLIST></CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1></OFX>
`;

beforeEach(async () => {
  await db.entries.clear();
});

describe("importOfx", () => {
  it("importa entradas e retorna quantidade adicionada", async () => {
    const result = await importOfx(SAMPLE_OFX);

    expect(result.added).toBe(2);
    expect(result.skipped).toBe(0);
  });

  it("persiste as entradas no DB", async () => {
    await importOfx(SAMPLE_OFX);

    const entries = await db.entries.toArray();
    expect(entries).toHaveLength(2);
    expect(entries[0].description).toBe("UBER *TRIP");
    expect(entries[0].amountCents).toBe(2490);
    expect(entries[0].direction).toBe("expense");
    expect(entries[0].importedAt).toBeDefined();
    expect(entries[0].hash).toBeDefined();
  });

  it("pula duplicatas ao importar o mesmo arquivo duas vezes", async () => {
    await importOfx(SAMPLE_OFX);
    const second = await importOfx(SAMPLE_OFX);

    expect(second.added).toBe(0);
    expect(second.skipped).toBe(2);

    const entries = await db.entries.toArray();
    expect(entries).toHaveLength(2);
  });
});

describe("commitParsedEntries", () => {
  const pdfEntry: ParsedEntry = {
    date: "2026-06-15",
    description: "UBER *TRIP",
    amountCents: 2490,
    direction: "expense",
    source: "pdf",
  };

  it("categoriza e persiste entradas parseadas (qualquer fonte)", async () => {
    const res = await commitParsedEntries([pdfEntry]);

    expect(res.added).toBe(1);
    const entries = await db.entries.toArray();
    expect(entries[0].source).toBe("pdf");
    expect(entries[0].category).toBeTruthy(); // categorize() rodou
    expect(entries[0].hash).toBe("2026-06-15|2490|UBER *TRIP");
  });

  it("deduplica entre fontes: o mesmo conteúdo via OFX e via PDF não duplica", async () => {
    await importOfx(SAMPLE_OFX); // contém UBER *TRIP, 2490, 2026-06-15
    const res = await commitParsedEntries([pdfEntry]);

    expect(res.added).toBe(0);
    expect(res.skipped).toBe(1);

    const ubers = await db.entries.where("hash").equals("2026-06-15|2490|UBER *TRIP").count();
    expect(ubers).toBe(1);
  });

  it("associa accountId quando fornecido", async () => {
    const res = await commitParsedEntries([pdfEntry], 7);

    expect(res.added).toBe(1);
    const entries = await db.entries.toArray();
    expect(entries[0].accountId).toBe(7);
  });
});
