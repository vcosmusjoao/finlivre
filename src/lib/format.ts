import type { Entry } from './db';

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function monthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-').map(Number);
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(year, month - 1));
  return `${label.replace('.', '')}/${String(year).slice(2)}`;
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // 'yyyy-MM'
}

// Which month an entry belongs to for budgeting purposes.
// billingMonth (from OFX DTEND) takes priority over the raw purchase date.
export function effectiveMonth(entry: Pick<Entry, 'date' | 'billingMonth'>): string {
  return entry.billingMonth ?? entry.date.slice(0, 7);
}
