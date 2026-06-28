'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { useMonth } from '@/context/MonthContext';

export function ClearDataButton() {
  const [confirming, setConfirming] = useState(false);
  const { setSelectedMonth } = useMonth();

  async function handleClear() {
    await db.transaction('rw', [db.entries, db.accounts, db.categories, db.merchantRules, db.invoiceStatements, db.recurringItems], async () => {
      await db.entries.clear();
      await db.accounts.clear();
      await db.categories.clear();
      await db.merchantRules.clear();
      await db.invoiceStatements.clear();
      await db.recurringItems.clear();
    });
    setSelectedMonth('');
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Limpar tudo?</span>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Confirmar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-red-400 hover:text-red-500 transition-colors"
    >
      Limpar dados
    </button>
  );
}
