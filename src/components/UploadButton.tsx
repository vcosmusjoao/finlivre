'use client';

import { useState } from 'react';
import { parseOfx, commitReviewedImport, type ParsedOfx } from '@/lib/import-pipeline';
import { currentMonth } from '@/lib/format';
import { AccountPickerModal } from '@/components/AccountPickerModal';
import { ImportReviewTable, type CommitInput } from '@/components/ImportReviewTable';
import { useLocale } from '@/i18n/LocaleContext';

export function UploadButton() {
  const { t } = useLocale();
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingParse, setPendingParse] = useState<ParsedOfx | null>(null);
  const [reviewing, setReviewing] = useState<{ parsed: ParsedOfx; accountId?: number } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after cancel
    e.target.value = '';
    setResult(null);
    setError(null);
    const text = await file.text();
    const parsed = parseOfx(text);
    if (parsed.entries.length === 0) {
      setError(t.uploadButton.noTransactionsFound);
      return;
    }
    setPendingParse(parsed);
  }

  function openReviewTable(accountId?: number) {
    if (!pendingParse) return;
    setReviewing({ parsed: pendingParse, accountId });
    setPendingParse(null);
  }

  async function handleConfirm(input: CommitInput) {
    try {
      const res = await commitReviewedImport(input.entries, {
        accountId: input.accountId,
        billingMonth: input.billingMonth,
        invoiceTotalCents: input.invoiceTotalCents,
      });
      setResult(res);
    } catch {
      setError(t.uploadButton.importError);
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div className="inline-flex flex-col gap-2">
      {/* Intentionally inverted CTA (dark bg in light mode, light bg in dark mode) — exempt from the bg-card/text-foreground token system, not a copy-paste leftover. */}
      <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors">
        <input type="file" accept=".ofx" className="sr-only" onChange={handleFileChange} />
        {t.uploadButton.importOfx}
      </label>

      {result && (
        <p className="text-xs text-emerald-600">
          {t.uploadButton.importResult(result.added, result.skipped)}
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      <AccountPickerModal
        open={pendingParse !== null}
        onSelect={openReviewTable}
        onSkip={() => openReviewTable(undefined)}
        onCancel={() => setPendingParse(null)}
      />

      <ImportReviewTable
        open={reviewing !== null}
        entries={reviewing?.parsed.entries ?? []}
        source="ofx"
        defaultAccountId={reviewing?.accountId}
        defaultBillingMonth={reviewing?.parsed.billingMonth ?? currentMonth()}
        defaultInvoiceTotalCents={reviewing?.parsed.invoiceTotalCents}
        onConfirm={handleConfirm}
        onCancel={() => setReviewing(null)}
      />
    </div>
  );
}
