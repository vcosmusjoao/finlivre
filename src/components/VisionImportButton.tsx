'use client';

import { useState } from 'react';
import { commitReviewedImport } from '@/lib/import-pipeline';
import { parseStatement, VisionRefusalError, type VisionFile } from '@/lib/importers/vision';
import { getApiKey } from '@/lib/settings';
import { useMonth } from '@/context/MonthContext';
import { currentMonth } from '@/lib/format';
import { ApiKeySettings } from './ApiKeySettings';
import { AccountPickerModal } from './AccountPickerModal';
import { ImportReviewTable, type CommitInput } from './ImportReviewTable';
import type { ParsedEntry } from '@/lib/importers/ofx';
import { useLocale } from '@/i18n/LocaleContext';

interface PendingAnalysis {
  entries: ParsedEntry[];
  invoiceTotalCents: number | null;
  billingMonth: string;
  fromCache: boolean;
}

type ImportFlow =
  | { step: 'idle' }
  | { step: 'analyzing' }
  | { step: 'picking-account'; analysis: PendingAnalysis }
  | { step: 'reviewing'; analysis: PendingAnalysis; accountId?: number }
  | { step: 'error'; message: string }
  | { step: 'result'; added: number; skipped: number };

/** Reads a File into base64 (without the data: prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function VisionImportButton() {
  const { selectedMonth } = useMonth();
  const { t } = useLocale();

  // Single source of truth for the wizard step — replaces 5 independent
  // useState flags (loading/error/result/pendingAnalysis/reviewing) that
  // could previously represent impossible combinations (e.g. two steps
  // "open" at once). See 05-knowledge/react-hooks-vs-rxjs-reactivity.md.
  const [flow, setFlow] = useState<ImportFlow>({ step: 'idle' });

  const [showKey, setShowKey] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

  const loading = flow.step === 'analyzing';
  const reviewing = flow.step === 'reviewing' ? flow : null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    if (!getApiKey()) {
      setPendingFiles(files);
      setShowKey(true);
      return;
    }
    await analyze(files);
  }

  async function analyze(files: File[]) {
    setFlow({ step: 'analyzing' });
    try {
      const visionFiles: VisionFile[] = await Promise.all(
        files.map(async f => ({ base64: await fileToBase64(f), mediaType: f.type || 'image/png' })),
      );
      const bm = selectedMonth || currentMonth();
      const parsed = await parseStatement(visionFiles, getApiKey()!, bm);
      if (parsed.entries.length === 0) {
        setFlow({ step: 'error', message: t.visionImportButton.noTransactionsFound });
        return;
      }
      // Store analysis and open account picker before the review table
      setFlow({
        step: 'picking-account',
        analysis: { entries: parsed.entries, invoiceTotalCents: parsed.invoiceTotalCents, billingMonth: bm, fromCache: parsed.fromCache },
      });
    } catch (e) {
      const message = e instanceof VisionRefusalError
        ? e.message
        : t.visionImportButton.genericError;
      setFlow({ step: 'error', message });
    }
  }

  /** Called after account is picked (or skipped) — opens the shared review table. */
  function openReviewTable(pickedAccountId?: number) {
    if (flow.step !== 'picking-account') return;
    setFlow({ step: 'reviewing', analysis: flow.analysis, accountId: pickedAccountId });
  }

  async function handleConfirm(input: CommitInput) {
    const res = await commitReviewedImport(input.entries, {
      accountId: input.accountId,
      billingMonth: input.billingMonth,
      invoiceTotalCents: input.invoiceTotalCents,
    });
    setFlow({ step: 'result', ...res });
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <label className={`cursor-pointer inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${loading ? 'border-indigo-300 dark:border-indigo-700 text-primary cursor-wait' : 'border-border text-body hover:border-zinc-400'}`}>
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="sr-only"
          disabled={loading}
          onChange={handleFileChange}
        />
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t.visionImportButton.analyzing}
          </>
        ) : t.visionImportButton.import}
      </label>

      {flow.step === 'result' && (
        <p className="text-xs text-emerald-600">
          {t.uploadButton.importResult(flow.added, flow.skipped)}
        </p>
      )}
      {flow.step === 'error' && <p className="text-xs text-red-500">{flow.message}</p>}

      <ApiKeySettings
        open={showKey}
        onClose={() => { setShowKey(false); setPendingFiles(null); }}
        onSaved={() => {
          setShowKey(false);
          const files = pendingFiles;
          setPendingFiles(null);
          if (files) analyze(files);
        }}
      />

      {/* Step 2 of the flow: pick (or create) the account after AI analysis */}
      <AccountPickerModal
        open={flow.step === 'picking-account'}
        onSelect={id => openReviewTable(id)}
        onSkip={() => openReviewTable(undefined)}
        onCancel={() => setFlow({ step: 'idle' })}
      />

      {/* Step 3: review table — user verifies/edits before anything is saved */}
      <ImportReviewTable
        open={flow.step === 'reviewing'}
        entries={reviewing?.analysis.entries ?? []}
        source="pdf"
        defaultAccountId={reviewing?.accountId}
        defaultBillingMonth={reviewing?.analysis.billingMonth ?? currentMonth()}
        defaultInvoiceTotalCents={reviewing?.analysis.invoiceTotalCents}
        fromCache={reviewing?.analysis.fromCache}
        onConfirm={handleConfirm}
        onCancel={() => setFlow({ step: 'idle' })}
      />
    </div>
  );
}
