/**
 * Local-first settings. The Anthropic API key lives only in the browser's
 * localStorage — it is the user's own key, used to call Claude Vision directly
 * from the browser for the image/PDF importer. It is never sent to any server
 * of ours (we have none). See PLAN.md §8 (privacy) and the M5 import-by-vision feature.
 */

const API_KEY_STORAGE = "finlivre.anthropicApiKey";

/** Returns the stored Anthropic API key, or null if none is set / not in the browser. */
export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(API_KEY_STORAGE);
}

/** Persists the Anthropic API key in localStorage (trims whitespace). */
export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(API_KEY_STORAGE, key.trim());
}

/** Removes the stored Anthropic API key. */
export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(API_KEY_STORAGE);
}
