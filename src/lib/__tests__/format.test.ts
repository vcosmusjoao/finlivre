import { addMonths, monthDiff, formatBRL } from '../format';

describe('formatBRL', () => {
  it('formata zero corretamente', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
  });

  it('converte centavos para reais', () => {
    expect(formatBRL(100)).toBe('R$ 1,00');
    expect(formatBRL(2490)).toBe('R$ 24,90');
  });

  it('formata valores grandes com separador de milhar', () => {
    expect(formatBRL(165876)).toBe('R$ 1.658,76');
  });

  it('formata valor negativo', () => {
    expect(formatBRL(-500)).toBe('-R$ 5,00');
  });
});

describe('addMonths', () => {
  it('avança um mês simples', () => {
    expect(addMonths('2026-06', 1)).toBe('2026-07');
  });

  it('vira o ano ao avançar de dezembro', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
  });

  it('retrocede um mês simples', () => {
    expect(addMonths('2026-06', -1)).toBe('2026-05');
  });

  it('vira o ano ao retroceder de janeiro', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('avança múltiplos meses cruzando o ano', () => {
    expect(addMonths('2025-11', 3)).toBe('2026-02');
  });

  it('n=0 retorna o mesmo mês', () => {
    expect(addMonths('2026-06', 0)).toBe('2026-06');
  });
});

describe('monthDiff', () => {
  it('calcula diferença dentro do mesmo ano', () => {
    expect(monthDiff('2026-01', '2026-06')).toBe(5);
  });

  it('calcula diferença cruzando o ano', () => {
    expect(monthDiff('2025-11', '2026-02')).toBe(3);
  });

  it('retorna zero para o mesmo mês', () => {
    expect(monthDiff('2026-06', '2026-06')).toBe(0);
  });

  it('retorna negativo quando "to" é anterior a "from"', () => {
    expect(monthDiff('2026-06', '2026-01')).toBe(-5);
  });

  it('é inverso de addMonths', () => {
    const from = '2025-08';
    const n = 7;
    expect(monthDiff(from, addMonths(from, n))).toBe(n);
  });
});
