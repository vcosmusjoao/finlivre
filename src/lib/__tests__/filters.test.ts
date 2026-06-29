import { matchesFilters, matchesAccount } from '../filters';
import type { Entry } from '../db';

type FilterableEntry = Pick<Entry, 'date' | 'billingMonth' | 'accountId'>;

const entry = (over: Partial<FilterableEntry> = {}): FilterableEntry => ({
  date: '2026-06-15',
  accountId: 1,
  ...over,
});

describe('matchesAccount', () => {
  it("'all' aceita qualquer conta (inclusive sem conta)", () => {
    expect(matchesAccount(1, 'all')).toBe(true);
    expect(matchesAccount(undefined, 'all')).toBe(true);
  });

  it("'manual' aceita só entries sem accountId", () => {
    expect(matchesAccount(undefined, 'manual')).toBe(true);
    expect(matchesAccount(1, 'manual')).toBe(false);
  });

  it('id específico casa só com aquele id', () => {
    expect(matchesAccount(1, 1)).toBe(true);
    expect(matchesAccount(2, 1)).toBe(false);
    expect(matchesAccount(undefined, 1)).toBe(false);
  });
});

describe('matchesFilters', () => {
  it('sem mês e accountId padrão: passa tudo', () => {
    expect(matchesFilters(entry(), {})).toBe(true);
    expect(matchesFilters(entry({ accountId: undefined }), {})).toBe(true);
  });

  it('filtra por mês via effectiveMonth (billingMonth tem prioridade)', () => {
    expect(matchesFilters(entry(), { month: '2026-06' })).toBe(true);
    expect(matchesFilters(entry(), { month: '2026-07' })).toBe(false);
    expect(matchesFilters(entry({ billingMonth: '2026-07' }), { month: '2026-07' })).toBe(true);
  });

  it('mês vazio não filtra por mês', () => {
    expect(matchesFilters(entry({ date: '2020-01-01' }), { month: '' })).toBe(true);
  });

  it('combina mês E conta', () => {
    expect(matchesFilters(entry(), { month: '2026-06', accountId: 1 })).toBe(true);
    expect(matchesFilters(entry(), { month: '2026-06', accountId: 2 })).toBe(false);
    expect(matchesFilters(entry(), { month: '2026-07', accountId: 1 })).toBe(false);
  });

  it("'manual' casa com entry sem conta no mês certo", () => {
    expect(matchesFilters(entry({ accountId: undefined }), { month: '2026-06', accountId: 'manual' })).toBe(true);
    expect(matchesFilters(entry({ accountId: 1 }), { month: '2026-06', accountId: 'manual' })).toBe(false);
  });
});
