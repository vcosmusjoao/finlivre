'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '@/lib/db';
import { useMonth } from '@/context/MonthContext';
import { useAccountFilter } from '@/context/AccountFilterContext';
import { matchesFilters } from '@/lib/filters';
import { colorForCategory } from '@/lib/categoryColor';
import { learnRule, normalizeMerchant } from '@/lib/categorize';
import { formatDate, monthLabel } from '@/lib/format';
import { useLocale } from '@/i18n/LocaleContext';

interface RetroPrompt {
  category: string;
  candidates: Entry[];
}

async function deleteEntry(entry: Entry) {
  await db.entries.delete(entry.id!);
}

async function saveCategory(entry: Entry, newCategory: string) {
  const trimmed = newCategory.trim();
  if (!trimmed || trimmed === entry.category) return;
  await db.entries.update(entry.id!, { category: trimmed });
  await learnRule(entry.description, trimmed);
}

export function TransactionsTable() {
  const { selectedMonth } = useMonth();
  const { selectedAccountId } = useAccountFilter();
  const { locale, t } = useLocale();

  const entries = useLiveQuery(() =>
    db.entries.orderBy('date').reverse()
      .and(e => matchesFilters(e, { month: selectedMonth, accountId: selectedAccountId }))
      .toArray()
  , [selectedMonth, selectedAccountId], [] as Entry[]);

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const accountMap = useMemo(
    () => new Map(accounts?.map(a => [a.id!, a]) ?? []),
    [accounts]
  );

  const categories = useLiveQuery(() =>
    db.entries.orderBy('category').uniqueKeys() as Promise<string[]>
  , [], [] as string[]);

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Batch selection state
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState('');
  const [retroPrompt, setRetroPrompt] = useState<RetroPrompt | null>(null);
  const headerCheckRef = useRef<HTMLInputElement>(null);
  const retroDialogRef = useRef<HTMLDialogElement>(null);

  const allChecked = entries.length > 0 && selected.size === entries.length;
  const someChecked = selected.size > 0 && selected.size < entries.length;

  // Clear selection when filters change
  useEffect(() => { setSelected(new Set()); }, [selectedMonth, selectedAccountId]);

  // Indeterminate state on header checkbox
  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  // Open retro dialog when prompt arrives
  useEffect(() => {
    if (retroPrompt) retroDialogRef.current?.showModal();
  }, [retroPrompt]);

  function startEdit(entry: Entry) {
    setEditingId(entry.id!);
    setEditingValue(entry.category === 'Uncategorized' ? '' : entry.category);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function commitEdit(entry: Entry) {
    await saveCategory(entry, editingValue);
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(entries.map(e => e.id!)));
  }

  async function applyBulk() {
    if (!bulkCategory || selected.size === 0) return;
    const selectedEntries = entries.filter(e => selected.has(e.id!));

    // Update categories on selected entries
    await Promise.all(selectedEntries.map(e => db.entries.update(e.id!, { category: bulkCategory })));

    // Save MerchantRule for each unique merchant
    const uniqueMerchants = [...new Set(selectedEntries.map(e => normalizeMerchant(e.description)))];
    await Promise.all(uniqueMerchants.map(m => db.merchantRules.put({ merchant: m, category: bulkCategory })));

    // Find other Uncategorized entries from the same merchants (retroactive candidates)
    const candidates = await db.entries
      .filter(e =>
        e.category === 'Uncategorized' &&
        uniqueMerchants.includes(normalizeMerchant(e.description)) &&
        !selected.has(e.id!)
      )
      .toArray();

    setSelected(new Set());
    setBulkCategory('');

    if (candidates.length > 0) {
      setRetroPrompt({ category: bulkCategory, candidates });
    }
  }

  async function applyRetro() {
    if (!retroPrompt) return;
    await Promise.all(retroPrompt.candidates.map(e => db.entries.update(e.id!, { category: retroPrompt.category })));
    retroDialogRef.current?.close();
    setRetroPrompt(null);
  }

  function dismissRetro() {
    retroDialogRef.current?.close();
    setRetroPrompt(null);
  }

  const title = selectedMonth
    ? t.transactionsTable.titleForMonth(monthLabel(selectedMonth, locale))
    : t.transactionsTable.titleAll;
  const countLabel = t.transactionsTable.countLabel(entries.length);

  if (entries.length === 0) return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-body">{title}</p>
        <span className="text-xs text-zinc-400">{t.transactionsTable.countLabel(0)}</span>
      </div>
      <p className="text-sm text-zinc-500">{t.transactionsTable.empty}</p>
    </>
  );

  return (
    <>
      {/* Title + count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-body">{title}</p>
        <span className="text-xs text-zinc-400">{countLabel}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-2 w-8">
                <input
                  ref={headerCheckRef}
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label={t.transactionsTable.selectAll}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-2 pr-4 text-left font-medium text-muted-foreground whitespace-nowrap">{t.transactionsTable.headers.date}</th>
              <th className="py-2 pr-4 text-left font-medium text-muted-foreground">{t.transactionsTable.headers.description}</th>
              <th className="py-2 pr-4 text-left font-medium text-muted-foreground">{t.transactionsTable.headers.category}</th>
              <th className="py-2 pr-4 text-right font-medium text-muted-foreground">{t.transactionsTable.headers.amount}</th>
              <th className="py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isSelected = selected.has(entry.id!);
              return (
                <tr
                  key={entry.id}
                  className={`group border-b border-border-divider ${
                    isSelected
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <td className="py-3 pr-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(entry.id!)}
                      aria-label={t.transactionsTable.selectOne(entry.description)}
                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  <td className="py-3 pr-4 text-zinc-500 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: entry.accountId !== undefined
                            ? (accountMap.get(entry.accountId)?.color ?? '#6B7280')
                            : '#D1D5DB'
                        }}
                      />
                      {formatDate(entry.date)}
                    </div>
                  </td>

                  <td className="py-3 pr-4 text-foreground">{entry.description}</td>

                  <td className="py-3 pr-4">
                    {entry.direction === 'transfer' ? (
                      <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-zinc-400 italic">
                        {t.transactionsTable.invoicePayment}
                      </span>
                    ) : editingId === entry.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={inputRef}
                          list="cat-datalist"
                          value={editingValue}
                          onChange={e => setEditingValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit(entry);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          onBlur={() => commitEdit(entry)}
                          className="rounded border border-indigo-400 bg-muted px-2 py-0.5 text-xs text-foreground w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <datalist id="cat-datalist">
                          {categories.map(c => <option key={c} value={c} />)}
                        </datalist>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        title={t.transactionsTable.clickToCategorize}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs transition-colors text-left ${
                          entry.category === 'Uncategorized'
                            ? 'bg-warning/10 text-warning border border-dashed border-warning/30 hover:bg-warning/20'
                            : 'bg-zinc-100 dark:bg-zinc-700 text-body hover:bg-zinc-200 dark:hover:bg-zinc-600'
                        }`}
                      >
                        {entry.category === 'Uncategorized' ? (
                          t.transactionsTable.categorizePrompt
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colorForCategory(entry.category) }} />
                            {entry.category}
                          </>
                        )}
                      </button>
                    )}
                  </td>

                  <td className={`py-3 pr-4 text-right font-medium tabular-nums ${
                    entry.direction === 'income'   ? 'text-emerald-600' :
                    entry.direction === 'transfer' ? 'text-muted-foreground' :
                    'text-foreground'
                  }`}>
                    {entry.direction === 'income' ? '+' : entry.direction === 'transfer' ? '' : '-'} R$ {(entry.amountCents / 100).toFixed(2)}
                  </td>

                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                      aria-label={t.transactionsTable.deleteEntry}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating action bar — appears when rows are selected */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-900 text-white px-4 py-2.5 rounded-full shadow-2xl">
          <span className="text-sm font-medium whitespace-nowrap">
            {t.transactionsTable.selectedCount(selected.size)}
          </span>
          <div className="w-px h-4 bg-zinc-700" />
          <select
            value={bulkCategory}
            onChange={e => setBulkCategory(e.target.value)}
            className="bg-zinc-800 text-white text-sm rounded-full px-3 py-1 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 min-w-[10rem]"
          >
            <option value="">{t.transactionsTable.categoryPlaceholderOption}</option>
            {categories.filter(c => c !== 'Uncategorized').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulk}
            disabled={!bulkCategory}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
          >
            {t.transactionsTable.apply}
          </button>
          <button
            type="button"
            onClick={() => { setSelected(new Set()); setBulkCategory(''); }}
            aria-label={t.transactionsTable.cancelSelection}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Retroactive categorization confirmation */}
      <dialog
        ref={retroDialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card border border-border-subtle shadow-xl p-6 w-full max-w-sm"
      >
        {retroPrompt && (
          <>
            <h3 className="text-base font-semibold text-foreground mb-2">
              {t.transactionsTable.retroTitle}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {t.transactionsTable.retroBody(retroPrompt.candidates.length, retroPrompt.category)}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={dismissRetro}
                className="text-sm px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                {t.transactionsTable.onlySelected}
              </button>
              <button
                type="button"
                onClick={applyRetro}
                className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
              >
                {t.transactionsTable.applyToAll}
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
