'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { MonthSelector } from '@/components/MonthSelector';
import { AccountFilter } from '@/components/AccountFilter';
import { SettingsMenu } from '@/components/SettingsMenu';
import { AccountsManager } from '@/components/AccountsManager';
import { RecurringItemsManager } from '@/components/RecurringItemsManager';
import { ClearDataButton } from '@/components/ClearDataButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <SettingsMenu>
            <AccountsManager />
            <RecurringItemsManager />
            <ClearDataButton />
          </SettingsMenu>
        </div>
      </header>

      <Navigation />
      <MonthSelector />
      {pathname !== '/planejamento' && <AccountFilter />}

      <main>{children}</main>
    </div>
  );
}
