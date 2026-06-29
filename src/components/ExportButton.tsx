'use client';

import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/db';

export function ExportButton() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function exportJSON() {
    const [entries, accounts, recurringItems, merchantRules, invoiceStatements] = await Promise.all([
      db.entries.toArray(),
      db.accounts.toArray(),
      db.recurringItems.toArray(),
      db.merchantRules.toArray(),
      db.invoiceStatements.toArray(),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      entries,
      accounts,
      recurringItems,
      merchantRules,
      invoiceStatements,
    };

    triggerDownload(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      `finlivre-backup-${today()}.json`
    );
    setOpen(false);
  }

  async function exportCSV() {
    const [entries, accounts] = await Promise.all([
      db.entries.toArray(),
      db.accounts.toArray(),
    ]);

    const accountMap = new Map(accounts.map(a => [a.id!, a.name]));

    const header = [
      'Data', 'Descrição', 'Valor (R$)', 'Direção',
      'Categoria', 'Conta', 'Parcela', 'Mês de cobrança', 'Fonte',
    ];

    const rows = entries.map(e => [
      e.date,
      csvCell(e.description),
      (e.amountCents / 100).toFixed(2),
      e.direction,
      csvCell(e.category),
      e.accountId !== undefined ? csvCell(accountMap.get(e.accountId) ?? '') : '',
      e.installment ? `${e.installment.current}/${e.installment.total}` : '',
      e.billingMonth ?? '',
      e.source,
    ]);

    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    // UTF-8 BOM (﻿) ensures Excel reads accented characters correctly
    triggerDownload(
      new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }),
      `finlivre-${today()}.csv`
    );
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        Exportar
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 z-20 w-44">
          <button type="button" onClick={exportJSON}
            className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <span className="font-medium text-zinc-700 dark:text-zinc-200">JSON</span>
            <span className="text-zinc-400 ml-1.5">backup completo</span>
          </button>
          <button type="button" onClick={exportCSV}
            className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <span className="font-medium text-zinc-700 dark:text-zinc-200">CSV</span>
            <span className="text-zinc-400 ml-1.5">para planilha</span>
          </button>
        </div>
      )}
    </div>
  );
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
