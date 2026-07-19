'use client';

import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account, type AccountType } from '@/lib/db';
import { suggestAccountColor, COLOR_PRESETS } from '@/lib/accounts';
import { useLocale } from '@/i18n/LocaleContext';

const EMPTY_FORM = {
  name: '',
  color: COLOR_PRESETS[7], // gray default
  type: 'credit_card' as AccountType,
  closingDay: '',
};

export function AccountsManager() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const { t } = useLocale();
  const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = t.accountTypes;

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  function open() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    dialogRef.current?.showModal();
  }

  function handleNameChange(value: string) {
    setForm(prev => ({ ...prev, name: value, color: suggestAccountColor(value) }));
  }

  function startEdit(acc: Account) {
    setForm({
      name: acc.name,
      color: acc.color,
      type: acc.type,
      closingDay: acc.closingDay?.toString() ?? '',
    });
    setEditingId(acc.id!);
    setError('');
  }

  function cancelEdit() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError(t.accountsManager.nameRequired);
      return;
    }
    const data = {
      name: form.name.trim(),
      color: form.color,
      type: form.type,
      closingDay: form.closingDay ? Number(form.closingDay) : undefined,
    };
    try {
      if (editingId !== null) {
        await db.accounts.update(editingId, data);
      } else {
        await db.accounts.add(data);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setError('');
      // Close after creating so user can see the updated account list in the dashboard
      if (editingId === null) dialogRef.current?.close();
    } catch (e) {
      setError(t.accountsManager.saveError(e instanceof Error ? e.message : String(e)));
    }
  }

  async function handleDelete(id: number) {
    await db.accounts.delete(id);
    // Detach entries from the deleted account without deleting the entries themselves
    await db.entries.where('accountId').equals(id).modify({ accountId: undefined });
    if (editingId === id) cancelEdit();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        {t.accountsManager.button}
      </button>

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 w-full max-w-md shadow-xl backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">{t.accountsManager.title}</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Account list */}
        {(accounts ?? []).length === 0 && (
          <p className="text-sm text-zinc-400 mb-4">{t.accountsManager.empty}</p>
        )}
        <div className="flex flex-col gap-2 mb-6">
          {accounts?.map(acc => (
            <div key={acc.id} className="flex items-center gap-3 rounded-lg border border-border-divider px-3 py-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: acc.color }} />
              <span className="text-sm text-body flex-1">{acc.name}</span>
              <span className="text-xs text-zinc-400">{ACCOUNT_TYPE_LABELS[acc.type]}</span>
              {acc.closingDay && (
                <span className="text-xs text-zinc-400">{t.accountsManager.closesOnDay(acc.closingDay)}</span>
              )}
              <button
                type="button"
                onClick={() => startEdit(acc)}
                className="text-xs text-zinc-400 hover:text-indigo-600 transition-colors ml-1"
              >
                {t.common.edit}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(acc.id!)}
                className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                {t.common.delete}
              </button>
            </div>
          ))}
        </div>

        {/* Add / Edit form */}
        <div className="border-t border-border-divider pt-4">
          <h3 className="text-sm font-medium text-body mb-3">
            {editingId !== null ? t.accountsManager.editAccount : t.accountsManager.newAccount}
          </h3>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{t.common.name}</span>
              <input
                type="text"
                placeholder={t.accountsManager.namePlaceholder}
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                className={inputCls}
              />
            </label>

            <div>
              <span className="text-xs text-zinc-500 block mb-1.5">{t.common.color}</span>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, color: preset }))}
                    className={`w-6 h-6 rounded-full transition-transform ${form.color === preset ? 'ring-2 ring-offset-2 ring-zinc-400 scale-110' : ''}`}
                    style={{ background: preset }}
                  />
                ))}
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent"
                  title={t.common.customColor}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t.common.type}</span>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as AccountType }))}
                  className={inputCls}
                >
                  {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>

              {form.type === 'credit_card' && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-zinc-500">{t.accountPicker.closesOnDay}</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    placeholder={t.accountPicker.dayPlaceholder}
                    value={form.closingDay}
                    onChange={e => setForm(p => ({ ...p, closingDay: e.target.value }))}
                    className={inputCls}
                  />
                </label>
              )}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2 justify-end">
              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-sm px-3 py-1.5 rounded-lg border border-border text-body"
                >
                  {t.common.cancel}
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                {editingId !== null ? t.common.save : t.accountsManager.addAccount}
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

const inputCls = 'rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
