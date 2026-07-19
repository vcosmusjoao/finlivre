'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { useMonth } from '@/context/MonthContext';
import { useLocale } from '@/i18n/LocaleContext';

export function ClearDataButton() {
  const [confirming, setConfirming] = useState(false);
  const { setSelectedMonth } = useMonth();
  const { t } = useLocale();

  async function handleClear() {
    await db.transaction('rw', [db.entries, db.accounts, db.categories, db.merchantRules, db.invoiceStatements, db.recurringItems, db.recurringOverrides], async () => {
      await db.entries.clear();
      await db.accounts.clear();
      await db.categories.clear();
      await db.merchantRules.clear();
      await db.invoiceStatements.clear();
      await db.recurringItems.clear();
      await db.recurringOverrides.clear();
    });
    setSelectedMonth('');
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{t.clearDataButton.confirmPrompt}</span>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
        >
          {t.common.cancel}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          {t.common.confirm}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-red-400 hover:text-red-500 transition-colors"
    >
      {t.clearDataButton.clearData}
    </button>
  );
}
