'use client';

import { useState } from 'react';
import { importOfx, importSampleData } from '@/lib/import-pipeline';
import { AccountPickerModal } from '@/components/AccountPickerModal';

export function UploadButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);

  async function runImport(text: string, accountId?: number) {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await importOfx(text, accountId);
      setResult(res);
    } catch {
      setError('Erro ao importar o arquivo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after cancel
    e.target.value = '';
    setPendingText(await file.text());
  }

  async function handleLoadSample() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await importSampleData();
      setResult(res);
    } catch {
      setError('Erro ao carregar o exemplo.');
    } finally {
      setLoading(false);
    }
  }

  function handleAccountPicked(accountId: number) {
    const text = pendingText!;
    setPendingText(null);
    runImport(text, accountId);
  }

  function handleSkip() {
    const text = pendingText!;
    setPendingText(null);
    runImport(text, undefined);
  }

  function handleCancel() {
    setPendingText(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors">
          <input type="file" accept=".ofx" className="sr-only" onChange={handleFileChange} />
          Importar OFX
        </label>
        <button
          onClick={handleLoadSample}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-2 transition-colors"
        >
          Carregar exemplo
        </button>
      </div>

      {loading && <p className="text-sm text-zinc-500">Importando...</p>}
      {result && (
        <p className="text-sm text-emerald-600">
          {result.added} entradas importadas
          {result.skipped > 0 && `, ${result.skipped} duplicatas ignoradas`}.
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <AccountPickerModal
        open={pendingText !== null}
        onSelect={handleAccountPicked}
        onSkip={handleSkip}
        onCancel={handleCancel}
      />
    </div>
  );
}
