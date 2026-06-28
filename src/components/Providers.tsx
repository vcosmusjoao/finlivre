'use client';

// App Router layouts are Server Components by default. Providers that use
// React state/context must live in a Client Component wrapper like this one.
import { MonthProvider } from '@/context/MonthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <MonthProvider>{children}</MonthProvider>;
}
