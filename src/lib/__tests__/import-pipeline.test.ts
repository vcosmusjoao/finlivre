import "fake-indexeddb/auto";
import { importOfx } from "../import-pipeline";
import { db } from "../db";

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
