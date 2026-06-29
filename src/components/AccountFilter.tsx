'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account } from '@/lib/db';
import { useMonth } from '@/context/MonthContext';
import { useAccountFilter } from '@/context/AccountFilterContext';

/**
 * Global account filter row — the account-scoped sibling of MonthSelector.
 * Selecting an account scopes every total (cards, donut, table, invoices) to it.
 *
 * Only shown for a specific month: the "Todos" (all-time) dashboard aggregates
 * differently and doesn't react to this filter, so we hide it there to avoid an
 * orphaned control.
 */
export function AccountFilter() {
  const { selectedMonth } = useMonth();
  const { selectedAccountId, setSelectedAccountId } = useAccountFilter();
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], [] as Account[]);

  // No accounts yet, or all-time view → nothing meaningful to filter by here.
  if (accounts.length === 0 || !selectedMonth) return null;

  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
      <Pill
        label="Todas as contas"
        active={selectedAccountId === 'all'}
        onClick={() => setSelectedAccountId('all')}
      />
      {accounts.map(acc => (
        <Pill
          key={acc.id}
          label={acc.name}
          color={acc.color}
          active={selectedAccountId === acc.id}
          onClick={() => setSelectedAccountId(acc.id!)}
        />
      ))}
      <Pill
        label="Manual"
        active={selectedAccountId === 'manual'}
        onClick={() => setSelectedAccountId('manual')}
      />
    </div>
  );
}

function Pill({
  label, active, onClick, color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600'
      }`}
    >
      {color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />}
      {label}
    </button>
  );
}
