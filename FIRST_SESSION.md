# Start here — next session (M8)

Open this folder (`C:\dev\finlivre`) in Claude Code.
M1 → M7 complete. Start by reading PLAN.md §10.

## 0. Orient (2 min)
- 67 tests passing. TypeScript clean. Build clean.
- Two routes live: `/dashboard` and `/lancamentos`. AppShell persists across navigation.
- Next: **M8 — Categorias-mestre** (João's explicit wish, top of §10 in PLAN.md).

## 1. M8 — Categorias-mestre (50/30/20)

A second taxonomy tier above merchant categories. Every spend gets a **balde** (bucket);
the Planejamento tab (removed in M7, returns in M8) shows per-bucket charts.

### The buckets (João's list)
**Custos fixos · Conforto · Metas · Prazeres · Liberdade financeira · Conhecimento**

### What this touches — design the data model before coding
The key decision: **where does the bucket live?**

**Option A — field on Entry directly** (`entry.bucket`):
- Simplest. Set on import/categorization. No join needed.
- Problem: same merchant ("Spotify") might be "Conforto" for João but "Metas" for someone else.
  Also: when João reclassifies a bucket, he'd need to update all past entries.

**Option B — bucket on Category** (`category.bucket`):
- The `categories` table is already in Dexie but dead (categories are just strings on `entry.category`).
  Reviving it: `{ name, bucket? }`. A bucket roll-up = join Entry → Category → bucket.
- Problem: `entry.category` is a free string, not a FK. Multiple entries can share the same
  category string but there's no guarantee a `Category` row exists for it.
- Solution: auto-create `Category` rows from distinct `entry.category` values (migration).

**Option C — a standalone `categoryBuckets` map** (`{ category: string, bucket: string }`):
- No schema change to `Entry` at all. A separate lookup table. Simplest migration path.
- Roll-up: `effectiveAmountCents` × bucket = look up `categoryBuckets[entry.category]`.
- This is the **recommended starting point** — discuss with João.

### The Planejamento tab returns in M8
In M7 we removed it because it had no real content. In M8 it should contain:
- Per-bucket spending chart (the 50/30/20 view)
- A classification UI: "for each merchant category, pick a bucket"
- Future: investment goals, reserve targets

### Dexie schema impact
- Schema is currently at **v3**. Adding `categoryBuckets` table = **v4**.
- Remember: Dexie version bump requires adding to the `db.version(4).stores({...})` chain.
  Do NOT edit the existing `version(3)` block.

## 2. Session flow (recommended)
1. Read PLAN.md §10 together (Categorias-mestre entry at the top).
2. **Design the data model first.** Compare Options A/B/C above. João should pick.
3. Design the classification UX: how does the user assign buckets to categories?
4. Only then: implement. Start with the data layer (Dexie table + migration), then charts.
5. João should be taught, not handed finished code. Explain every decision, relate to Angular.

## 3. Reminders
- Money is always integer **cents** (`amountCents`).
- Dexie = Client Component (`'use client'`). Schema is at **v3** (`recurringOverrides` added in M6).
- All `<dialog>` modals need `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`.
- New idea mid-build? → PLAN.md §10 "Parked". Ask: "does this block M8?" If not → park it.
- Run `npm test` — 67 tests must stay green before any commit.
- `useLiveQuery` with array default: always `[] as MyType[]`, not bare `[]`.
- `matchesFilters` in `lib/filters.ts` is the single filter predicate. Reuse; don't re-roll.
- Category colors are deterministic via `lib/categoryColor.ts → colorForCategory` (no DB).
- **App Router structure:** `src/app/layout.tsx` → `Providers` → `AppShell` → `{children}`.
  `AppShell` lives in `src/components/AppShell.tsx` and is a Client Component.
  Routes: `src/app/dashboard/page.tsx` and `src/app/lancamentos/page.tsx`.
- `usePathname()` requires `'use client'` — it reads browser URL state.
- `redirect()` in a Server Component does NOT need `'use client'`.
