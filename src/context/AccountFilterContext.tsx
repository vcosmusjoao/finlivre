'use client';

import { createContext, useContext, useState } from 'react';
import type { AccountFilter } from '@/lib/filters';

/**
 * Global account filter — the sibling of MonthContext. Multiple components
 * (cards, donut, table, invoices) read `selectedAccountId` to scope their data
 * to one account. Angular bridge: a shared service with a BehaviorSubject that
 * several components inject and react to.
 */
interface AccountFilterContextValue {
  selectedAccountId: AccountFilter; // number | 'all' | 'manual'
  setSelectedAccountId: (id: AccountFilter) => void;
}

const AccountFilterContext = createContext<AccountFilterContextValue | null>(null);

export function AccountFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedAccountId, setSelectedAccountId] = useState<AccountFilter>('all');
  return (
    <AccountFilterContext.Provider value={{ selectedAccountId, setSelectedAccountId }}>
      {children}
    </AccountFilterContext.Provider>
  );
}

export function useAccountFilter() {
  const ctx = useContext(AccountFilterContext);
  if (!ctx) throw new Error('useAccountFilter must be used inside <AccountFilterProvider>');
  return ctx;
}
