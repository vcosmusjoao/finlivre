# FinLivre

*Enfim livre — organize your finances and finally be free.*

**Live app:** **[finlivre.vercel.app](https://finlivre.vercel.app)** — click "Carregar exemplo" on the Lançamentos page to try it instantly, no upload or signup needed.

A local-first personal finance app. Import a bank or credit-card statement and FinLivre turns it
into a clear financial picture: spending by category, income vs expense, budget buckets
(50/30/20-style), and upcoming installment commitments. Built to handle Brazilian credit-card
statements, including installments (*parcelas*).

> Status: Milestones 1–8 shipped. 103 tests passing. Currently in a documentation/visibility
> pass before Milestone 9 (unified import review screen).

## Screenshots

| Dashboard | Lançamentos |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Lançamentos](docs/screenshots/lancamentos.png) |

| Vision import (AI-assisted review) | Planejamento (animated buckets) |
|---|---|
| ![Vision import review](docs/screenshots/vision-import.png) | ![Planejamento](docs/screenshots/planejamento.png) |

## For recruiters — technical highlights

This project exists to be dogfooded (I use it for my own finances) and to demonstrate
product/engineering judgment beyond "another CRUD app." A few decisions worth a closer look:

**Local-first, zero backend.** All data lives in the browser via [Dexie](https://dexie.org/)
(a wrapper over IndexedDB). There is no server, no auth, no database to provision — the schema
has gone through four versions (`v1 → v4`, see [`src/lib/db.ts`](src/lib/db.ts)) as features were
added, each one an additive Dexie migration that runs automatically in the user's browser on
first load. No data ever leaves the device unless the user explicitly opts into the AI import
below. *(Angular parallel: think of each Dexie `version()` block as a schema migration you'd run
against a real DB — except it runs client-side, per user, on demand.)*

**Two import paths, one privacy story.** Statements are read in two ways:
- **OFX (deterministic):** a hand-written parser, no network call, no AI. Free, instant, and
  auditable — a purposeful "no AI needed here" choice, not a fallback.
- **Photo/PDF via Claude Vision (opt-in, BYO key):** for banks that only expose a PDF or an
  in-app-only invoice, the browser calls the Anthropic API **directly**, using the user's own
  API key stored only in `localStorage` — never a project key, never a server in between. The
  model returns structured output (Zod-validated) into the same editable review table used
  before committing to the ledger. The tradeoff is explicit: the default path is 100% local, and
  the AI path only runs when the user chooses it, with their own key and their own cost.

**"Everything is an Entry."** OFX, Vision, manual entry, and recurring items are just four
*importers* that all funnel into one ledger model (`Entry`, in [`src/lib/db.ts`](src/lib/db.ts)).
The dashboard, filters, and budget rollups never know or care where a row came from — they read
one shape. Adding the fifth import source (M9's unified review screen) touches an importer
function, not the dashboard. *(Angular parallel: this is the same shape as several classes
implementing one interface behind a `multi: true` provider token — the consumer only depends on
the interface.)*

**SMIL over CSS for the bucket animation.** The animated "liquid filling a bucket" visual on the
Planejamento tab uses SVG's native `<animateTransform>` (SMIL) instead of a CSS transform. The
reason is a real, easy-to-miss gotcha: CSS transforms applied to SVG elements are resolved in
**CSS pixels**, while the SVG's internal geometry (`viewBox`, `clipPath`, path coordinates) is
defined in **SVG user units**. Mixing the two causes the fill to drift or clip incorrectly across
viewport sizes. SMIL animates directly inside the SVG coordinate system, so the clipped liquid
mask stays pixel-accurate at any size, with no JS animation loop and no layout thrashing.

## Why local-first

Your financial data is **stored only in your browser** (IndexedDB) and never sent to a server —
there is no backend. Storage is 100% local, always.

Parsing is deterministic and on-device for OFX. For banks that only provide a PDF — or none at
all (e.g. Inter's open invoice, viewable only in the app) — there's an **optional, opt-in import
from a photo or PDF** that uses Claude Vision. That request goes directly from your browser to
Anthropic **under your own API key** (stored only in your browser); the extracted lines are shown
in an editable review table before anything is saved.

## Tech

- Next.js 16 (App Router) and React 19
- TypeScript
- Tailwind CSS v4
- Dexie (IndexedDB) for local-first storage
- Recharts for data visualization
- Anthropic SDK (Claude Vision, BYO key) for the optional AI import path

## How it works

Every statement format is just an importer that produces a list of entries. Each entry is
normalized into a single ledger model, categorized by a merchant dictionary that learns from
your corrections, optionally assigned to a budget bucket, and stored locally. The dashboard reads
reactively from that ledger.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Roadmap

1. OFX import, categorization, and a spending dashboard ✅
2. Manual entries and income, for income vs expense and net cashflow ✅
3. Recurring commitments, installment forecasting, account management ✅
4. Invoice cards, export (JSON/CSV), all-time dashboard, tests ✅
5. Import an invoice from a photo or PDF via Claude Vision (BYO key) ✅
6. Account filters, stable category colors, recurring overrides ✅
7. App Router navigation (Dashboard / Lançamentos / Planejamento) ✅
8. Budget buckets (50/30/20-style planning view) ✅
9. Unified import review screen — OFX gets the same editable review table Vision already has (next)
