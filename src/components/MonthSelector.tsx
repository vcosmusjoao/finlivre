'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { monthLabel, effectiveMonth, currentMonth, addMonths } from '@/lib/format';
import { useMonth } from '@/context/MonthContext';
import { useLocale } from '@/i18n/LocaleContext';

// Always expose the next 3 months as future tabs so the user can see commitments ahead
const FUTURE_COUNT = 3;

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useMonth();
  const { locale, t } = useLocale();
  const now = currentMonth();

  const pastMonths = useLiveQuery(() =>
    db.entries.toArray().then(entries => {
      const set = new Set(entries.map(e => effectiveMonth(e)));
      set.add(now); // current month always visible, even with no entries yet
      return [...set].filter(m => m <= now).sort().reverse();
    })
  , [now], [] as string[]);

  const futureMonths = Array.from({ length: FUTURE_COUNT }, (_, i) =>
    addMonths(now, i + 1)
  );

  if (!pastMonths.length && futureMonths.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
      <Tab label={t.monthSelector.overview} active={selectedMonth === ''} onClick={() => setSelectedMonth('')} />

      {/* Past and current months — newest first */}
      {pastMonths.map(m => (
        <Tab
          key={m}
          label={monthLabel(m, locale)}
          active={selectedMonth === m}
          onClick={() => setSelectedMonth(m)}
        />
      ))}

      {/* Divider */}
      <span className="text-zinc-300 dark:text-zinc-600 select-none px-1">|</span>

      {/* Future months — visually distinct with dashed border */}
      {futureMonths.map(m => (
        <Tab
          key={m}
          label={monthLabel(m, locale)}
          active={selectedMonth === m}
          onClick={() => setSelectedMonth(m)}
          future
        />
      ))}
    </div>
  );
}

function Tab({
  label, active, onClick, future = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  future?: boolean;
}) {
  if (active) {
    return (
      <button onClick={onClick}
        className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-indigo-600 text-white">
        {label}
      </button>
    );
  }
  if (future) {
    return (
      <button onClick={onClick}
        className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border border-dashed border-indigo-300 dark:border-indigo-700 text-primary-muted hover:border-indigo-500 hover:text-primary">
        {label}
      </button>
    );
  }
  return (
    <button onClick={onClick}
      className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors bg-card border border-border text-body hover:border-indigo-400 hover:text-indigo-600">
      {label}
    </button>
  );
}
