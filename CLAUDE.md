# FinLivre — project brief for Claude Code

FinLivre ("enfim livre" — finally free) is João's Phase 2 portfolio project: a **local-first
personal finance app** that turns bank/credit-card exports into a clear financial picture.
It is the "real React/Next.js project" milestone in his career plan.
Treat it as a learning project AND a portfolio piece.

## Read these first
- `PLAN.md` — vision, architecture, data model, milestones. The source of truth.
- `FIRST_SESSION.md` — what to tackle in the next session (updated after every milestone).
- `docs/nextjs-notes.md` — Next.js mental model with Angular bridges (João is learning Next.js).

## Current state (as of 2026-06-29)
- **M1 ✅** OFX import, categorization, spending chart, sample data, Vercel deploy.
- **M2 ✅** Manual entries, income/expense, month filter, billing cycle (`billingMonth`).
- **M3 ✅** Accounts (color-coded), recurring items, future month projections (on-the-fly),
  installment forecast, inline category editing (merchant dictionary), data hygiene.
- **M4 ✅** Invoice cards, JSON/CSV export, 40 unit tests, "Todos" all-time dashboard, manual installments.
- **M5 ✅** Import por imagem/PDF via Claude Vision (BYO-key, browser-direct, sem backend). 50 testes.
  - `importers/vision.ts`: modelo `claude-sonnet-4-6`, structured output (Zod), **cache two-layer**
    (module-level `Map` + localStorage, djb2 hash, LRU 30 entradas, cross-session).
  - `VisionImportButton.tsx`: flow espelha OFX — arquivo → AI → `AccountPickerModal` → tabela de revisão.
    `invoiceTotalCents` extraído pela IA preenche o campo "Total da fatura" automaticamente →
    salvo como `InvoiceStatement` (mesmo papel do `LEDGERBAL` do OFX). Badge de cache "⚡ sem consumo".
    Spinner durante análise (`animate-spin`). Layout: botões contextuais abaixo de `InvoiceCards`.
  - `commitParsedEntries` extraído em `import-pipeline.ts` (dedupe cross-source OFX+vision).
  - `settings.ts` + `ApiKeySettings.tsx`: chave BYO no localStorage, nunca no servidor.
  - `SampleButton.tsx` extraído de `UploadButton.tsx` — "Carregar exemplo" movido para o final.
- **M6 ✅** Polimento e filtros (Split e Budgets **adiados** — ver decisão abaixo). 67 testes.
  - **Cores de categoria estáveis:** `categoryColor.ts` (`colorForCategory`, hash djb2) substitui a cor
    posicional do donut. Mesma categoria → mesma cor sempre. Usado em `SpendingChart`, chips de
    `TransactionsTable` e `ProjectedView`.
  - **Projeção legível:** linha do `ProjectedView` reestruturada em 2 linhas + tooltip (descrição não
    fica mais espremida na coluna estreita de mês futuro).
  - **Header organizado:** `SettingsMenu.tsx` (engrenagem) agrupa Contas/Recorrentes/Exportar/Limpar.
    Filhos ficam montados enquanto aberto (dialogs nativos vivem dentro do container → clique em modal
    conta como "dentro").
  - **Filtro de conta global:** `AccountFilterContext` (irmão do `MonthContext`) + `AccountFilter.tsx`
    (pills). Predicado central **`matchesFilters(entry, {month, accountId})`** em `lib/filters.ts` —
    único ponto de verdade, aplicado em SummaryCards/SpendingChart/TransactionsTable/InvoiceCards e em
    `getProjectedMonth`. `accountId` = `number | 'all' | 'manual'`. Filtro só aparece com mês selecionado.
  - **Override de recorrente por mês:** schema **v3** + tabela `recurringOverrides`
    `{recurringItemId, month, amountCents?, skip?}`. `getProjectedMonth` consulta o override (preserva o
    invariante "nunca materializar projeção"). `ProjectedView`: linha "fixo" editável (ajustar valor só
    daquele mês), "pular este mês" (vai pro rodapé "Ocultos este mês" com "restaurar"), e reset (✕).
    Helpers em `lib/recurringOverrides.ts`.
- **Decisão M6:** Split e Budgets foram **tirados do escopo** após discussão. Budget revelou que a tabela
  `categories` está morta (categorias são só strings em `entry.category`); e o que o João quer é maior —
  um sistema de **categorias-mestre** (Custos fixos/Conforto/Metas/Prazeres/Liberdade financeira/
  Conhecimento) que reclassifica todo gasto, com charts na aba "Todos". Isso + Split viram **M7+**.
  Ver `PLAN.md §10`. Débito quitado de M6: `matchesFilters` começou a centralizar os totais (hoje ainda
  há `reduce(+amountCents)` inline em alguns componentes) — base para quando o Split chegar.
- **Next: M7** — definir entre **categorias-mestre** (50/30/20, o desejo do João) ou **Split/empréstimos**
  (modelo de dados a decidir). Ver `PLAN.md §10`.

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
