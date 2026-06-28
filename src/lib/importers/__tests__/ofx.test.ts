import { ofxImporter } from "../ofx";

const SAMPLE_BLOCK = (fields: string) => `
<OFX><CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS><BANKTRANLIST>
<STMTTRN>
${fields}
</STMTTRN>
</BANKTRANLIST></CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1></OFX>
`;

describe("ofxImporter.parse", () => {
  it("parses a basic expense entry", () => {
    const input = SAMPLE_BLOCK(`
      <TRNTYPE>DEBIT
      <DTPOSTED>20260615120000[-3:BRT]
      <TRNAMT>-24.90
      <MEMO>UBER *TRIP
    `);

    const [entry] = ofxImporter.parse(input);

    expect(entry.date).toBe("2026-06-15");
    expect(entry.amountCents).toBe(2490);
    expect(entry.direction).toBe("expense");
    expect(entry.description).toBe("UBER *TRIP");
    expect(entry.source).toBe("ofx");
  });

  it("parses a credit (income) entry", () => {
    const input = SAMPLE_BLOCK(`
      <TRNTYPE>CREDIT
      <DTPOSTED>20260622120000[-3:BRT]
      <TRNAMT>+89.50
      <MEMO>ESTORNO IFOOD
    `);

    const [entry] = ofxImporter.parse(input);

    expect(entry.direction).toBe("income");
    expect(entry.amountCents).toBe(8950);
  });

  it("falls back to NAME when MEMO is absent", () => {
    const input = SAMPLE_BLOCK(`
      <TRNTYPE>DEBIT
      <DTPOSTED>20260620120000[-3:BRT]
      <TRNAMT>-45.00
      <NAME>NETFLIX.COM
    `);

    const [entry] = ofxImporter.parse(input);

    expect(entry.description).toBe("NETFLIX.COM");
  });

  it("parses multiple entries", () => {
    const fileText = `
      <OFX><CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS><BANKTRANLIST>
      <STMTTRN>
        <DTPOSTED>20260615120000[-3:BRT]
        <TRNAMT>-10.00
        <MEMO>ENTRADA 1
      </STMTTRN>
      <STMTTRN>
        <DTPOSTED>20260616120000[-3:BRT]
        <TRNAMT>-20.00
        <MEMO>ENTRADA 2
      </STMTTRN>
      </BANKTRANLIST></CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1></OFX>
    `;

    const entries = ofxImporter.parse(fileText);

    expect(entries).toHaveLength(2);
  });

  it("returns empty array for file with no transactions", () => {
    const entries = ofxImporter.parse("<OFX></OFX>");
    expect(entries).toHaveLength(0);
  });

  it("detecta parcela no formato 'Parcela 3/12'", () => {
  const input = SAMPLE_BLOCK(`
      <TRNTYPE>DEBIT
      <DTPOSTED>20260620120000[-3:BRT]
      <TRNAMT>-45.00
      <NAME>CASAS BAHIA Parcela 3/12
    `);

    const [entry] = ofxImporter.parse(input);
    expect(entry.installment?.current).toBe(3);
    expect(entry.installment?.total).toBe(12);

});

it("detecta parcela no formato '03/12' sem a palavra Parcela", () => {
 const input = SAMPLE_BLOCK(`
      <TRNTYPE>DEBIT
      <DTPOSTED>20260620120000[-3:BRT]
      <TRNAMT>-45.00
      <NAME>CASAS BAHIA 03/12
    `);

    const [entry] = ofxImporter.parse(input);
    expect(entry.installment?.current).toBe(3);
    expect(entry.installment?.total).toBe(12);
});

it("retorna installment undefined quando não há parcela", () => {
  const input = SAMPLE_BLOCK(`
      <TRNTYPE>DEBIT
      <DTPOSTED>20260620120000[-3:BRT]
      <TRNAMT>-45.00
      <NAME>CASAS BAHIA
    `);

    const [entry] = ofxImporter.parse(input);
    expect(entry.installment).toBe(undefined);
});


});
