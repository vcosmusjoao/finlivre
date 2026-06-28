# FinLivre — project brief for Claude Code

FinLivre ("enfim livre" — finally free) is João's Phase 2 portfolio project: a **local-first
personal finance app** that turns
bank/credit-card exports into a clear financial picture. It is the "real React/Next.js project"
milestone in his career plan. Treat it as a learning project AND a portfolio piece.

## Read these first
- `PLAN.md` — vision, architecture, data model, milestones. The source of truth.
- `FIRST_SESSION.md` — the ordered checklist for what to build next.
- `docs/nextjs-notes.md` — Next.js mental model with Angular bridges (João is learning Next.js).

## Working style (important)
João is a strong Angular engineer learning React/Next.js. He has explicitly asked to:
- Be **taught**, not handed finished code. Explain the *why*, relate concepts to **Angular**.
- Have his **assumptions challenged**. Think like a Staff Engineer. Suggest simpler options.
- Be protected from **scope creep** — his single biggest pattern is *not finishing projects*.
  When a new feature idea appears, ask "does this block Milestone 1?" If not, write it in
  PLAN.md "parked ideas" and move on. **Ship Milestone 1 before anything else.**

## The one architectural rule
Everything is an **`Entry`** (income or expense). Imports (OFX/CSV/PDF), manual entry, and
recurring rules are all just *sources* that produce `Entry[]`. Never build a feature that
bypasses the Entry ledger. This is what keeps the big vision buildable. See PLAN.md §4–5.

## Hard decisions already made (do not re-litigate without reason)
- **Local-first**: data lives in the browser via **IndexedDB (Dexie)**. No backend in v1.
- **No AI dependency in v1**: parsing is deterministic; categorization is a merchant
  dictionary that learns from the user. AI is a *parked* optional v2 enhancement.
- **Money is stored as integer cents** (`amountCents`). Never use floats for money.
- **Milestone 1 input is OFX** (one parser covers Nubank/Inter/C6/PicPay). PDF comes last.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Dexie 4 (+ dexie-react-hooks)
· Recharts 3 · deploy on Vercel. Node 20.

## Gotcha that will bite you
Dexie/IndexedDB is **browser-only**. Any module that touches the DB must run in a
**Client Component** (`'use client'`). The dashboard is client-side. See docs/nextjs-notes.md.

@AGENTS.md
