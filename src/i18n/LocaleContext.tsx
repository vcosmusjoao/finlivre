'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { en } from './messages/en';
import { pt } from './messages/pt';

export type Locale = 'en' | 'pt';

const STORAGE_KEY = 'finlivre.locale';

const CATALOGS = { en, pt };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof en;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'pt' ? 'pt' : 'en';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Starts at the EN default on the server and on first client render (avoids a
  // hydration mismatch), then swaps to the stored preference right after mount.
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: CATALOGS[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}
