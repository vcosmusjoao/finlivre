import { db } from './db';

/**
 * Per-month exceptions to a recurring item. Each (recurringItemId, month) pair has at
 * most one override row — these helpers upsert/clear it. The projection reads them in
 * getProjectedMonth; nothing is ever materialized as an Entry.
 */

/** Sets (or updates) the amount of a recurring item for a single month. */
export async function setRecurringAmountOverride(
  recurringItemId: number,
  month: string,
  amountCents: number,
): Promise<void> {
  const existing = await db.recurringOverrides
    .where('[recurringItemId+month]').equals([recurringItemId, month]).first();
  if (existing) {
    await db.recurringOverrides.update(existing.id!, { amountCents, skip: false });
  } else {
    await db.recurringOverrides.add({ recurringItemId, month, amountCents });
  }
}

/** Marks a recurring item as not applying in a single month. */
export async function skipRecurringForMonth(
  recurringItemId: number,
  month: string,
): Promise<void> {
  const existing = await db.recurringOverrides
    .where('[recurringItemId+month]').equals([recurringItemId, month]).first();
  if (existing) {
    await db.recurringOverrides.update(existing.id!, { skip: true, amountCents: undefined });
  } else {
    await db.recurringOverrides.add({ recurringItemId, month, skip: true });
  }
}

/** Removes any override for this month, restoring the recurring item's base value. */
export async function clearRecurringOverride(
  recurringItemId: number,
  month: string,
): Promise<void> {
  await db.recurringOverrides
    .where('[recurringItemId+month]').equals([recurringItemId, month]).delete();
}
