'use client';

import { useEffect, useRef, useState } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '@/lib/settings';

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
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 w-full max-w-md shadow-xl backdrop:bg-black/40"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
        Chave da API Anthropic
      </h2>
      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
        Para ler fotos e PDFs de faturas, o FinLivre usa o Claude com a <strong>sua</strong> chave.
        Ela fica salva apenas neste navegador. Importar uma imagem <strong>envia o arquivo para a
        Anthropic</strong> sob a sua chave — seus dados continuam fora de qualquer servidor nosso.
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
        Crie uma chave em{' '}
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2"
        >
          console.anthropic.com
        </a>.
      </p>

      <div className="flex items-center justify-between mt-5">
        <button
          onClick={handleClear}
          className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
        >
          Remover chave
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!value.trim()}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </dialog>
  );
}

const inputCls = 'rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
