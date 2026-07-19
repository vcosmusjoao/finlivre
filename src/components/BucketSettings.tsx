'use client';

import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Bucket, type BucketType } from '@/lib/db';
import { BUCKET_PRESETS } from '@/lib/bucketPresets';
import { applyPreset } from '@/lib/buckets';
import { useLocale } from '@/i18n/LocaleContext';

export function BucketSettings() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useLocale();

  const dbBuckets = useLiveQuery(
    () => db.buckets.orderBy('order').toArray(),
    [],
    [] as Bucket[],
  );
  const assignments = useLiveQuery(() => db.categoryBuckets.toArray(), [], []);
  // Combines expense entries + recurring expense items — excludes income categories (e.g. Salário).
  const categories = useLiveQuery(
    () => Promise.all([
      db.entries.where('direction').equals('expense').toArray().then(es => es.map(e => e.category)),
      db.recurringItems.where('direction').equals('expense').toArray().then(rs => rs.map(r => r.category)),
    ]).then(([ec, rc]) =>
      [...new Set([...ec, ...rc])].filter(Boolean).sort() as string[]
    ),
    [],
    [] as string[],
  );

  // Local edit state — snapshot of DB buckets; user edits here, saves explicitly.
  const [localBuckets, setLocalBuckets] = useState<Bucket[]>([]);

  function open() {
    setLocalBuckets(dbBuckets);
    dialogRef.current?.showModal();
  }

  function updateBucket(idx: number, patch: Partial<Omit<Bucket, 'id'>>) {
    setLocalBuckets(prev => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  }

  async function saveBuckets() {
    await db.transaction('rw', db.buckets, async () => {
      for (const b of localBuckets) {
        if (b.id !== undefined) {
          await db.buckets.update(b.id, {
            name: b.name,
            type: b.type,
            targetPercent: b.targetPercent,
            color: b.color,
            order: b.order,
          });
        }
      }
    });
  }

  async function handleApplyPreset(presetName: string) {
    const preset = BUCKET_PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    await applyPreset(preset);
    // Refresh local state from DB (preset clears categoryBuckets too)
    const fresh = await db.buckets.orderBy('order').toArray();
    setLocalBuckets(fresh);
  }

  async function handleCategoryAssign(category: string, bucketId: string) {
    if (bucketId === '') {
      await db.categoryBuckets.delete(category);
    } else {
      await db.categoryBuckets.put({ category, bucketId: Number(bucketId) });
    }
  }

  const totalPercent = localBuckets.reduce((s, b) => s + (b.targetPercent || 0), 0);
  const assignedSet = new Set(assignments.map(a => a.category));
  const unassignedCount = categories.filter(c => !assignedSet.has(c)).length;

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="text-sm px-3 py-1.5 rounded-lg border border-border text-body hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        {t.bucketSettings.button}
      </button>

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 w-full max-w-xl shadow-xl backdrop:bg-black/40 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">
            {t.bucketSettings.title}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Preset selector */}
        <div className="mb-5">
          <p className="text-xs text-zinc-500 mb-2">{t.bucketSettings.applyPreset}</p>
          <div className="flex gap-2 flex-wrap">
            {BUCKET_PRESETS.map(p => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p.name)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-body hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bucket editor */}
        {localBuckets.length === 0 ? (
          <p className="text-sm text-zinc-400 mb-4">
            {t.bucketSettings.emptyState}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2 mb-3">
              <div className="grid grid-cols-[28px_1fr_96px_72px] gap-2 text-xs text-zinc-400 px-1">
                <span />
                <span>{t.common.name}</span>
                <span>{t.common.type}</span>
                <span className="text-right">%</span>
              </div>
              {localBuckets.map((b, i) => (
                <div
                  key={b.id ?? i}
                  className="grid grid-cols-[28px_1fr_96px_72px] gap-2 items-center"
                >
                  <input
                    type="color"
                    value={b.color}
                    onChange={e => updateBucket(i, { color: e.target.value })}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    title="Cor do balde"
                  />
                  <input
                    type="text"
                    value={b.name}
                    onChange={e => updateBucket(i, { name: e.target.value })}
                    className={inputCls}
                  />
                  <select
                    value={b.type}
                    onChange={e => updateBucket(i, { type: e.target.value as BucketType })}
                    className={inputCls}
                  >
                    <option value="gasto">{t.bucketType.gasto}</option>
                    <option value="meta">{t.bucketType.meta}</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={b.targetPercent}
                    onChange={e =>
                      updateBucket(i, { targetPercent: Number(e.target.value) })
                    }
                    className={`${inputCls} text-right`}
                  />
                </div>
              ))}
            </div>

            {/* Sum warning + save */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-xs text-zinc-500">
                {t.bucketSettings.total}{' '}
                <strong
                  className={
                    totalPercent === 100
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }
                >
                  {totalPercent}%
                </strong>
              </span>
              {totalPercent !== 100 && (
                <span className="text-xs text-amber-600">
                  {totalPercent < 100
                    ? t.bucketSettings.remainderNote(100 - totalPercent)
                    : t.bucketSettings.sumWarning}
                </span>
              )}
              <button
                type="button"
                onClick={saveBuckets}
                className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
              >
                {t.bucketSettings.saveBuckets}
              </button>
            </div>
          </>
        )}

        {/* Category assignment */}
        {localBuckets.length > 0 && categories.length > 0 && (
          <div className="border-t border-border-divider pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-body">
                {t.bucketSettings.assignCategories}
              </h3>
              {unassignedCount > 0 && (
                <span className="text-xs font-medium bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                  {t.bucketSettings.unassignedCount(unassignedCount)}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {categories.map(cat => {
                const assignment = assignments.find(a => a.category === cat);
                const isUnassigned = !assignedSet.has(cat);
                return (
                  <div
                    key={cat}
                    className={`flex items-center gap-3 px-2 py-1 rounded-lg ${
                      isUnassigned
                        ? 'bg-warning/10'
                        : ''
                    }`}
                  >
                    <span className="text-sm text-body flex-1 truncate">
                      {cat}
                    </span>
                    <select
                      value={assignment?.bucketId?.toString() ?? ''}
                      onChange={e => handleCategoryAssign(cat, e.target.value)}
                      className={selectSmCls}
                    >
                      <option value="">{t.bucketSettings.noBucket}</option>
                      {dbBuckets.map(b => (
                        <option key={b.id} value={b.id!.toString()}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

const inputCls =
  'rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';

// Used for the per-category select — fixed width so the category name span has room.
const selectSmCls =
  'rounded-lg border border-border bg-muted px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 flex-shrink-0';
