'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatBRL, currentMonth } from '@/lib/format';
import { buildIncomeExpenseSeries } from '@/lib/incomeExpenseSeries';
import { getProjectedMonth } from '@/lib/projection';
import { matchesAccount } from '@/lib/filters';
import { useAccountFilter } from '@/context/AccountFilterContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocale } from '@/i18n/LocaleContext';
import { useChartTheme } from '@/hooks/useChartTheme';

/**
 * Recharts v3's auto-generated Legend doesn't reliably follow Bar declaration
 * order (it was rendering "Expenses" before "Income" despite Income being the
 * first <Bar>), and the v3 Legend props no longer accept a `payload` override —
 * so it's rendered explicitly here instead, in the exact order we want.
 */
function renderLegend(incomeLabel: string, expenseLabel: string) {
  return (
    <ul className="flex justify-center gap-4 text-xs mt-2">
      {[{ label: incomeLabel, color: '#10b981' }, { label: expenseLabel, color: '#f87171' }].map(({ label, color }) => (
        <li key={label} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function IncomeExpenseChart() {
  const { t, locale } = useLocale();
  const { selectedAccountId } = useAccountFilter();
  const chartTheme = useChartTheme();

  // The trend chart always shows the full picture across every month with data —
  // it is not scoped to the selected month (that's the summary cards' job) — but it
  // does respect the account filter, same as every other chart on the dashboard.
  const entries = useLiveQuery(
    () => db.entries.filter(e => matchesAccount(e.accountId, selectedAccountId)).toArray(),
    [selectedAccountId], [],
  );

  // The current month's income is often projection-only (e.g. salary is a recurring
  // item not yet imported as a real entry). Fold that projection in so the chart
  // matches the summary cards instead of showing an empty Receitas bar. See PLAN §.
  const now = currentMonth();
  const projection = useLiveQuery(
    () => getProjectedMonth(now, selectedAccountId),
    [now, selectedAccountId],
  );

  if (!entries.length) return null;

  const data = buildIncomeExpenseSeries(entries, projection
    ? { [now]: { income: projection.totalIncomeCents, expense: projection.totalExpenseCents } }
    : {}, locale);

  return (
    <div className="bg-card rounded-xl border border-border-subtle p-6 mt-6">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">{t.incomeExpenseChart.title}</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={4}>
          <XAxis dataKey="month" tick={{ fontSize: 12, ...chartTheme.tick }} />
          <YAxis tickFormatter={v => `R$${(v / 100).toFixed(0)}`} tick={{ fontSize: 11, ...chartTheme.tick }} width={60} />
          <Tooltip formatter={(value) => formatBRL(value as number)} {...chartTheme.tooltip} />
          <Bar dataKey="Receitas" name={t.totals.income} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={64} />
          <Bar dataKey="Gastos" name={t.totals.expenses} fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={64} />
        </BarChart>
      </ResponsiveContainer>
      {renderLegend(t.totals.income, t.totals.expenses)}
    </div>
  );
}
