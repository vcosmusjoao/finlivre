'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/i18n/LocaleContext';

export function Navigation() {
  const pathname = usePathname();
  const { t } = useLocale();

  const tabs = [
    { href: '/dashboard', label: t.nav.dashboard },
    { href: '/lancamentos', label: t.nav.transactions },
    { href: '/planejamento', label: t.nav.planning },
  ] as const;

  return (
    <nav className="flex gap-1 mb-6 border-b border-border-subtle">
      {tabs.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
