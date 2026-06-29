# FinLivre

*Enfim livre — organize your finances and finally be free.*

A local-first personal finance app. Import a bank or credit-card statement and FinLivre turns it
into a clear financial picture: spending by category, income vs expense, and upcoming installment
commitments. Built to handle Brazilian credit-card statements, including installments (parcelas).

> **Live:** https://finlivre-1ck0g8iye-joao-costa.vercel.app/ — click "Carregar exemplo" to try it without uploading your own data.

> Status: Milestones 1–5 shipped. Latest: import an invoice from a **photo or PDF** via Claude Vision.

## Why local-first

Your financial data is **stored only in your browser** (IndexedDB) and never sent to a server —
there is no backend. Storage is 100% local, always.

Parsing is deterministic and on-device for OFX. For banks that only provide a PDF — or none at
all (e.g. Inter's open invoice, viewable only in the app) — there's an **optional, opt-in import
from a photo or PDF** that uses Claude Vision. That request goes directly from your browser to
Anthropic **under your own API key** (stored only in your browser); the extracted lines are shown
in an editable review table before anything is saved. The tradeoff is explicit and user-controlled:
the default path is fully local, and the AI path only runs when you choose it, with your key.

## Tech

- Next.js 16 (App Router) and React 19
- TypeScript
- Tailwind CSS v4
- Dexie (IndexedDB) for local-first storage
- Recharts for data visualization

## How it works

Every statement format is just an importer that produces a list of entries. Each entry is
normalized into a single ledger model, categorized by a merchant dictionary that learns from
your corrections, and stored locally. The dashboard reads reactively from that ledger.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Roadmap

1. OFX import, categorization, and a spending dashboard ✅
2. Manual entries and income, for income vs expense and net cashflow ✅
3. Recurring commitments and installment forecasting ✅
4. Invoice cards, export (JSON/CSV), all-time dashboard, tests ✅
5. Import an invoice from a photo or PDF via Claude Vision (BYO key) ✅
6. Shared expenses / split, budgets per category (next)
