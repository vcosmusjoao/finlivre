# Start here — next session (M7)

Open this folder (`C:\dev\finlivre`) in Claude Code.
M1 → M6 complete + hotfixes (date format, batch categorization). Start by reading PLAN.md §10.

## 0. Orient (2 min)
- 67 tests passing. TypeScript clean. Build clean.
- `TransactionsTable` has: dynamic title, count, checkboxes, floating action bar, retro dialog.
- Next: decide **M7 scope** before writing any code.

## 1. Decide M7 — two strong candidates (independent)

### Option A — Categorias-mestre (João's explicit wish) ⭐
A second taxonomy level above merchant categories: buckets **Custos fixos, Conforto, Metas,
Prazeres, Liberdade financeira, Conhecimento**. Every spend gets reclassified into a bucket; the
"Todos" tab gets per-bucket charts. This is the "analysis tier" he described.
- **Discuss the data model first.** A `bucket` field on each category? A `categoryBucket` map?
  Roll-up of totals per bucket? New classification UX?
- Note: this is what justifies reviving the **dead `categories` table** (today categories are just
  strings on `entry.category`; `monthlyBudgetCents`/`color` are unused).
- Bigger user setup upfront, but the highest planning power. It's a full milestone.

### Option B — Split / Empréstimos
Mark part of a purchase as someone else's (50% Gabi) → halves your effective amount in all totals;
plus Cobranças (what people owe you) with a `wa.me` "Lembrar" deep link.
- **Architectural prerequisite:** split touches every total. There is **no central sum function**
  yet (inline `reduce(+amountCents)` in several components). M6 started this with `matchesFilters`.
  Before split, extract `effectiveAmountCents(entry)` as a no-op (tests green), then apply split =
  one function changes instead of six.
- Data model: `splits` table `{ entryId, personName, amountCents, dueDate?, paidAt? }`. A Cobrança
  is just a split with `dueDate` and no `paidAt` (one table powers both). See PLAN.md §10.

## 2. Session flow (recommended)
1. Read PLAN.md §10 together.
2. Pick A or B (they're independent). Challenge the choice — which delivers more, with less risk?
3. **Design the data model / UX BEFORE touching code.**
4. João should be taught, not handed finished code. Explain every decision, relate to Angular.

## 3. Reminders
- Money is always integer **cents** (`amountCents`).
- Dexie = Client Component (`'use client'`). Schema is at **v3** (`recurringOverrides` added in M6).
- All `<dialog>` modals need `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`.
- New idea mid-build? → PLAN.md §10 "Parked". Ask: "does this block M7?" If not → park it.
- Run `npm test` — 67 tests must stay green before any commit.
- `useLiveQuery` with array default: always `[] as MyType[]`, not bare `[]`.
- `matchesFilters` in `lib/filters.ts` is the single filter predicate. Reuse; don't re-roll.
- Category colors are deterministic via `lib/categoryColor.ts → colorForCategory` (no DB).
- Batch categorization: `normalizeMerchant` from `lib/categorize.ts` is the merchant normalizer.
