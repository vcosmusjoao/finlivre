'use client';

import { useLocale, type Locale } from '@/i18n/LocaleContext';

const OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'pt', label: 'PT' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center rounded-lg border border-border text-xs overflow-hidden">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          aria-pressed={locale === value}
          className={`px-2.5 py-1.5 font-medium transition-colors ${
            locale === value
              ? 'bg-indigo-600 text-white'
              : 'text-muted-foreground hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
