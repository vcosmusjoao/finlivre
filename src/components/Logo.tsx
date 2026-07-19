'use client';

import { useLocale } from '@/i18n/LocaleContext';

/**
 * "FinLivre" is the brand name — same in every locale (see i18n/messages/*.ts,
 * `appName` is identical across `en`/`pt`) — so the two-tone wordmark stays literal
 * here rather than going through `t`. The tagline does translate, so it's the only
 * piece pulled from `useLocale()`.
 */
export function Logo() {
  const { t } = useLocale();

  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 48 48" className="h-7 w-7 shrink-0" aria-hidden="true">
        <circle
          cx="24" cy="24" r="15" fill="none"
          strokeWidth="5.5" strokeLinecap="round"
          strokeDasharray="64 30.25" transform="rotate(-56 24 24)"
          className="stroke-indigo-600 dark:stroke-indigo-400"
        />
        <circle cx="36" cy="10.5" r="3.5" className="fill-indigo-400 dark:fill-indigo-300" />
      </svg>
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="text-xl font-semibold tracking-tight">
          <span className="text-zinc-900 dark:text-zinc-50">Fin</span>
          <span className="text-indigo-600 dark:text-indigo-400">Livre</span>
        </span>
        <span className="text-xs text-zinc-400">{t.nav.tagline}</span>
      </div>
    </div>
  );
}
