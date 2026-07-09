'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/lancamentos', label: 'Lançamentos' },
  { href: '/planejamento', label: 'Planejamento' },
] as const;

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-800">
      {TABS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
