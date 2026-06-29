import 'fake-indexeddb/auto';
import { stripInstallmentText, getProjectedMonth } from '../projection';
import {
  setRecurringAmountOverride,
  skipRecurringForMonth,
  clearRecurringOverride,
} from '../recurringOverrides';
import { db } from '../db';

describe('stripInstallmentText', () => {
  it('remove "Parcela X/Y" do final', () => {
    expect(stripInstallmentText('CASAS BAHIA Parcela 3/12')).toBe('CASAS BAHIA');
  });

  it('remove "- Parcela X/Y" com traço antes', () => {
    expect(stripInstallmentText('CASAS BAHIA - Parcela 8/12')).toBe('CASAS BAHIA');
  });

  it('remove "- X/Y" no formato curto com traço', () => {
    expect(stripInstallmentText('Pix no Crédito - BUYTICKET - 1/3')).toBe('Pix no Crédito - BUYTICKET');
  });

  it('remove " X/Y" no final sem traço', () => {
    expect(stripInstallmentText('CASAS BAHIA 03/12')).toBe('CASAS BAHIA');
  });

  it('é case-insensitive para a palavra Parcela', () => {
    expect(stripInstallmentText('Loja PARCELA 2/5')).toBe('Loja');
  });

  it('não altera descrição sem parcela', () => {
    expect(stripInstallmentText('NETFLIX')).toBe('NETFLIX');
    expect(stripInstallmentText('iFood - NuPay')).toBe('iFood - NuPay');
  });

  it('não confunde datas (dia/mês) no meio da descrição com parcela', () => {
    // "10/06" no meio não está no final — não deve ser removido
    expect(stripInstallmentText('Compra 10/06 no mercado')).toBe('Compra 10/06 no mercado');
  });
});

describe('getProjectedMonth — overrides de recorrente', () => {
  let salaryId: number;

  beforeEach(async () => {
    await db.recurringItems.clear();
    await db.recurringOverrides.clear();
    await db.entries.clear();
    salaryId = await db.recurringItems.add({
      direction: 'income',
      description: 'Salário',
      amountCents: 530000, // R$ 5.300,00
      category: 'Salário',
      activeFrom: '2026-01',
    });
  });

  it('sem override: usa o valor base', async () => {
    const p = await getProjectedMonth('2026-06');
    const salary = p.items.find(i => i.recurringItemId === salaryId);
    expect(salary?.amountCents).toBe(530000);
    expect(salary?.overridden).toBe(false);
    expect(p.totalIncomeCents).toBe(530000);
  });

  it('override de valor afeta só o mês-alvo, não os outros', async () => {
    await setRecurringAmountOverride(salaryId, '2026-06', 500400); // R$ 5.004,00

    const june = await getProjectedMonth('2026-06');
    expect(june.items.find(i => i.recurringItemId === salaryId)?.amountCents).toBe(500400);
    expect(june.items.find(i => i.recurringItemId === salaryId)?.overridden).toBe(true);
    expect(june.totalIncomeCents).toBe(500400);

    const july = await getProjectedMonth('2026-07');
    expect(july.items.find(i => i.recurringItemId === salaryId)?.amountCents).toBe(530000);
    expect(july.items.find(i => i.recurringItemId === salaryId)?.overridden).toBe(false);
  });

  it('skip omite o recorrente naquele mês e zera o total', async () => {
    await skipRecurringForMonth(salaryId, '2026-06');

    const june = await getProjectedMonth('2026-06');
    expect(june.items.find(i => i.recurringItemId === salaryId)).toBeUndefined();
    expect(june.totalIncomeCents).toBe(0);

    // Outros meses seguem normais
    const july = await getProjectedMonth('2026-07');
    expect(july.items.find(i => i.recurringItemId === salaryId)?.amountCents).toBe(530000);
  });

  it('clearRecurringOverride restaura o valor base', async () => {
    await setRecurringAmountOverride(salaryId, '2026-06', 500400);
    await clearRecurringOverride(salaryId, '2026-06');

    const june = await getProjectedMonth('2026-06');
    expect(june.items.find(i => i.recurringItemId === salaryId)?.amountCents).toBe(530000);
    expect(june.items.find(i => i.recurringItemId === salaryId)?.overridden).toBe(false);
  });

  it('upsert: setar valor depois de skip troca skip por valor', async () => {
    await skipRecurringForMonth(salaryId, '2026-06');
    await setRecurringAmountOverride(salaryId, '2026-06', 500400);

    const june = await getProjectedMonth('2026-06');
    const salary = june.items.find(i => i.recurringItemId === salaryId);
    expect(salary?.amountCents).toBe(500400);
    // Não deve haver duas linhas de override para o mesmo (item, mês)
    const count = await db.recurringOverrides
      .where('[recurringItemId+month]').equals([salaryId, '2026-06']).count();
    expect(count).toBe(1);
  });
});
