'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type AccountType } from '@/lib/db';
import { suggestAccountColor, COLOR_PRESETS } from '@/lib/accounts';
import { useLocale } from '@/i18n/LocaleContext';

interface Props {
  open: boolean;
  onSelect: (accountId: number) => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function AccountPickerModal({ open, onSelect, onSkip, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const { t } = useLocale();
  const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = t.accountTypes;

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[7]); // gray default
  const [type, setType] = useState<AccountType>('credit_card');
  const [closingDay, setClosingDay] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setCreating((accounts ?? []).length === 0);
      setName(''); setColor(COLOR_PRESETS[7]); setType('credit_card');
      setClosingDay(''); setError('');
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, accounts]);

  function handleNameChange(value: string) {
    setName(value);
    // Only auto-suggest color if user hasn't manually picked one yet
    const suggested = suggestAccountColor(value);
    if (suggested !== '#6B7280' || value === '') setColor(suggested);
  }

  async function handleCreate() {
    if (!name.trim()) { setError(t.accountPicker.nameRequired); return; }
    try {
      const id = await db.accounts.add({
        name: name.trim(),
        color,
        type,
        closingDay: closingDay ? Number(closingDay) : undefined,
      });
      onSelect(id as number);
    } catch (e) {
      setError(t.accountPicker.createError(e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 w-full max-w-sm shadow-xl backdrop:bg-black/40"
    >
      <h2 className="text-base font-semibold text-foreground mb-1">
        {t.accountPicker.title}
      </h2>
      <p className="text-xs text-zinc-400 mb-5">{t.accountPicker.subtitle}</p>

      {/* Existing accounts */}
      {(accounts ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {accounts!.map(acc => (
            <button
              key={acc.id}
              onClick={() => onSelect(acc.id!)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-body hover:border-zinc-400 transition-colors"
            >
              <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ background: acc.color }} />
              {acc.name}
            </button>
          ))}
        </div>
      )}

      {/* Toggle new account form */}
      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 mb-4"
        >
          {t.accountPicker.newAccount}
        </button>
      )}

      {/* New account inline form */}
      {creating && (
        <div className="border border-border rounded-lg p-4 mb-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">{t.common.name}</span>
            <input
              autoFocus
              type="text"
              placeholder={t.accountPicker.namePlaceholder}
              value={name}
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
                  onClick={() => setColor(preset)}
                  className={`w-6 h-6 rounded-full transition-transform ${color === preset ? 'ring-2 ring-offset-2 ring-zinc-400 scale-110' : ''}`}
                  style={{ background: preset }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent"
                title={t.common.customColor}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{t.common.type}</span>
              <select value={type} onChange={e => setType(e.target.value as AccountType)} className={inputCls}>
                {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>

            {type === 'credit_card' && (
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t.accountPicker.closesOnDay}</span>
                <input
                  type="number"
                  min={1} max={31}
                  placeholder={t.accountPicker.dayPlaceholder}
                  value={closingDay}
                  onChange={e => setClosingDay(e.target.value)}
                  className={inputCls}
                />
              </label>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            {(accounts ?? []).length > 0 && (
              <button
                onClick={() => { setCreating(false); setError(''); }}
                className="text-sm px-3 py-1.5 rounded-lg border border-border text-body hover:bg-muted"
              >
                {t.common.cancel}
              </button>
            )}
            <button
              onClick={handleCreate}
              className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {t.accountPicker.createAndSelect}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onCancel}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          {t.common.cancel}
        </button>
        <button
          onClick={onSkip}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline underline-offset-2"
        >
          {t.accountPicker.importWithoutAccount}
        </button>
      </div>
    </dialog>
  );
}

const inputCls = 'rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
