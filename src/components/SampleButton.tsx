'use client';

import { useState } from 'react';
import { importSampleData } from '@/lib/import-pipeline';
import { useLocale } from '@/i18n/LocaleContext';

export function SampleButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { t } = useLocale();

  async function handleClick() {
    setLoading(true);
    try {
      await importSampleData();
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors disabled:opacity-50 self-center"
    >
      {done ? t.sampleButton.loaded : loading ? t.sampleButton.loading : t.sampleButton.load}
    </button>
  );
}
