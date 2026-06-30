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

export default function LancamentosPage() {
  const { selectedMonth } = useMonth();
  const isFuture = !!selectedMonth && selectedMonth > currentMonth();

  return (
    <>
      <SummaryCards />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-start gap-3">
          <ManualEntryForm />
          <UploadButton />
          <VisionImportButton />
          <SampleButton />
        </div>
        <ExportButton />
      </div>

      {isFuture ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Compromissos previstos</h2>
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-500 px-2 py-0.5 rounded-full">projeção</span>
          </div>
          <ProjectedView />
        </div>
      ) : (
        <TransactionsTable />
      )}
    </>
  );
}
