'use client';

import { useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account } from '@/lib/db';
import { formatBRL } from '@/lib/format';
import { colorForCategory } from '@/lib/categoryColor';
import { getProjectedMonth, type ProjectedItem } from '@/lib/projection';
import {
  setRecurringAmountOverride,
  skipRecurringForMonth,
  clearRecurringOverride,
} from '@/lib/recurringOverrides';
import { useMonth } from '@/context/MonthContext';
import { useAccountFilter } from '@/context/AccountFilterContext';
import { useLocale } from '@/i18n/LocaleContext';

type AccountMap = Map<number, Account>;

export function ProjectedView({ hideWhenEmpty = false }: { hideWhenEmpty?: boolean }) {
  const { selectedMonth } = useMonth();
  const { selectedAccountId } = useAccountFilter();
  const { t } = useLocale();

  const projection = useLiveQuery(
    () => selectedMonth ? getProjectedMonth(selectedMonth, selectedAccountId) : Promise.resolve(null),
    [selectedMonth, selectedAccountId]
  );

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const accountMap = useMemo<AccountMap>(
    () => new Map(accounts?.map(a => [a.id!, a]) ?? []),
    [accounts]
  );

  // Recurring items skipped for this month — kept out of the projection (so totals stay
  // correct), but surfaced here so the user has a way to restore them.
  const skipped = useLiveQuery(async () => {
    if (!selectedMonth) return [] as { recurringItemId: number; description: string }[];
    const overrides = await db.recurringOverrides.where('month').equals(selectedMonth).toArray();
    const skips = overrides.filter(o => o.skip);
    if (skips.length === 0) return [];
    const items = await db.recurringItems.bulkGet(skips.map(s => s.recurringItemId));
    return skips.map((s, i) => ({
      recurringItemId: s.recurringItemId,
      description: items[i]?.description ?? t.projectedView.recurringFallback,
    }));
  }, [selectedMonth, t], [] as { recurringItemId: number; description: string }[]);

  if (!projection) return <p className="text-sm text-zinc-500">{t.projectedView.calculating}</p>;

  const income  = projection.items.filter(i => i.direction === 'income');
  const expense = projection.items.filter(i => i.direction === 'expense');

  if (projection.items.length === 0 && skipped.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <div className="text-center py-10 text-zinc-400 text-sm">
        <p className="text-2xl mb-2">🎉</p>
        <p>{t.projectedView.emptyTitle}</p>
        <p className="text-xs mt-1 text-zinc-300">{t.projectedView.emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {income.length > 0 && (
        <Section
          title={t.projectedView.expectedIncome}
          items={income}
          accountMap={accountMap}
          month={selectedMonth}
          amountColor="text-emerald-600"
          sign="+"
        />
      )}
      {expense.length > 0 && (
        <Section
          title={t.projectedView.committedExpenses}
          items={expense}
          accountMap={accountMap}
          month={selectedMonth}
          amountColor="text-foreground"
          sign="-"
        />
      )}

      {skipped.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{t.projectedView.hiddenThisMonth}</p>
          <div className="flex flex-col gap-1">
            {skipped.map(s => (
              <div key={s.recurringItemId} className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="line-through flex-1 truncate">{s.description}</span>
                <button
                  type="button"
                  onClick={() => clearRecurringOverride(s.recurringItemId, selectedMonth)}
                  className="text-xs text-indigo-500 hover:text-indigo-600"
                >
                  {t.projectedView.restore}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, items, accountMap, month, amountColor, sign }: {
  title: string;
  items: ProjectedItem[];
  accountMap: AccountMap;
  month: string;
  amountColor: string;
  sign: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
      <div className="flex flex-col">
        {items.map((item, i) => (
          <ProjectedRow
            key={item.recurringItemId !== undefined ? `r${item.recurringItemId}` : `i${i}`}
            item={item}
            accountMap={accountMap}
            month={month}
            amountColor={amountColor}
            sign={sign}
          />
        ))}
      </div>
    </div>
  );
}

/** Parses "5004,00" / "5004.00" to integer cents. Returns null if invalid. */
function parseAmountToCents(input: string): number | null {
  const cents = Math.round(parseFloat(input.replace(',', '.')) * 100);
  return isNaN(cents) || cents <= 0 ? null : cents;
}

function ProjectedRow({ item, accountMap, month, amountColor, sign }: {
  item: ProjectedItem;
  accountMap: AccountMap;
  month: string;
  amountColor: string;
  sign: string;
}) {
  const { t } = useLocale();
  const editable = item.type === 'recurring' && item.recurringItemId !== undefined;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setValue((item.amountCents / 100).toFixed(2).replace('.', ','));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function commit() {
    const cents = parseAmountToCents(value);
    if (cents !== null && cents !== item.amountCents) {
      await setRecurringAmountOverride(item.recurringItemId!, month, cents);
    }
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-1.5 py-2.5 border-b border-border-divider last:border-0">
      {/* Line 1: account dot + full description + amount */}
      <div className="flex items-center gap-2">
        {item.accountId !== undefined
          ? <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accountMap.get(item.accountId)?.color ?? '#6B7280' }} />
          : <span className="w-2 h-2 rounded-full flex-shrink-0 bg-zinc-300 dark:bg-zinc-600" />
        }
        <span className="text-sm text-body flex-1 truncate" title={item.description}>
          {item.description}
        </span>

        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={commit}
            inputMode="decimal"
            className="w-24 rounded border border-indigo-400 bg-muted px-2 py-0.5 text-sm text-right tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        ) : (
          <button
            type="button"
            disabled={!editable}
            onClick={startEdit}
            title={editable ? t.projectedView.adjustHint : undefined}
            className={`text-sm font-medium tabular-nums ${amountColor} whitespace-nowrap ${editable ? 'hover:underline decoration-dotted cursor-pointer' : 'cursor-default'}`}
          >
            {sign} {formatBRL(item.amountCents)}
          </button>
        )}
      </div>

      {/* Line 2: badges + category chip + (recurring) per-month controls */}
      <div className="flex items-center gap-2 flex-wrap pl-4">
        {item.installment && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full whitespace-nowrap">
            {item.installment.current}/{item.installment.total}
          </span>
        )}
        {item.type === 'recurring' && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
            {t.projectedView.fixedBadge}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs bg-muted text-zinc-500 px-2 py-0.5 rounded-full">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colorForCategory(item.category) }} />
          {item.category}
        </span>

        {item.overridden && (
          <span className="inline-flex items-center gap-1 text-xs text-warning">
            {t.projectedView.adjusted}
            <button
              type="button"
              onClick={() => clearRecurringOverride(item.recurringItemId!, month)}
              title={t.projectedView.revertHint}
              className="hover:text-amber-700 dark:hover:text-amber-300"
            >
              ✕
            </button>
          </span>
        )}

        {editable && !editing && (
          <button
            type="button"
            onClick={() => skipRecurringForMonth(item.recurringItemId!, month)}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-auto"
          >
            {t.projectedView.skipThisMonth}
          </button>
        )}
      </div>
    </div>
  );
}
