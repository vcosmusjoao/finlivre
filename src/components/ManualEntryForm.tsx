'use client';

import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { addManualEntry } from '@/lib/import-pipeline';

function today() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY = {
  date: today(),
  description: '',
  amount: '',
  direction: 'expense' as 'income' | 'expense',
  category: '',
  accountId: '' as string | number,
};

export function ManualEntryForm() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fields, setFields] = useState(EMPTY);
  const [error, setError] = useState('');

  const categories = useLiveQuery(() =>
    db.entries.orderBy('category').uniqueKeys() as Promise<string[]>
  , [], []);

  const accounts = useLiveQuery(() => db.accounts.toArray(), [], []);

  function set(key: keyof typeof EMPTY, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function open() {
    setFields(EMPTY);
    setError('');
    dialogRef.current?.showModal();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(fields.amount.replace(',', '.')) * 100);

    if (!fields.description.trim()) return setError('Descrição obrigatória.');
    if (isNaN(amountCents) || amountCents <= 0) return setError('Valor inválido.');
    if (!fields.category.trim()) return setError('Categoria obrigatória.');

    await addManualEntry({
      date: fields.date,
      description: fields.description.trim(),
      amountCents,
      direction: fields.direction,
      category: fields.category.trim(),
      accountId: fields.accountId !== '' ? Number(fields.accountId) : undefined,
    });

    dialogRef.current?.close();
  }

  return (
    <>
      <button
        onClick={open}
        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 transition-colors"
      >
        + Adicionar
      </button>

      {/* HTML native modal — no library needed */}
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 w-full max-w-md shadow-xl backdrop:bg-black/40"
      >
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-5">Nova entrada</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Data</span>
              <input
                type="date"
                value={fields.date}
                onChange={e => set('date', e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Tipo</span>
              <select
                value={fields.direction}
                onChange={e => set('direction', e.target.value as 'income' | 'expense')}
                className={inputCls}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Descrição</span>
            <input
              type="text"
              placeholder="Ex: Aluguel, Salário…"
              value={fields.description}
              onChange={e => set('description', e.target.value)}
              className={inputCls}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Valor (R$)</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={fields.amount}
                onChange={e => set('amount', e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Categoria</span>
              {/* datalist = autocomplete das existentes + permite digitar nova */}
              <input
                type="text"
                list="category-list"
                placeholder="Alimentação…"
                value={fields.category}
                onChange={e => set('category', e.target.value)}
                className={inputCls}
              />
              <datalist id="category-list">
                {categories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </label>
          </div>

          {accounts.length > 0 && (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Conta</span>
              <select
                value={String(fields.accountId)}
                onChange={e => set('accountId', e.target.value)}
                className={inputCls}
              >
                <option value="">Sem conta</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </label>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

const inputCls = 'rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
