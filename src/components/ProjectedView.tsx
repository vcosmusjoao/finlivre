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

type AccountMap = Map<number, Account>;

export function ProjectedView({ hideWhenEmpty = false }: { hideWhenEmpty?: boolean }) {
  const { selectedMonth } = useMonth();
  const { selectedAccountId } = useAccountFilter();

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
      description: items[i]?.description ?? 'Recorrente',
    }));
  }, [selectedMonth], [] as { recurringItemId: number; description: string }[]);

  if (!projection) return <p className="text-sm text-zinc-500">Calculando projeção…</p>;

  const income  = projection.items.filter(i => i.direction === 'income');
  const expense = projection.items.filter(i => i.direction === 'expense');

  if (projection.items.length === 0 && skipped.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <div className="text-center py-10 text-zinc-400 text-sm">
        <p className="text-2xl mb-2">🎉</p>
        <p>Nenhum compromisso futuro detectado para este mês.</p>
        <p className="text-xs mt-1 text-zinc-300">Parcelas e recorrentes aparecerão aqui automaticamente.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {income.length > 0 && (
        <Section
          title="Receitas previstas"
          items={income}
          accountMap={accountMap}
          month={selectedMonth}
          amountColor="text-emerald-600"
          sign="+"
        />
      )}
      {expense.length > 0 && (
        <Section
          title="Despesas comprometidas"
          items={expense}
          accountMap={accountMap}
          month={selectedMonth}
          amountColor="text-zinc-900 dark:text-zinc-100"
          sign="-"
        />
      )}

      {skipped.length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-2">Ocultos este mês</p>
          <div className="flex flex-col gap-1">
            {skipped.map(s => (
              <div key={s.recurringItemId} className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="line-through flex-1 truncate">{s.description}</span>
                <button
                  type="button"
                  onClick={() => clearRecurringOverride(s.recurringItemId, selectedMonth)}
                  className="text-xs text-indigo-500 hover:text-indigo-600"
                >
                  restaurar
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
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{title}</p>
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
    <div className="flex flex-col gap-1.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      {/* Line 1: account dot + full description + amount */}
      <div className="flex items-center gap-2">
        {item.accountId !== undefined
          ? <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accountMap.get(item.accountId)?.color ?? '#6B7280' }} />
          : <span className="w-2 h-2 rounded-full flex-shrink-0 bg-zinc-300 dark:bg-zinc-600" />
        }
        <span className="text-sm text-zinc-800 dark:text-zinc-200 flex-1 truncate" title={item.description}>
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
            className="w-24 rounded border border-indigo-400 bg-white dark:bg-zinc-800 px-2 py-0.5 text-sm text-right tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        ) : (
          <button
            type="button"
            disabled={!editable}
            onClick={startEdit}
            title={editable ? 'Clique para ajustar só este mês' : undefined}
            className={`text-sm font-medium tabular-nums ${amountColor} whitespace-nowrap ${editable ? 'hover:underline decoration-dotted cursor-pointer' : 'cursor-default'}`}
          >
            {sign} {formatBRL(item.amountCents)}
          </button>
        )}
      </div>

      {/* Line 2: badges + category chip + (recurring) per-month controls */}
      <div className="flex items-center gap-2 flex-wrap pl-4">
        {item.installment && (
          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full whitespace-nowrap">
            {item.installment.current}/{item.installment.total}
          </span>
        )}
        {item.type === 'recurring' && (
          <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-500 px-2 py-0.5 rounded-full whitespace-nowrap">
            fixo
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colorForCategory(item.category) }} />
          {item.category}
        </span>

        {item.overridden && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            ajustado
            <button
              type="button"
              onClick={() => clearRecurringOverride(item.recurringItemId!, month)}
              title="Voltar ao valor original"
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
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 ml-auto"
          >
            pular este mês
          </button>
        )}
      </div>
    </div>
  );
}
