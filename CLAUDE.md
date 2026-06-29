# FinLivre — project brief for Claude Code

FinLivre ("enfim livre" — finally free) is João's Phase 2 portfolio project: a **local-first
personal finance app** that turns bank/credit-card exports into a clear financial picture.
It is the "real React/Next.js project" milestone in his career plan.
Treat it as a learning project AND a portfolio piece.

## Read these first
- `PLAN.md` — vision, architecture, data model, milestones. The source of truth.
- `FIRST_SESSION.md` — what to tackle in the next session (updated after every milestone).
- `docs/nextjs-notes.md` — Next.js mental model with Angular bridges (João is learning Next.js).

## Current state (as of 2026-06-28)
- **M1 ✅** OFX import, categorization, spending chart, sample data, Vercel deploy.
- **M2 ✅** Manual entries, income/expense, month filter, billing cycle (`billingMonth`).
- **M3 ✅** Accounts (color-coded), recurring items, future month projections (on-the-fly),
  installment forecast, inline category editing (merchant dictionary), data hygiene.
- **M4 ✅** Invoice cards, JSON/CSV export, 40 unit tests, "Todos" all-time dashboard, manual installments.
- **Next: M5** — see `FIRST_SESSION.md` and `PLAN.md §10` for parked ideas.

## Working style (important)
João is a strong Angular engineer learning React/Next.js. He has explicitly asked to:
- Be **taught**, not handed finished code. Explain the *why*, relate concepts to **Angular**.
- Have his **assumptions challenged**. Think like a Staff Engineer. Suggest simpler options.
- Be protected from **scope creep** — his single biggest pattern is *not finishing projects*.
  When a new feature idea appears, park it in `PLAN.md §10` and move on.
  Ask: "does this block the current milestone?" If not → park it.

## The one architectural rule
Everything is an **`Entry`** (income or expense). Imports (OFX/CSV/PDF), manual entry, and
recurring rules are all just *sources* that produce `Entry[]`. Never build a feature that
bypasses the Entry ledger. This is what keeps the big vision buildable. See PLAN.md §4–5.

## Hard decisions already made (do not re-litigate without reason)
- **Local-first**: data lives in the browser via **IndexedDB (Dexie)**. No backend in v1.
- **No AI dependency in v1**: parsing is deterministic; categorization is a merchant
  dictionary that learns from the user. AI is a *parked* optional v2 enhancement.
- **Money is stored as integer cents** (`amountCents`). Never use floats for money.
- **`billingMonth` separates purchase date from budget month.** `effectiveMonth(entry)` is
  the single function used everywhere for month filtering.
- **Future months are computed on-the-fly** (`getProjectedMonth` in `src/lib/projection.ts`),
  never materialized in the DB. This avoids stale-state bugs when real OFX arrives.
- **`direction: 'transfer'`** for credit card bill payments — excluded from all totals.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Dexie 4 (+ dexie-react-hooks)
· Recharts 3 · deploy on Vercel. Node 20.

## Gotchas that will bite you
- Dexie/IndexedDB is **browser-only**. Any module that touches the DB must run in a
  **Client Component** (`'use client'`). See docs/nextjs-notes.md.
- Tailwind v4 resets `<dialog>` default centering. All modals need:
  `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2` on the dialog element.
- Future month = `selectedMonth > currentMonth()`. Past/current months have real DB entries;
  future months combine `getProjectedMonth()` + real entries (manual launches).

@AGENTS.md
