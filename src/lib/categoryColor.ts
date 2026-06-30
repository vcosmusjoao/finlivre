/**
 * Stable, deterministic color per category name.
 *
 * Why not store colors in the DB? The `categories` table is unused — categories
 * live only as strings on entries. So instead of materializing a color, we derive
 * it: the same category name always hashes to the same palette slot, for free and
 * across sessions. Replaces the old positional `COLORS[i % length]` in SpendingChart,
 * which made a category's color shift month-to-month depending on how many other
 * categories happened to appear.
 *
 * Hash: djb2 — the same lightweight, synchronous fingerprint used by the vision cache.
 */

/** Shared category palette — 12 hues spread across the wheel for maximum distinctness. */
export const CATEGORY_COLORS = [
  '#6366f1', // indigo
  '#f97316', // orange
  '#10b981', // emerald
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#84cc16', // lime
  '#ec4899', // pink
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#f43f5e', // rose
] as const;

/** Neutral colour for the "Outros" bucket. */
export const OUTROS_COLOR = '#a1a1aa';

/** djb2 fingerprint → unsigned int. Same family as importers/vision.ts. */
function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/** Returns a stable hex color for a category name. */
export function colorForCategory(name: string): string {
  const index = djb2(name) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}
