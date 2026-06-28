'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { monthLabel, effectiveMonth } from '@/lib/format';
import { useMonth } from '@/context/MonthContext';

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useMonth();

  const months = useLiveQuery(() =>
    db.entries.toArray().then(entries => {
      const set = new Set(entries.map(e => effectiveMonth(e)));
      return [...set].sort().reverse(); // most recent first
    })
  , [], [] as string[]);

  if (!months.length) return null;

  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
      <Tab label="Todos" active={selectedMonth === ''} onClick={() => setSelectedMonth('')} />
      {months.map(m => (
        <Tab
          key={m}
          label={monthLabel(m)}
          active={selectedMonth === m}
          onClick={() => setSelectedMonth(m)}
        />
      ))}
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600'
      }`}
    >
      {label}
    </button>
  );
}
