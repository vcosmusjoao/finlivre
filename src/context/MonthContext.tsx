'use client';

import { createContext, useContext, useState } from 'react';
import { currentMonth } from '@/lib/format';

interface MonthContextValue {
  selectedMonth: string; // 'yyyy-MM', or '' for all time
  setSelectedMonth: (month: string) => void;
}

const MonthContext = createContext<MonthContextValue | null>(null);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  return (
    <MonthContext.Provider value={{ selectedMonth, setSelectedMonth }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used inside <MonthProvider>');
  return ctx;
}
