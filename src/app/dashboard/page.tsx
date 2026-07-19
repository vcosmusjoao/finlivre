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
import { useLocale } from '@/i18n/LocaleContext';

export default function DashboardPage() {
  const { selectedMonth } = useMonth();
  const { t } = useLocale();
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
          <div className="bg-card rounded-xl border border-border-subtle p-6 flex flex-col items-center">
            <h2 className="text-sm font-medium text-muted-foreground mb-4 self-start">{t.dashboardPage.spendingByCategory}</h2>
            <SpendingChart />
          </div>
          <div className="bg-card rounded-xl border border-border-subtle p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">{t.dashboardPage.spendingByAccount}</h2>
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
        <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t.dashboardPage.futureMonthNotice}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t.dashboardPage.seeCommitmentsIn}{' '}
            <Link href="/lancamentos" className="text-indigo-500 hover:underline">{t.nav.transactions}</Link>.
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
        <div className="bg-card rounded-xl border border-border-subtle p-6 flex flex-col items-center">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 self-start">{t.dashboardPage.spendingByCategory}</h2>
          <SpendingChart />
        </div>
        <div className="lg:col-span-2 bg-card rounded-xl border border-border-subtle p-6">
          <TransactionsTable />
        </div>
      </div>

      {isCurrentMonth && (
        <div className="bg-card rounded-xl border border-border-subtle p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">{t.dashboardPage.expectedThisMonth}</h2>
          <ProjectedView hideWhenEmpty />
        </div>
      )}

      <IncomeExpenseChart />
    </>
  );
}
