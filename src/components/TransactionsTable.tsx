'use client';

import { useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '@/lib/db';
import { useMonth } from '@/context/MonthContext';
import { useAccountFilter } from '@/context/AccountFilterContext';
import { matchesFilters } from '@/lib/filters';
import { colorForCategory } from '@/lib/categoryColor';
import { learnRule } from '@/lib/categorize';
import { formatDate } from '@/lib/format';

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

  const entries = useLiveQuery(() =>
    db.entries.orderBy('date').reverse()
      .and(e => matchesFilters(e, { month: selectedMonth, accountId: selectedAccountId }))
      .toArray()
  , [selectedMonth, selectedAccountId]);

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const accountMap = useMemo(
    () => new Map(accounts?.map(a => [a.id!, a]) ?? []),
    [accounts]
  );

  const categories = useLiveQuery(() =>
    db.entries.orderBy('category').uniqueKeys() as Promise<string[]>
  , [], []);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  if (!entries) return <p className="text-sm text-zinc-500">Carregando...</p>;
  if (entries.length === 0) return <p className="text-sm text-zinc-500">Nenhuma transação importada ainda.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="py-2 pr-4 text-left font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Data</th>
            <th className="py-2 pr-4 text-left font-medium text-zinc-500 dark:text-zinc-400">Descrição</th>
            <th className="py-2 pr-4 text-left font-medium text-zinc-500 dark:text-zinc-400">Categoria</th>
            <th className="py-2 pr-4 text-right font-medium text-zinc-500 dark:text-zinc-400">Valor</th>
            <th className="py-2 w-8" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="group border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">

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

              <td className="py-3 pr-4 text-zinc-900 dark:text-zinc-100">{entry.description}</td>

              <td className="py-3 pr-4">
                {entry.direction === 'transfer' ? (
                  <span className="inline-block rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 italic">
                    pagamento fatura
                  </span>
                ) : editingId === entry.id ? (
                  /* ── Inline category editor ── */
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
                      className="rounded border border-indigo-400 bg-white dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-900 dark:text-zinc-100 w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <datalist id="cat-datalist">
                      {categories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                ) : (
                  /* ── Category chip (clickable to edit) ── */
                  <button
                    type="button"
                    onClick={() => startEdit(entry)}
                    title="Clique para categorizar"
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs transition-colors text-left ${
                      entry.category === 'Uncategorized'
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-dashed border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                    }`}
                  >
                    {entry.category === 'Uncategorized' ? (
                      '? Categorizar'
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
                entry.direction === 'transfer' ? 'text-zinc-400 dark:text-zinc-500' :
                'text-zinc-900 dark:text-zinc-100'
              }`}>
                {entry.direction === 'income' ? '+' : entry.direction === 'transfer' ? '' : '-'} R$ {(entry.amountCents / 100).toFixed(2)}
              </td>

              <td className="py-3 text-right">
                <button
                  type="button"
                  onClick={() => deleteEntry(entry)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                  aria-label="Apagar entrada"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
