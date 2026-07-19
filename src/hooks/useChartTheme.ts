'use client';

import { useTheme } from 'next-themes';

/**
 * Recharts takes colors as JS props, not Tailwind classes, so it can't read the
 * `dark:` variant system. Values here are kept in sync with the design tokens in
 * globals.css (muted-foreground / card / border / foreground / body) by hand —
 * duplicated rather than read via getComputedStyle, since that's real synchronization
 * complexity not justified for these 2 call sites.
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  return {
    tick: { fill: dark ? '#a1a1aa' : '#71717a' }, // muted-foreground
    tooltip: {
      contentStyle: {
        background: dark ? '#18181b' : '#ffffff', // card
        border: `1px solid ${dark ? '#3f3f46' : '#e4e4e7'}`, // border
        borderRadius: 8,
      },
      labelStyle: { color: dark ? '#fafafa' : '#18181b' }, // foreground
      itemStyle: { color: dark ? '#d4d4d8' : '#3f3f46' }, // body
    },
  };
}
