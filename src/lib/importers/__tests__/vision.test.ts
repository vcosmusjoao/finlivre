import { parseStatement, VisionRefusalError, type VisionFile } from "../vision";

// Mock the Anthropic SDK so no real network call happens. The default export is a
// class with a `messages.parse` method; we drive its return value per test.
const mockParse = jest.fn();
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: class {
    messages = { parse: (...args: unknown[]) => mockParse(...args) };
  },
}));
// The zod helper just builds an output_config value we don't assert on.
jest.mock("@anthropic-ai/sdk/helpers/zod", () => ({ zodOutputFormat: () => ({}) }));

const IMG: VisionFile = { base64: "abc", mediaType: "image/png" };

beforeEach(() => mockParse.mockReset());

describe("parseStatement", () => {
  it("mapeia a resposta para ParsedEntry[] (source pdf, billingMonth, parcela)", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: {
        transactions: [
          { date: "2026-06-15", description: "UBER", amountCents: 2490, direction: "expense", installmentCurrent: null, installmentTotal: null },
          { date: "2026-06-10", description: "Loja", amountCents: 10000, direction: "expense", installmentCurrent: 3, installmentTotal: 12 },
        ],
      },
    });

    const res = await parseStatement([IMG], "sk-test", "2026-06");

    expect(res).toHaveLength(2);
    expect(res[0]).toMatchObject({ description: "UBER", amountCents: 2490, direction: "expense", source: "pdf", billingMonth: "2026-06" });
    expect(res[0].installment).toBeUndefined();
    expect(res[1].installment).toEqual({ current: 3, total: 12 });
  });

  it("força amountCents positivo e inteiro", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: { transactions: [{ date: "2026-06-15", description: "Estorno", amountCents: -500, direction: "income", installmentCurrent: null, installmentTotal: null }] },
    });

    const res = await parseStatement([IMG], "sk-test");
    expect(res[0].amountCents).toBe(500);
    expect(res[0].direction).toBe("income");
  });

  it("lança VisionRefusalError quando o modelo recusa", async () => {
    mockParse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });

    await expect(parseStatement([IMG], "sk-test")).rejects.toThrow(VisionRefusalError);
  });

  it("envia PDF como bloco document e imagem como bloco image", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: { transactions: [] } });

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
});
