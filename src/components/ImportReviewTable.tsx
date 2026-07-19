'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { categorize, learnRule } from '@/lib/categorize';
import { effectiveMonth, addMonths, monthLabel } from '@/lib/format';
import type { ParsedEntry } from '@/lib/importers/ofx';
import { useLocale } from '@/i18n/LocaleContext';

interface ReviewRow {
  date: string;
  billingMonth: string;
  description: string;
  amount: string; // reais, BR format (comma decimal)
  direction: 'expense' | 'income' | 'transfer';
  category: string;
  installment?: { current: number; total: number };
}

export interface CommitInput {
  entries: ParsedEntry[];
  accountId?: number;
  invoiceTotalCents?: number;
  billingMonth: string;
}

interface Props {
  open: boolean;
  entries: ParsedEntry[];
  source: 'ofx' | 'pdf';
  defaultAccountId?: number;
  defaultBillingMonth: string;
  defaultInvoiceTotalCents?: number | null;
  fromCache?: boolean;
  onConfirm: (result: CommitInput) => void;
  onCancel: () => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Shared review-before-commit step for every import source (OFX, vision/PDF).
 * Uncontrolled: the parent only hands over the parsed entries and reads the
 * final result on confirm — every keystroke of editing stays in here.
 */
export function ImportReviewTable({
  open,
  entries,
  source,
  defaultAccountId,
  defaultBillingMonth,
  defaultInvoiceTotalCents,
  fromCache,
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { locale, t } = useLocale();

  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [billingMonth, setBillingMonth] = useState(defaultBillingMonth);
  const [accountId, setAccountId] = useState('');
  const [invoiceTotal, setInvoiceTotal] = useState('');
  const [error, setError] = useState<string | null>(null);

  const categories = useLiveQuery(
    () => db.entries.orderBy('category').uniqueKeys() as Promise<string[]>,
    [], [],
  );
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);

  // Seed internal state from props whenever the table is (re)opened.
  useEffect(() => {
    if (!open) {
      dialogRef.current?.close();
      return;
    }
    let cancelled = false;
    (async () => {
      const cats = await Promise.all(entries.map(p => categorize(p.description)));
      if (cancelled) return;
      setError(null);
      setBillingMonth(defaultBillingMonth);
      setAccountId(defaultAccountId !== undefined ? String(defaultAccountId) : '');
      setInvoiceTotal(
        defaultInvoiceTotalCents != null
          ? (defaultInvoiceTotalCents / 100).toFixed(2).replace('.', ',')
          : '',
      );
      setRows(
        entries.map((p, i) => ({
          date: p.date,
          billingMonth: effectiveMonth(p),
          description: p.description,
          amount: (p.amountCents / 100).toFixed(2).replace('.', ','),
          direction: p.direction,
          category: cats[i] === 'Uncategorized' ? '' : cats[i],
          installment: p.installment,
        })),
      );
      dialogRef.current?.showModal();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entries]);

  function updateRow(i: number, key: keyof ReviewRow, value: string) {
    setRows(rs => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }
  function removeRow(i: number) {
    setRows(rs => rs.filter((_, idx) => idx !== i));
  }
  function addRow() {
    setRows(rs => [...rs, { date: today(), billingMonth, description: '', amount: '', direction: 'expense', category: '' }]);
  }
  function applyMonthToAll() {
    setRows(rs => rs.map(r => ({ ...r, billingMonth })));
  }

  async function handleConfirm() {
    const parsed: ParsedEntry[] = [];
    for (const r of rows) {
      const cents = Math.round(parseFloat(r.amount.replace(',', '.')) * 100);
      if (!r.description.trim() || isNaN(cents) || cents <= 0) continue;
      parsed.push({
        date: r.date,
        billingMonth: r.billingMonth,
        description: r.description.trim(),
        amountCents: Math.abs(cents),
        direction: r.direction,
        installment: r.installment,
        source,
      });
    }
    if (parsed.length === 0) {
      setError(t.importReview.noValidRows);
      return;
    }
    await Promise.all(
      rows.filter(r => r.category.trim() && r.description.trim())
        .map(r => learnRule(r.description.trim(), r.category.trim())),
    );

    const acc = accountId !== '' ? Number(accountId) : undefined;
    const totalCents = invoiceTotal.trim()
      ? Math.round(parseFloat(invoiceTotal.replace(',', '.')) * 100)
      : undefined;

    onConfirm({
      entries: parsed,
      accountId: acc,
      invoiceTotalCents: totalCents !== undefined && !isNaN(totalCents) && totalCents > 0 ? totalCents : undefined,
      billingMonth,
    });
  }

  const monthOptions = [-2, -1, 0, 1, 2].map(n => addMonths(defaultBillingMonth, n));

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 w-full max-w-4xl shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-base font-semibold text-foreground">
          {t.importReview.title}
        </h2>
        {fromCache && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">
            {t.importReview.cacheHint}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        {t.importReview.subtitle}
      </p>

      <div className="max-h-[55vh] overflow-auto -mx-2 px-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-zinc-400">
              <th className="py-1 pr-2 font-medium">{t.importReview.headers.date}</th>
              <th className="py-1 pr-2 font-medium">{t.importReview.headers.month}</th>
              <th className="py-1 pr-2 font-medium">{t.importReview.headers.description}</th>
              <th className="py-1 pr-2 font-medium">{t.importReview.headers.amount}</th>
              <th className="py-1 pr-2 font-medium">{t.importReview.headers.type}</th>
              <th className="py-1 pr-2 font-medium">{t.importReview.headers.category}</th>
              <th className="py-1" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border-divider">
                <td className="py-1 pr-2">
                  <input type="date" value={r.date} onChange={e => updateRow(i, 'date', e.target.value)} className={cellCls} />
                </td>
                <td className="py-1 pr-2">
                  <select value={r.billingMonth} onChange={e => updateRow(i, 'billingMonth', e.target.value)} className={cellCls}>
                    {[...new Set([r.billingMonth, ...monthOptions])].map(m => (
                      <option key={m} value={m}>{monthLabel(m, locale)}</option>
                    ))}
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="text"
                    value={r.description}
                    onChange={e => updateRow(i, 'description', e.target.value)}
                    className={`${cellCls} min-w-40`}
                  />
                  {r.installment && (
                    <span className="ml-1 text-[10px] text-zinc-400">{r.installment.current}/{r.installment.total}</span>
                  )}
                </td>
                <td className="py-1 pr-2">
                  <input type="text" inputMode="decimal" value={r.amount} onChange={e => updateRow(i, 'amount', e.target.value)} className={`${cellCls} w-24`} />
                </td>
                <td className="py-1 pr-2">
                  <select value={r.direction} onChange={e => updateRow(i, 'direction', e.target.value)} className={cellCls}>
                    <option value="expense">{t.common.expense}</option>
                    <option value="income">{t.common.income}</option>
                    <option value="transfer">{t.common.transfer}</option>
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input type="text" list="import-review-category-list" value={r.category} onChange={e => updateRow(i, 'category', e.target.value)} className={`${cellCls} min-w-32`} />
                </td>
                <td className="py-1 text-right">
                  <button onClick={() => removeRow(i)} className="text-zinc-300 hover:text-red-500 px-1" title={t.importReview.remove}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="import-review-category-list">
          {categories.map(cat => <option key={cat} value={cat} />)}
        </datalist>
      </div>

      <button onClick={addRow} className="text-xs text-primary hover:underline mt-2">
        {t.importReview.addRow}
      </button>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-border-divider">
        <div className="flex items-center gap-4 flex-wrap">
          {accounts.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              {t.importReview.account}
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className={cellCls}>
                <option value="">{t.common.noAccount}</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            {t.importReview.billingMonth}
            <select value={billingMonth} onChange={e => setBillingMonth(e.target.value)} className={cellCls}>
              {[...new Set([billingMonth, ...monthOptions])].map(m => (
                <option key={m} value={m}>{monthLabel(m, locale)}</option>
              ))}
            </select>
          </label>
          <button onClick={applyMonthToAll} className="text-xs text-primary hover:underline">
            {t.importReview.applyMonthToAll}
          </button>
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            {t.importReview.invoiceTotal}
            <input
              type="text"
              inputMode="decimal"
              placeholder={t.importReview.invoiceTotalPlaceholder}
              value={invoiceTotal}
              onChange={e => setInvoiceTotal(e.target.value)}
              className={`${cellCls} w-36`}
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm text-body hover:bg-muted"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            {t.importReview.importRows(rows.length)}
          </button>
        </div>
      </div>
    </dialog>
  );
}

const cellCls = 'rounded-md border border-border bg-muted px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500';
