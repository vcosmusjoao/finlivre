'use client';

import { useState } from 'react';
import Link from 'next/link';
import { importSampleData } from '@/lib/import-pipeline';
import { useLocale } from '@/i18n/LocaleContext';

export function DashboardEmptyState() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleSampleClick() {
    setLoading(true);
    try {
      await importSampleData();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-border-subtle p-12 text-center">
      <div>
        <h1 className="text-lg font-semibold text-body mb-2">{t.dashboardEmptyState.title}</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{t.dashboardEmptyState.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
        <Step n={1} label={t.dashboardEmptyState.stepImport} />
        <Step n={2} label={t.dashboardEmptyState.stepCategorize} />
        <Step n={3} label={t.dashboardEmptyState.stepInsights} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleSampleClick}
          disabled={loading}
          className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? t.dashboardEmptyState.sampleLoading : t.dashboardEmptyState.sampleButton}
        </button>
        <Link href="/lancamentos" className="text-sm text-primary hover:underline">
          {t.dashboardEmptyState.addFirst}
        </Link>
      </div>
    </div>
  );
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
        {n}
      </span>
      <span>{label}</span>
    </div>
  );
}
