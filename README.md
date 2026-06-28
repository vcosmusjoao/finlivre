# FinLivre

*Enfim livre — organize your finances and finally be free.*

A local-first personal finance app. Import a bank or credit-card statement and FinLivre turns it
into a clear financial picture: spending by category, income vs expense, and upcoming installment
commitments. Built to handle Brazilian credit-card statements, including installments (parcelas).

> Status: in development. Milestone 1 (OFX import + dashboard) in progress.

## Why local-first

Your financial data is stored only in your browser (IndexedDB) and never sent to a server.
Parsing happens entirely on your device. This is a deliberate design choice: privacy by default,
and a one-click sample statement so anyone can try the app without uploading their own data.

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

1. OFX import, categorization, and a spending dashboard (current)
2. Manual entries and income, for income vs expense and net cashflow
3. Recurring commitments and installment forecasting
4. Multiple accounts, CSV/PDF import, and budgets per category
