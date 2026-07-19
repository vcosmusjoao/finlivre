'use client';

import { useMonth } from '@/context/MonthContext';
import { currentMonth } from '@/lib/format';
import { SpendingChart } from '@/components/SpendingChart';
import { TransactionsTable } from '@/components/TransactionsTable';
import { IncomeExpenseChart } from '@/components/IncomeExpenseChart';
import { ProjectedView } from '@/components/ProjectedView';
import { AllTimeDashboard } from '@/components/AllTimeDashboard';
import { useLocale } from '@/i18n/LocaleContext';

export function DashboardBody() {
  const { selectedMonth } = useMonth();
  const { t } = useLocale();
  const now = currentMonth();
  const isFuture = !!selectedMonth && selectedMonth > now;
  const isCurrentMonth = !!selectedMonth && selectedMonth === now;

  if (!selectedMonth) {
    return <AllTimeDashboard />;
  }

  if (isFuture) {
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-card rounded-xl border border-border-subtle p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-muted-foreground">{t.dashboardBody.upcomingCommitments}</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {t.dashboardBody.projection}
              </span>
            </div>
            <ProjectedView />
          </div>
          <div className="lg:col-span-2 bg-card rounded-xl border border-border-subtle p-6">
            <TransactionsTable />
          </div>
        </div>
        <IncomeExpenseChart />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-xl border border-border-subtle p-6 flex flex-col items-center">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 self-start">{t.dashboardBody.spendingByCategory}</h2>
          <SpendingChart />
        </div>
        <div className="lg:col-span-2 bg-card rounded-xl border border-border-subtle p-6">
          <TransactionsTable />
        </div>
      </div>

      {isCurrentMonth && (
        <div className="bg-card rounded-xl border border-border-subtle p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">{t.dashboardBody.expectedThisMonth}</h2>
          <ProjectedView hideWhenEmpty />
        </div>
      )}

      <IncomeExpenseChart />
    </>
  );
}
