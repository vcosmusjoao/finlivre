'use client';

import { Navigation } from '@/components/Navigation';
import { MonthSelector } from '@/components/MonthSelector';
import { AccountFilter } from '@/components/AccountFilter';
import { SettingsMenu } from '@/components/SettingsMenu';
import { AccountsManager } from '@/components/AccountsManager';
import { RecurringItemsManager } from '@/components/RecurringItemsManager';
import { ClearDataButton } from '@/components/ClearDataButton';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">FinLivre</h1>
          <p className="text-zinc-400 text-xs">enfim livre.</p>
        </div>
        <SettingsMenu>
          <AccountsManager />
          <RecurringItemsManager />
          <ClearDataButton />
        </SettingsMenu>
      </header>

      <Navigation />
      <MonthSelector />
      <AccountFilter />

      <main>{children}</main>
    </div>
  );
}
