'use client';

import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { addManualEntry } from '@/lib/import-pipeline';
import { useLocale } from '@/i18n/LocaleContext';

function today() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY = {
  date: today(),
  description: '',
  amount: '',
  direction: 'expense' as 'income' | 'expense',
  category: '',
  accountId: '' as string | number,
  installments: '1',
};

function addMonthsToDate(dateStr: string, n: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1 + n, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ManualEntryForm() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fields, setFields] = useState(EMPTY);
  const [error, setError] = useState('');
  const { t } = useLocale();

  const categories = useLiveQuery(() =>
    db.entries.orderBy('category').uniqueKeys() as Promise<string[]>
  , [], []);

  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);

  function set(key: keyof typeof EMPTY, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function open() {
    setFields(EMPTY);
    setError('');
    dialogRef.current?.showModal();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(fields.amount.replace(',', '.')) * 100);
    const n = Math.max(1, parseInt(fields.installments, 10) || 1);

    if (!fields.description.trim()) return setError(t.manualEntryForm.descriptionRequired);
    if (isNaN(amountCents) || amountCents <= 0) return setError(t.manualEntryForm.invalidAmount);
    if (!fields.category.trim()) return setError(t.manualEntryForm.categoryRequired);

    const desc = fields.description.trim();
    const accountId = fields.accountId !== '' ? Number(fields.accountId) : undefined;

    if (n === 1 || fields.direction === 'income') {
      await addManualEntry({
        date: fields.date,
        description: desc,
        amountCents,
        direction: fields.direction,
        category: fields.category.trim(),
        accountId,
      });
    } else {
      const perInstallment = Math.floor(amountCents / n);
      const timestamp = Date.now();
      const entries = Array.from({ length: n }, (_, i) => ({
        date: addMonthsToDate(fields.date, i),
        description: `${desc} (${i + 1}/${n})`,
        amountCents: i === n - 1 ? amountCents - perInstallment * (n - 1) : perInstallment,
        direction: 'expense' as const,
        category: fields.category.trim(),
        accountId,
        installment: { current: i + 1, total: n },
        source: 'manual' as const,
        importedAt: new Date().toISOString(),
        hash: `manual-installment|${timestamp}|${i}|${desc}`,
      }));
      await db.entries.bulkAdd(entries);
    }

    dialogRef.current?.close();
  }

  return (
    <>
      <button
        onClick={open}
        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 transition-colors"
      >
        {t.manualEntryForm.addButton}
      </button>

      {/* HTML native modal — no library needed */}
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 w-full max-w-md shadow-xl backdrop:bg-black/40"
      >
        <h2 className="text-base font-semibold text-foreground mb-5">{t.manualEntryForm.title}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{t.common.date}</span>
              <input
                type="date"
                value={fields.date}
                onChange={e => set('date', e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{t.common.type}</span>
              <select
                value={fields.direction}
                onChange={e => set('direction', e.target.value as 'income' | 'expense')}
                className={inputCls}
              >
                <option value="expense">{t.common.expense}</option>
                <option value="income">{t.common.income}</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">{t.common.description}</span>
            <input
              type="text"
              placeholder={t.manualEntryForm.descriptionPlaceholder}
              value={fields.description}
              onChange={e => set('description', e.target.value)}
              className={inputCls}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{t.common.amount}</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={fields.amount}
                onChange={e => set('amount', e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{t.common.category}</span>
              {/* datalist = autocomplete over existing categories, still allows typing a new one */}
              <input
                type="text"
                list="category-list"
                placeholder={t.manualEntryForm.categoryPlaceholder}
                value={fields.category}
                onChange={e => set('category', e.target.value)}
                className={inputCls}
              />
              <datalist id="category-list">
                {categories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </label>
          </div>

          {fields.direction === 'expense' && (
            <div className="flex flex-col gap-1">
              <label className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">{t.manualEntryForm.installments}</span>
                {parseInt(fields.installments) > 1 && !isNaN(parseFloat(fields.amount.replace(',', '.'))) && (
                  <span className="text-xs text-zinc-400">
                    {t.manualEntryForm.installmentsSummary(
                      parseInt(fields.installments),
                      (Math.floor(Math.round(parseFloat(fields.amount.replace(',', '.')) * 100) / parseInt(fields.installments)) / 100).toFixed(2),
                    )}
                  </span>
                )}
              </label>
              <input
                type="number"
                min={1}
                max={36}
                value={fields.installments}
                onChange={e => set('installments', e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {accounts.length > 0 && (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{t.common.account}</span>
              <select
                value={String(fields.accountId)}
                onChange={e => set('accountId', e.target.value)}
                className={inputCls}
              >
                <option value="">{t.common.noAccount}</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </label>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg border border-border px-4 py-2 text-sm text-body hover:bg-muted"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              {t.common.save}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

const inputCls = 'rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
