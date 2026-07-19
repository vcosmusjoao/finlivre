'use client';

import { SpendingChart } from '@/components/SpendingChart';
import { SpendingByAccountChart } from '@/components/SpendingByAccountChart';
import { IncomeExpenseChart } from '@/components/IncomeExpenseChart';
import { TransactionsTable } from '@/components/TransactionsTable';
import { useLocale } from '@/i18n/LocaleContext';

export function AllTimeDashboard() {
  const { t } = useLocale();
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-xl border border-border-subtle p-6 flex flex-col items-center">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 self-start">
            {t.dashboardPage.spendingByCategory}
          </h2>
          <SpendingChart />
        </div>
        <div className="bg-card rounded-xl border border-border-subtle p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            {t.dashboardPage.spendingByAccount}
          </h2>
          <SpendingByAccountChart />
        </div>
      </div>

      <IncomeExpenseChart />

      <div className="bg-card rounded-xl border border-border-subtle p-6 mt-6">
        <TransactionsTable />
      </div>
    </>
  );
}
