import { buildIncomeExpenseSeries } from '../incomeExpenseSeries';
import type { Entry } from '../db';

type SeriesEntry = Pick<Entry, 'direction' | 'date' | 'billingMonth' | 'amountCents'>;

const entry = (over: Partial<SeriesEntry> = {}): SeriesEntry => ({
  direction: 'expense',
  date: '2026-07-10',
  amountCents: 1000,
  ...over,
});

describe('buildIncomeExpenseSeries', () => {
  it('separa receitas e gastos por mês', () => {
    const series = buildIncomeExpenseSeries([
      entry({ direction: 'income', amountCents: 500000 }),
      entry({ direction: 'expense', amountCents: 120000 }),
    ]);

    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ monthKey: '2026-07', Receitas: 500000, Gastos: 120000 });
  });

  it('ignora transferências (pagamento de fatura)', () => {
    const series = buildIncomeExpenseSeries([
      entry({ direction: 'income', amountCents: 500000 }),
      entry({ direction: 'transfer', amountCents: 300000 }),
    ]);

    expect(series[0]).toMatchObject({ Receitas: 500000, Gastos: 0 });
  });

  it('agrupa pelo billingMonth (effectiveMonth), não pela data de compra', () => {
    // Compra em junho, mas faturada em julho — deve cair em julho, como no resto do app.
    const series = buildIncomeExpenseSeries([
      entry({ direction: 'expense', date: '2026-06-28', billingMonth: '2026-07', amountCents: 90000 }),
    ]);

    expect(series).toHaveLength(1);
    expect(series[0].monthKey).toBe('2026-07');
    expect(series[0].Gastos).toBe(90000);
  });

  it('ordena os meses cronologicamente', () => {
    const series = buildIncomeExpenseSeries([
      entry({ date: '2026-07-01' }),
      entry({ date: '2026-05-01' }),
      entry({ date: '2026-06-01' }),
    ]);

    expect(series.map(p => p.monthKey)).toEqual(['2026-05', '2026-06', '2026-07']);
  });

  // Regressão do bug: no mês corrente o salário é um recorrente projetado (não existe
  // como Entry real), então a série de Receitas ficava zerada e a barra verde sumia,
  // enquanto os cards de resumo mostravam Receitas > 0. A projeção precisa entrar.
  it('inclui a projeção do mês (recorrentes) para bater com os cards de resumo', () => {
    const series = buildIncomeExpenseSeries(
      [entry({ direction: 'expense', date: '2026-07-05', amountCents: 611068 })], // só gasto real
      { '2026-07': { income: 685476, expense: 0 } }, // salário projetado
    );

    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ monthKey: '2026-07', Receitas: 685476, Gastos: 611068 });
  });

  it('soma projeção sobre entries reais do mesmo mês', () => {
    const series = buildIncomeExpenseSeries(
      [entry({ direction: 'income', date: '2026-07-05', amountCents: 100000 })],
      { '2026-07': { income: 585476, expense: 5000 } },
    );

    expect(series[0]).toMatchObject({ Receitas: 685476, Gastos: 5000 });
  });

  it('cria o mês só a partir da projeção quando não há entry real', () => {
    const series = buildIncomeExpenseSeries([], { '2026-08': { income: 530000, expense: 200000 } });

    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ monthKey: '2026-08', Receitas: 530000, Gastos: 200000 });
  });
});
