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

interface PendingAnalysis {
  entries: ParsedEntry[];
  invoiceTotalCents: number | null;
  billingMonth: string;
  fromCache: boolean;
}

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  // Holds the AI result between analysis and account picking
  const [pendingAnalysis, setPendingAnalysis] = useState<PendingAnalysis | null>(null);
  const [reviewing, setReviewing] = useState<{ entries: ParsedEntry[]; accountId?: number; billingMonth: string; invoiceTotalCents: number | null; fromCache: boolean } | null>(null);

  const [showKey, setShowKey] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

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
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const visionFiles: VisionFile[] = await Promise.all(
        files.map(async f => ({ base64: await fileToBase64(f), mediaType: f.type || 'image/png' })),
      );
      const bm = selectedMonth || currentMonth();
      const parsed = await parseStatement(visionFiles, getApiKey()!, bm);
      if (parsed.entries.length === 0) {
        setError('Nenhuma transação encontrada na imagem/PDF.');
        return;
      }
      // Store analysis and open account picker before the review table
      setPendingAnalysis({ entries: parsed.entries, invoiceTotalCents: parsed.invoiceTotalCents, billingMonth: bm, fromCache: parsed.fromCache });
    } catch (e) {
      if (e instanceof VisionRefusalError) setError(e.message);
      else setError('Erro ao analisar. Verifique a chave da API e a conexão.');
    } finally {
      setLoading(false);
    }
  }

  /** Called after account is picked (or skipped) — opens the shared review table. */
  function openReviewTable(pickedAccountId?: number) {
    if (!pendingAnalysis) return;
    const { entries, invoiceTotalCents, billingMonth: bm, fromCache: cached } = pendingAnalysis;
    setPendingAnalysis(null);
    setReviewing({ entries, accountId: pickedAccountId, billingMonth: bm, invoiceTotalCents, fromCache: cached });
  }

  async function handleConfirm(input: CommitInput) {
    const res = await commitReviewedImport(input.entries, {
      accountId: input.accountId,
      billingMonth: input.billingMonth,
      invoiceTotalCents: input.invoiceTotalCents,
    });
    setResult(res);
    setReviewing(null);
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <label className={`cursor-pointer inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${loading ? 'border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 cursor-wait' : 'border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'}`}>
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
            Analisando com IA…
          </>
        ) : 'Importar foto/PDF'}
      </label>

      {result && (
        <p className="text-xs text-emerald-600">
          {result.added} importadas{result.skipped > 0 && `, ${result.skipped} duplicatas`}.
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

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
        open={pendingAnalysis !== null}
        onSelect={id => openReviewTable(id)}
        onSkip={() => openReviewTable(undefined)}
        onCancel={() => setPendingAnalysis(null)}
      />

      {/* Step 3: review table — user verifies/edits before anything is saved */}
      <ImportReviewTable
        open={reviewing !== null}
        entries={reviewing?.entries ?? []}
        source="pdf"
        defaultAccountId={reviewing?.accountId}
        defaultBillingMonth={reviewing?.billingMonth ?? currentMonth()}
        defaultInvoiceTotalCents={reviewing?.invoiceTotalCents}
        fromCache={reviewing?.fromCache}
        onConfirm={handleConfirm}
        onCancel={() => setReviewing(null)}
      />
    </div>
  );
}
