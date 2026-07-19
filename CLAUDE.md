# FinLivre — project brief for Claude Code

FinLivre ("enfim livre" — finally free) is João's Phase 2 portfolio project: a **local-first
personal finance app** that turns bank/credit-card exports into a clear financial picture.
It is the "real React/Next.js project" milestone in his career plan.
Treat it as a learning project AND a portfolio piece.

## Read these first
- `PLAN.md` — vision, architecture, data model, milestones. The source of truth.
- `FIRST_SESSION.md` — what to tackle in the next session (updated after every milestone).
- `docs/nextjs-notes.md` — Next.js mental model with Angular bridges (João is learning Next.js).

## Current state (as of 2026-07-19)
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
- **M6 ✅** Polimento e filtros (Split e Budgets **adiados**). 67 testes.
  - **Cores de categoria estáveis:** `categoryColor.ts` (`colorForCategory`, hash djb2).
  - **Filtro de conta global:** `AccountFilterContext` + `AccountFilter.tsx` (pills).
    Predicado central **`matchesFilters(entry, {month, accountId})`** em `lib/filters.ts`.
  - **Override de recorrente por mês:** schema v3 + tabela `recurringOverrides`.
  - **Pós-M6:** `formatDate` sem `new Date` (evita bug UTC), batch categorization (multi-select +
    action bar flutuante + `MerchantRule` retroativo), título dinâmico na `TransactionsTable`.
- **M7 ✅** Navegação App Router (Dashboard | Lançamentos). Comprometido em `3c9d22b`.
  - **`src/components/AppShell.tsx`** — shell persistente (header + Navigation + MonthSelector +
    AccountFilter + `{children}`). Vive no `layout.tsx` raiz; sobrevive à troca de rota.
  - **`src/components/Navigation.tsx`** — 2 abas com `usePathname` para estado ativo + `Link`
    (client-side navigation sem reload).
  - **`src/app/dashboard/page.tsx`** — 3 estados: Geral (só charts), mês passado/atual
    (SummaryCards + InvoiceCards + SpendingChart + TransactionsTable 1/3+2/3 + ProjectedView se atual
    + IncomeExpenseChart), mês futuro (SummaryCards + placeholder dashed + link para Lançamentos).
  - **`src/app/lancamentos/page.tsx`** — sempre mostra SummaryCards + botões de importação +
    ExportButton. Mês futuro → `ProjectedView` em card "Compromissos previstos". Mês real →
    `TransactionsTable`. Raiz: `src/app/page.tsx` redireciona para `/dashboard` via `redirect()`.
  - **Arquitetura decidida:** Dashboard = analytics/retrospectiva. Lançamentos = todos os
    lançamentos (reais ou projetados). Aba Planejamento **removida** — retorna em M8 com conteúdo
    real (categorias-mestre, metas, reservas).
  - **SettingsMenu** (engrenagem): `AccountsManager` + `RecurringItemsManager` + `ClearDataButton`.
    `MonthSelector` e `AccountFilter` ficam no `AppShell` (globais; sobrevivem à navegação).
  - **SpendingChart:** top 6 categorias + bucket "Outros" (cor `#a1a1aa`). Paleta expandida 8→12
    cores (`CATEGORY_COLORS` em `lib/categoryColor.ts`, `OUTROS_COLOR` adicionado).
  - **"Todos" → "Geral"** (pill no `MonthSelector`).
- **M8 ✅** — Categorias-mestre (baldes 50/30/20). Concluído 2026-06-30.
  - **Modelo (decidido):** Dexie v4, duas tabelas — `buckets` `{name, type:'gasto'|'meta', targetPercent, color, order}`
    + `categoryBuckets {category(PK), bucketId}` (espelha `merchantRules`). Base = renda do mês; metas não
    somam 100% (aviso suave); default 50/30/20; "Sobra do mês" derivada. Visual herói: balde de líquido animado.
    Roll-up puro em `lib/buckets.ts` (reusa `matchesFilters`). 3ª rota `/planejamento`.
  - Roteiro completo de implementação em `FIRST_SESSION.md`; design fixado em `PLAN.md §9 Milestone 8`.
- **M9 ✅** — Tela de revisão unificada para imports. Comprometido `e3e7084` em 2026-07-12.
  OFX passou a usar a mesma `ImportReviewTable` que o Vision já usava, com coluna de mês editável.
- **M10 ✅** — Theming & i18n. 2026-07-19. Ver `PLAN.md §9 Milestone 10` para detalhes.
  - Toggle claro/escuro/sistema (`next-themes`), ~14 tokens semânticos substituindo os `dark:`
    espalhados, charts tema-aware (`useChartTheme.ts`), logo (`Logo.tsx` + `icon.svg`).
  - Idioma EN/PT (`src/i18n/`), `LanguageSwitcher` no header. 112 testes no total.

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
· Recharts 3 · next-themes · deploy on Vercel. Node 20.

## Gotchas that will bite you
- Dexie/IndexedDB is **browser-only**. Any module that touches the DB must run in a
  **Client Component** (`'use client'`). See docs/nextjs-notes.md.
- Tailwind v4 resets `<dialog>` default centering. All modals need:
  `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2` on the dialog element.
- Future month = `selectedMonth > currentMonth()`. Past/current months have real DB entries;
  future months combine `getProjectedMonth()` + real entries (manual launches).

@AGENTS.md
