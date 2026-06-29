# Start here — next session (Batch Categorization)

Open this folder (`C:\dev\finlivre`) in Claude Code.
M1 → M6 complete + hotfix (date format). Start session by reading PLAN.md §10 and this file.

## 0. Orient (2 min)
- 67 tests passing. TypeScript clean. Build clean.
- Date format: `formatDate` in `lib/format.ts` (string split, no `new Date` — timezone safety).
- Next feature: **batch categorization** (mini-feature, ~2 days, before M7).

## 1. Batch categorization — the problem

The user's biggest daily pain: after importing 40 transactions, most arrive uncategorized.
Categorizing one-by-one is tedious. The ask: **select multiple rows → assign one category to all**.

The `MerchantRule` table already exists — when you categorize inline, it saves a rule so future
imports auto-categorize. But two gaps remain:
1. **Retroactive:** existing entries already in the DB stay "Uncategorized" even after a rule is saved.
2. **Volume:** bulk import with many unknown merchants means many individual clicks.

## 2. Design decisions (already discussed — do not re-litigate)

- **Multi-select + bulk assign** (not grouping by merchant — João explicitly confirmed).
- **Checkbox visible on hover** on each row (clean; desktop-first for now, mobile later).
- **Floating action bar** at the bottom when ≥1 row selected — standard pattern (Gmail, Linear).
  Shows: "X selecionadas · [dropdown categoria ▾] · [Aplicar] · [Cancelar]"
- **Category dropdown** pulls from `db.entries.orderBy('category').uniqueKeys()` — no new table,
  categories already exist as strings on `entry.category`.
- **On apply:** (1) update `category` on all selected entries, (2) save `MerchantRule` for each
  unique normalized merchant in the selection.
- **Retroactive prompt:** after applying, ask: "Aplicar 'Food' às outras N transações sem categoria
  do mesmo comerciante?" — user confirms before retroactive update.

## 3. Implementation notes

**State:** selection is local UI state in `TransactionsTable` (no Context needed — it's ephemeral).
`useState<Set<number>>(new Set())` where the number is `entry.id`.

**Merchant normalization:** already exists in `src/lib/categorize.ts` — reuse `normalize()`.

**Retroactive query:**
```ts
db.entries
  .where('category').equals('Uncategorized')
  .filter(e => normalizedMerchants.has(normalize(e.description)))
  .modify({ category: newCategory })
```

**DB schema:** no changes needed. Uses existing `entries` and `merchantRules` tables (schema v3).

**Floating action bar:** `position: fixed` bottom, only renders when `selection.size > 0`.
In Angular terms: think of it as a conditional `*ngIf` on a sticky bottom bar.

**Clear selection:** after apply, after cancel, and after a month/account filter change
(entries in view change, stale selection would be confusing).

## 4. Tests to add
- Select + bulk assign updates all entries.
- MerchantRule is saved for each unique merchant in the selection.
- Retroactive: entries with same normalized merchant + Uncategorized get updated.
- Empty selection: action bar hidden.

## 5. Reminders
- Money is always integer **cents** (`amountCents`).
- Dexie = Client Component (`'use client'`). Schema is at **v3**.
- `useLiveQuery` with array default: always `[] as MyType[]`, not bare `[]`.
- Category colors are deterministic via `lib/categoryColor.ts → colorForCategory` (no DB).
- `matchesFilters` in `lib/filters.ts` is the single filter predicate — reuse, don't re-roll.
- New idea mid-build? → PLAN.md §10. Ask: "does this block batch categorization?" If not → park it.
- Run `npm test` — 67 tests must stay green before any commit.

## 6. After batch categorization
Decide M7 scope (read PLAN.md §10):
- **Option A:** Categorias-mestre (João's explicit wish — 6 buckets, reclassify all spending).
- **Option B:** Split/Cobranças (requires `effectiveAmountCents` refactor first).
