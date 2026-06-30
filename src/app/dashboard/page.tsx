'use client';

import { useMonth } from '@/context/MonthContext';
import { currentMonth } from '@/lib/format';
import { SummaryCards } from '@/components/SummaryCards';
import { InvoiceCards } from '@/components/InvoiceCards';
import { SpendingChart } from '@/components/SpendingChart';
import { SpendingByAccountChart } from '@/components/SpendingByAccountChart';
import { IncomeExpenseChart } from '@/components/IncomeExpenseChart';
import { TransactionsTable } from '@/components/TransactionsTable';
import { ProjectedView } from '@/components/ProjectedView';
import Link from 'next/link';

export default function DashboardPage() {
  const { selectedMonth } = useMonth();
  const now = currentMonth();
  const isFuture = !!selectedMonth && selectedMonth > now;
  const isCurrentMonth = !!selectedMonth && selectedMonth === now;

  // Geral (no month selected): aggregate charts, no table
  if (!selectedMonth) {
    return (
      <>
        <SummaryCards />
        <InvoiceCards />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 self-start">Gastos por categoria</h2>
            <SpendingChart />
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Gastos por conta</h2>
            <SpendingByAccountChart />
          </div>
        </div>
        <IncomeExpenseChart />
      </>
    );
  }

  // Future month: summary cards only, projections live in Lançamentos
  if (isFuture) {
    return (
      <>
        <SummaryCards />
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Mês futuro — sem dados reais ainda.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
            Veja os compromissos previstos em{' '}
            <Link href="/lancamentos" className="text-indigo-500 hover:underline">Lançamentos</Link>.
          </p>
        </div>
      </>
    );
  }

  // Past or current month: charts + table + projection (if current)
  return (
    <>
      <SummaryCards />
      <InvoiceCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 self-start">Gastos por categoria</h2>
          <SpendingChart />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <TransactionsTable />
        </div>
      </div>

      {isCurrentMonth && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Previstos para este mês</h2>
          <ProjectedView hideWhenEmpty />
        </div>
      )}

      <IncomeExpenseChart />
    </>
  );
}
