'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useLocale } from '@/i18n/LocaleContext';

const MODES = ['light', 'dark', 'system'] as const;
type Mode = (typeof MODES)[number];

/**
 * `next-themes` only knows the real theme after mount (it resolves `system` via
 * `matchMedia`, which doesn't exist during SSR). Rendering the live selection before
 * that would mismatch the server-rendered markup, so the segmented control stays
 * inert (no `aria-pressed` mismatch) until mounted — the standard next-themes pattern.
 *
 * Styled as a 3-way segmented control matching LanguageSwitcher exactly (same
 * border/pill/active-state treatment), since the two sit side by side in the header.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useLocale();
  const labels: Record<Mode, string> = { light: t.themeToggle.light, dark: t.themeToggle.dark, system: t.themeToggle.system };

  useEffect(() => setMounted(true), []);

  const active = mounted ? (theme as Mode) ?? 'system' : undefined;

  return (
    <div className="flex items-center rounded-lg border border-border text-xs overflow-hidden">
      {MODES.map(mode => (
        <button
          key={mode}
          type="button"
          onClick={() => setTheme(mode)}
          aria-pressed={active === mode}
          className={`px-2.5 py-1.5 font-medium transition-colors ${
            active === mode
              ? 'bg-indigo-600 text-white'
              : 'text-muted-foreground hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          {labels[mode]}
        </button>
      ))}
    </div>
  );
}
