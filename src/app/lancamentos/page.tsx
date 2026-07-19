'use client';

import { useMonth } from '@/context/MonthContext';
import { currentMonth } from '@/lib/format';
import { ManualEntryForm } from '@/components/ManualEntryForm';
import { UploadButton } from '@/components/UploadButton';
import { VisionImportButton } from '@/components/VisionImportButton';
import { SampleButton } from '@/components/SampleButton';
import { ExportButton } from '@/components/ExportButton';
import { SummaryCards } from '@/components/SummaryCards';
import { TransactionsTable } from '@/components/TransactionsTable';
import { ProjectedView } from '@/components/ProjectedView';
import { useLocale } from '@/i18n/LocaleContext';

export default function LancamentosPage() {
  const { selectedMonth } = useMonth();
  const { t } = useLocale();
  const isFuture = !!selectedMonth && selectedMonth > currentMonth();

  return (
    <>
      <SummaryCards />
      {/* Import/export only makes sense in a specific month — hide on "Geral" */}
      {selectedMonth && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-start gap-3">
            <ManualEntryForm />
            <UploadButton />
            <VisionImportButton />
            <SampleButton />
          </div>
          <ExportButton />
        </div>
      )}

      {isFuture ? (
        <div className="bg-card rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">{t.lancamentosPage.upcomingCommitments}</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.lancamentosPage.projection}</span>
          </div>
          <ProjectedView />
        </div>
      ) : (
        <TransactionsTable />
      )}
    </>
  );
}
