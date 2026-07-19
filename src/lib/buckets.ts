import { db, type Bucket, type CategoryBucket, type BucketType } from './db';
import { matchesFilters, type AccountFilter } from './filters';
import { currentMonth } from './format';
import { getProjectedMonth } from './projection';
import type { BucketPreset } from './bucketPresets';

export interface BucketRollup {
  bucket: Bucket;
  spentCents: number;
  categories: { category: string; cents: number }[];
}

export interface RollupResult {
  buckets: BucketRollup[];
  unassigned: { spentCents: number; categories: { category: string; cents: number }[] };
}

export type BucketStatus =
  | 'under'     // gasto: spending < 80% of target
  | 'near'      // gasto: spending >= 80% and <= 100% of target
  | 'over'      // gasto: spending > 100% of target
  | 'progress'  // meta: not yet reached
  | 'reached';  // meta: >= 100% of target

export interface BucketProgress {
  ratio: number;        // spentCents / targetCents (can exceed 1.0)
  targetCents: number;
  status: BucketStatus;
}

export type BucketInsight =
  | { kind: 'over'; bucketName: string; overByReais: string; severity: 'warning' }
  | { kind: 'reached'; bucketName: string; severity: 'success' };

/** Replaces all buckets (and clears category assignments) with the preset in a single transaction. */
export async function applyPreset(preset: BucketPreset): Promise<void> {
  await db.transaction('rw', db.buckets, db.categoryBuckets, async () => {
    await db.buckets.clear();
    await db.categoryBuckets.clear();
    await db.buckets.bulkAdd(preset.buckets);
  });
}

/** Pure: returns the bucketId for a category, or undefined if unassigned. */
export function bucketForCategory(
  category: string,
  assignments: CategoryBucket[],
): number | undefined {
  return assignments.find(a => a.category === category)?.bucketId;
}

/**
 * Aggregates expense entries for a month into per-bucket roll-ups.
 * Every bucket appears in the result even when spentCents = 0.
 * Expenses with no bucket assignment go to `unassigned`.
 *
 * For the current and future months, recurring expense items (e.g. aluguel, assinaturas)
 * are added via getProjectedMonth — mirroring the same logic used by SummaryCards.
 * Past months use only real DB entries (recurring items are not materialised in the ledger).
 */
export async function rollupBuckets({
  month,
  accountId = 'all',
}: {
  month: string;
  accountId?: AccountFilter;
}): Promise<RollupResult> {
  const includeProjection = month >= currentMonth();

  const [allBuckets, allAssignments, realExpenses, projection] = await Promise.all([
    db.buckets.orderBy('order').toArray(),
    db.categoryBuckets.toArray(),
    db.entries
      .where('direction').equals('expense')
      .filter(e => matchesFilters(e, { month, accountId }))
      .toArray(),
    includeProjection ? getProjectedMonth(month, accountId) : Promise.resolve(null),
  ]);

  // Normalise both sources to { category, amountCents } pairs for uniform processing.
  const allExpenses: { category: string; amountCents: number }[] = [
    ...realExpenses.map(e => ({ category: e.category, amountCents: e.amountCents })),
    ...(projection?.items
      .filter(i => i.direction === 'expense')
      .map(i => ({ category: i.category, amountCents: i.amountCents })) ?? []),
  ];

  const categoryToBucket = new Map(allAssignments.map(a => [a.category, a.bucketId]));

  const bucketSpending = new Map<number, number>();
  const bucketCategories = new Map<number, Map<string, number>>();
  const unassignedByCategory = new Map<string, number>();
  let unassignedTotal = 0;

  for (const { category, amountCents } of allExpenses) {
    const bucketId = categoryToBucket.get(category);
    if (bucketId === undefined) {
      unassignedTotal += amountCents;
      unassignedByCategory.set(
        category,
        (unassignedByCategory.get(category) ?? 0) + amountCents,
      );
    } else {
      bucketSpending.set(bucketId, (bucketSpending.get(bucketId) ?? 0) + amountCents);
      const catMap = bucketCategories.get(bucketId) ?? new Map<string, number>();
      catMap.set(category, (catMap.get(category) ?? 0) + amountCents);
      bucketCategories.set(bucketId, catMap);
    }
  }

  const bucketRollups: BucketRollup[] = allBuckets.map(bucket => ({
    bucket,
    spentCents: bucketSpending.get(bucket.id!) ?? 0,
    categories: Array.from(
      (bucketCategories.get(bucket.id!) ?? new Map<string, number>()).entries(),
    ).map(([category, cents]) => ({ category, cents })),
  }));

  return {
    buckets: bucketRollups,
    unassigned: {
      spentCents: unassignedTotal,
      categories: Array.from(unassignedByCategory.entries()).map(([category, cents]) => ({
        category,
        cents,
      })),
    },
  };
}

/** Pure: computes fill ratio and status for a single bucket. */
export function bucketProgress(
  spentCents: number,
  targetPercent: number,
  incomeCents: number,
  type: BucketType,
): BucketProgress {
  const targetCents = Math.round((targetPercent / 100) * incomeCents);
  const ratio = targetCents === 0 ? 0 : spentCents / targetCents;

  let status: BucketStatus;
  if (type === 'gasto') {
    if (ratio > 1) status = 'over';
    else if (ratio >= 0.8) status = 'near';
    else status = 'under';
  } else {
    status = ratio >= 1 ? 'reached' : 'progress';
  }

  return { ratio, targetCents, status };
}

/** Pure: generates deterministic nudges from the current month's rollups. */
export function bucketInsights(
  rollups: BucketRollup[],
  incomeCents: number,
): BucketInsight[] {
  return rollups.flatMap(({ bucket, spentCents }): BucketInsight[] => {
    const { status, targetCents } = bucketProgress(
      spentCents,
      bucket.targetPercent,
      incomeCents,
      bucket.type,
    );

    if (bucket.type === 'gasto' && status === 'over') {
      const overByReais = ((spentCents - targetCents) / 100).toFixed(2).replace('.', ',');
      return [{
        kind: 'over' as const,
        bucketName: bucket.name,
        overByReais,
        severity: 'warning' as const,
      }];
    }

    if (bucket.type === 'meta' && status === 'reached') {
      return [{
        kind: 'reached' as const,
        bucketName: bucket.name,
        severity: 'success' as const,
      }];
    }

    return [];
  });
}


export async function monthIncomeCents({
  month,
  accountId = 'all',
}: {
  month: string;
  accountId?: AccountFilter;
}): Promise<number> {
  const entries = await db.entries
    .where('direction')
    .equals('income')
    .filter(e => matchesFilters(e, { month, accountId }))
    .toArray();

  const realIncome = entries.reduce((sum, e) => sum + e.amountCents, 0);

  if (month >= currentMonth()) {
    const projected = await getProjectedMonth(month, accountId);
    return realIncome + projected.totalIncomeCents;
  }

  return realIncome;
}
export async function monthExpenseCents({
  month,
  accountId = 'all',
}: {
  month: string;
  accountId?: AccountFilter;
}): Promise<number> {
  const entries = await db.entries
    .where('direction')
    .equals('expense')
    .filter(e => matchesFilters(e, { month, accountId }))
    .toArray();

  const realExpense = entries.reduce((sum, e) => sum + e.amountCents, 0);

  if (month >= currentMonth()) {
    const projected = await getProjectedMonth(month, accountId);
    return realExpense + projected.totalExpenseCents;
  }

  return realExpense;
}
