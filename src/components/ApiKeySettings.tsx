'use client';

import { useEffect, useRef, useState } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '@/lib/settings';
import { useLocale } from '@/i18n/LocaleContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Modal to set/clear the user's own Anthropic API key (stored in localStorage).
 * Shown when the user tries to import a photo/PDF without a key configured.
 * The copy is deliberately honest: this action sends the image to Anthropic.
 */
export function ApiKeySettings({ open, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState('');
  const { t } = useLocale();

  useEffect(() => {
    if (open) {
      setValue(getApiKey() ?? '');
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  function handleSave() {
    if (!value.trim()) return;
    setApiKey(value);
    onSaved?.();
    onClose();
  }

  function handleClear() {
    clearApiKey();
    setValue('');
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 w-full max-w-md shadow-xl backdrop:bg-black/40"
    >
      <h2 className="text-base font-semibold text-foreground mb-1">
        {t.apiKeySettings.title}
      </h2>
      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
        {t.apiKeySettings.description}
      </p>

      <input
        type="password"
        autoFocus
        placeholder="sk-ant-…"
        value={value}
        onChange={e => setValue(e.target.value)}
        className={inputCls}
      />

      <p className="text-xs text-zinc-400 mt-2">
        {t.apiKeySettings.createKeyAt}{' '}
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2"
        >
          console.anthropic.com
        </a>.
      </p>

      <div className="flex items-center justify-between mt-5">
        <button
          onClick={handleClear}
          className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
        >
          {t.apiKeySettings.removeKey}
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-body hover:bg-muted"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={!value.trim()}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            {t.common.save}
          </button>
        </div>
      </div>
    </dialog>
  );
}

const inputCls = 'rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
