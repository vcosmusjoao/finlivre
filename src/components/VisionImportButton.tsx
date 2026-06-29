'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { commitParsedEntries } from '@/lib/import-pipeline';
import { parseStatement, VisionRefusalError, type VisionFile } from '@/lib/importers/vision';
import { categorize, learnRule } from '@/lib/categorize';
import { getApiKey } from '@/lib/settings';
import { useMonth } from '@/context/MonthContext';
import { currentMonth } from '@/lib/format';
import { ApiKeySettings } from './ApiKeySettings';
import type { ParsedEntry } from '@/lib/importers/ofx';

interface ReviewRow {
  date: string;
  description: string;
  amount: string; // reais, BR format (comma decimal)
  direction: 'expense' | 'income';
  category: string;
  installment?: { current: number; total: number };
}

function today() {
  return new Date().toISOString().slice(0, 10);
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [billingMonth, setBillingMonth] = useState(currentMonth());
  const [accountId, setAccountId] = useState('');

  const [invoiceTotal, setInvoiceTotal] = useState('');

  const [showKey, setShowKey] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

  function resetModal() {
    setRows(null);
    setInvoiceTotal('');
  }

  const categories = useLiveQuery(
    () => db.entries.orderBy('category').uniqueKeys() as Promise<string[]>,
    [], [],
  );
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);

  // Open/close the review <dialog> in sync with `rows`.
  useEffect(() => {
    if (rows !== null) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [rows]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-selecting the same file
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
      if (parsed.length === 0) {
        setError('Nenhuma transação encontrada na imagem/PDF.');
        return;
      }
      // Pre-fill categories with the existing categorizer so the user sees suggestions.
      const cats = await Promise.all(parsed.map(p => categorize(p.description)));
      setBillingMonth(bm);
      setAccountId('');
      setRows(
        parsed.map((p, i) => ({
          date: p.date,
          description: p.description,
          amount: (p.amountCents / 100).toFixed(2).replace('.', ','),
          direction: p.direction === 'income' ? 'income' : 'expense',
          category: cats[i] === 'Uncategorized' ? '' : cats[i],
          installment: p.installment,
        })),
      );
    } catch (e) {
      if (e instanceof VisionRefusalError) setError(e.message);
      else setError('Erro ao analisar. Verifique a chave da API e a conexão.');
    } finally {
      setLoading(false);
    }
  }

  function updateRow(i: number, key: keyof ReviewRow, value: string) {
    setRows(rs => rs!.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }
  function removeRow(i: number) {
    setRows(rs => rs!.filter((_, idx) => idx !== i));
  }
  function addRow() {
    setRows(rs => [...(rs ?? []), { date: today(), description: '', amount: '', direction: 'expense', category: '' }]);
  }

  async function handleConfirm() {
    const current = rows ?? [];
    const parsed: ParsedEntry[] = [];
    for (const r of current) {
      const cents = Math.round(parseFloat(r.amount.replace(',', '.')) * 100);
      if (!r.description.trim() || isNaN(cents) || cents <= 0) continue; // skip invalid rows
      parsed.push({
        date: r.date,
        billingMonth,
        description: r.description.trim(),
        amountCents: Math.abs(cents),
        direction: r.direction,
        installment: r.installment,
        source: 'pdf',
      });
    }
    if (parsed.length === 0) {
      setError('Nenhuma linha válida para importar.');
      resetModal();
      return;
    }
    // Teach the merchant dictionary from the user-confirmed categories — this also
    // benefits future OFX imports of the same merchant.
    await Promise.all(
      current.filter(r => r.category.trim() && r.description.trim())
        .map(r => learnRule(r.description.trim(), r.category.trim())),
    );
    const acc = accountId !== '' ? Number(accountId) : undefined;
    const res = await commitParsedEntries(parsed, acc);

    // Save invoice total as InvoiceStatement so the invoice card appears (same as OFX LEDGERBAL)
    if (invoiceTotal.trim() && acc !== undefined) {
      const totalCents = Math.round(parseFloat(invoiceTotal.replace(',', '.')) * 100);
      if (!isNaN(totalCents) && totalCents > 0) {
        await db.invoiceStatements
          .where('[accountId+month]')
          .equals([acc, billingMonth])
          .delete()
          .catch(() => {});
        await db.invoiceStatements.add({
          accountId: acc,
          month: billingMonth,
          balanceCents: totalCents,
          importedAt: new Date().toISOString(),
        });
      }
    }

    setResult(res);
    resetModal();
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 transition-colors">
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="sr-only"
          onChange={handleFileChange}
        />
        {loading ? 'Analisando com IA…' : 'Importar foto/PDF'}
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

      {/* Review modal — the user verifies/edits before anything is saved */}
      <dialog
        ref={dialogRef}
        onCancel={() => resetModal()}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 w-full max-w-4xl shadow-xl backdrop:bg-black/40"
      >
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
          Revisar transações
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          A IA extraiu estas linhas. Confira os valores antes de salvar — você pode editar, remover ou adicionar.
        </p>

        <div className="max-h-[55vh] overflow-auto -mx-2 px-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs text-zinc-400">
                <th className="py-1 pr-2 font-medium">Data</th>
                <th className="py-1 pr-2 font-medium">Descrição</th>
                <th className="py-1 pr-2 font-medium">Valor (R$)</th>
                <th className="py-1 pr-2 font-medium">Tipo</th>
                <th className="py-1 pr-2 font-medium">Categoria</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((r, i) => (
                <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-1 pr-2">
                    <input type="date" value={r.date} onChange={e => updateRow(i, 'date', e.target.value)} className={cellCls} />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="text"
                      value={r.description}
                      onChange={e => updateRow(i, 'description', e.target.value)}
                      className={`${cellCls} min-w-40`}
                    />
                    {r.installment && (
                      <span className="ml-1 text-[10px] text-zinc-400">{r.installment.current}/{r.installment.total}</span>
                    )}
                  </td>
                  <td className="py-1 pr-2">
                    <input type="text" inputMode="decimal" value={r.amount} onChange={e => updateRow(i, 'amount', e.target.value)} className={`${cellCls} w-24`} />
                  </td>
                  <td className="py-1 pr-2">
                    <select value={r.direction} onChange={e => updateRow(i, 'direction', e.target.value)} className={cellCls}>
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                  </td>
                  <td className="py-1 pr-2">
                    <input type="text" list="vision-category-list" value={r.category} onChange={e => updateRow(i, 'category', e.target.value)} className={`${cellCls} min-w-32`} />
                  </td>
                  <td className="py-1 text-right">
                    <button onClick={() => removeRow(i)} className="text-zinc-300 hover:text-red-500 px-1" title="Remover">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="vision-category-list">
            {categories.map(cat => <option key={cat} value={cat} />)}
          </datalist>
        </div>

        <button onClick={addRow} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
          + Adicionar linha
        </button>

        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-4 flex-wrap">
            {accounts.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-zinc-500">
                Conta
                <select value={accountId} onChange={e => setAccountId(e.target.value)} className={cellCls}>
                  <option value="">Sem conta</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              Total da fatura
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00 (opcional)"
                value={invoiceTotal}
                onChange={e => setInvoiceTotal(e.target.value)}
                className={`${cellCls} w-36`}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => resetModal()}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              Importar {(rows ?? []).length} {(rows ?? []).length === 1 ? 'linha' : 'linhas'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

const cellCls = 'rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500';
