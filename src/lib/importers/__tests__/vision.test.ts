import { parseStatement, clearVisionCache, VisionRefusalError, type VisionFile } from "../vision";

const mockParse = jest.fn();
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: class {
    messages = { parse: (...args: unknown[]) => mockParse(...args) };
  },
}));
jest.mock("@anthropic-ai/sdk/helpers/zod", () => ({ zodOutputFormat: () => ({}) }));

const IMG: VisionFile = { base64: "abc", mediaType: "image/png" };
const IMG2: VisionFile = { base64: "xyz", mediaType: "image/jpeg" };

const MOCK_OUTPUT = {
  stop_reason: "end_turn",
  parsed_output: {
    invoiceTotalCents: 125000,
    transactions: [
      { date: "2026-06-15", description: "UBER", amountCents: 2490, direction: "expense", installmentCurrent: null, installmentTotal: null },
      { date: "2026-06-10", description: "Loja", amountCents: 10000, direction: "expense", installmentCurrent: 3, installmentTotal: 12 },
    ],
  },
};

beforeEach(() => {
  mockParse.mockReset();
  clearVisionCache(); // prevent cache bleed between tests
});

describe("parseStatement", () => {
  it("mapeia a resposta para ParsedEntry[] (source pdf, billingMonth, parcela)", async () => {
    mockParse.mockResolvedValue(MOCK_OUTPUT);

    const res = await parseStatement([IMG], "sk-test", "2026-06");

    expect(res.entries).toHaveLength(2);
    expect(res.entries[0]).toMatchObject({ description: "UBER", amountCents: 2490, direction: "expense", source: "pdf", billingMonth: "2026-06" });
    expect(res.entries[0].installment).toBeUndefined();
    expect(res.entries[1].installment).toEqual({ current: 3, total: 12 });
    expect(res.invoiceTotalCents).toBe(125000);
    expect(res.fromCache).toBe(false);
  });

  it("força amountCents positivo e inteiro", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: {
        invoiceTotalCents: null,
        transactions: [{ date: "2026-06-15", description: "Estorno", amountCents: -500, direction: "income", installmentCurrent: null, installmentTotal: null }],
      },
    });

    const res = await parseStatement([IMG2], "sk-test");
    expect(res.entries[0].amountCents).toBe(500);
    expect(res.entries[0].direction).toBe("income");
    expect(res.invoiceTotalCents).toBeNull();
  });

  it("lança VisionRefusalError quando o modelo recusa", async () => {
    mockParse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });

    await expect(parseStatement([IMG], "sk-test")).rejects.toThrow(VisionRefusalError);
  });

  it("envia PDF como bloco document e imagem como bloco image", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: { invoiceTotalCents: null, transactions: [] },
    });

    await parseStatement(
      [{ base64: "pdfdata", mediaType: "application/pdf" }, IMG],
      "sk-test",
    );

    const params = mockParse.mock.calls[0][0] as { messages: { content: { type: string }[] }[] };
    const types = params.messages[0].content.map(b => b.type);
    expect(types).toContain("document");
    expect(types).toContain("image");
    expect(types).toContain("text");
  });

  it("retorna invoiceTotalCents extraído pela IA e força positivo", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: { invoiceTotalCents: -155878, transactions: [] },
    });

    const res = await parseStatement([IMG], "sk-test");
    expect(res.invoiceTotalCents).toBe(155878);
  });

  it("serve resultado do cache na segunda chamada sem chamar a API", async () => {
    mockParse.mockResolvedValue(MOCK_OUTPUT);

    const first = await parseStatement([IMG], "sk-test", "2026-06");
    const second = await parseStatement([IMG], "sk-test", "2026-07"); // mesmo arquivo, outro mês

    expect(mockParse).toHaveBeenCalledTimes(1); // API só chamada uma vez
    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    // billingMonth é aplicado dinamicamente sobre o cache
    expect(second.entries[0].billingMonth).toBe("2026-07");
    expect(second.entries).toHaveLength(2);
  });

  it("arquivos diferentes geram chamadas de API independentes", async () => {
    mockParse.mockResolvedValue(MOCK_OUTPUT);

    await parseStatement([IMG], "sk-test");
    await parseStatement([IMG2], "sk-test"); // arquivo diferente → hash diferente

    expect(mockParse).toHaveBeenCalledTimes(2);
  });
});
