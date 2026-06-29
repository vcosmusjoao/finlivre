# FinLivre — Plan

> Name: **FinLivre** — a play on *enfim livre* ("finally free"), with *fin* = finanças.
> Tagline: **"enfim livre."** Rename freely — change the folder name and the `name` field in `package.json`.

## 1. What it is
A local-first personal finance app. You import a bank/credit-card statement (starting with
**OFX**), it categorizes every line, and a dashboard shows your real financial picture:
spending by category over time, income vs expense, upcoming installment commitments, net cashflow.
The promise in the name: organize your finances and get, *enfim, livre*.

It is **not** a "PDF-to-JSON" tool. The import is one feature. The product is the **ledger + dashboard**.

## 2. Who / why
For João first (he uses credit cards heavily and wants to track finances). Dogfooding is the
point — being the user is what makes this project actually get finished. Secondarily it's a
portfolio piece for international recruiters: it shows AI-era product judgment, full-stack
Next.js, data viz, and a real privacy story.

## 3. Non-goals (anti-scope-creep — re-read this when tempted)
- We will **not** out-feature Mobills/Organizze/YNAB. Win on *depth in a narrow lane*, not breadth.
- v1 has **no backend, no auth, no multi-device sync, no AI**. All parked for v2.
- We do **not** support every bank/format at once. OFX first. PDF last, one bank at a time.
- New idea mid-build? → it goes in §10 "Parked", not into Milestone 1.

## 4. Architecture — one ledger, many sources
```
  SOURCES                    ONE MODEL                      DASHBOARD
  Credit cards (OFX) ─┐                                ┌─►  Spending by category (over time)
  Salary & income ────┼─► normalize ─► [ Entry ] ──────┼─►  Income vs expense
  Recurring bills ────┤                ledger          ├─►  Upcoming commitments (parcelas)
  Financing (house) ──┘            (Accounts,          └─►  Net cashflow
                                    Categories)
                              stored locally · IndexedDB
```
Every source is just an **importer**: `(fileText) => ParsedEntry[]`. The rest of the app never
knows or cares where data came from. (Angular bridge: same idea as several classes implementing
one interface, like a `multi: true` provider token.)

## 5. Data model
See `src/lib/db.ts` for the live source. Shape:
- **Entry** — the atom. `{ date, description, amountCents (always positive), direction
  (income|expense), category, accountId?, installment?, source, hash }`. `hash` = dedupe key.
- **Account** — "Nubank", "Salary account". `{ name, type, color? }`.
- **Category** — user-owned taxonomy. `{ name, color?, monthlyBudget? }`. Editable; the seed
  dictionary only *suggests*.
- **MerchantRule** — learned mapping `normalizedMerchant -> category`. This is what makes
  categorization get more automatic the more you use the app.

Why integer cents: floating-point money creates rounding bugs. Store `2490`, not `24.90`.

## 6. Tech stack & why
| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | João is learning it; deployable; recruiter-visible |
| Lang | TypeScript | His strength, transfers 1:1 from Angular |
| Styling | Tailwind v4 | Already known; fast |
| Local DB | Dexie (IndexedDB) | Local-first privacy; persists across reloads; reactive via `useLiveQuery` |
| Charts | Recharts 3 | Declarative/composable (like Angular template inputs); widely used |
| Deploy | Vercel | Already used for portfolio |

## 7. Categorization (no AI)
Three layers, cheapest first (see `src/lib/categorize.ts`):
1. **User-learned rule** wins (MerchantRule store).
2. **Seed dictionary** keyword match (specific before generic: `UBER EATS` before `UBER`).
3. Fallback `Uncategorized` → user picks once → we save it as a learned rule.
Result: month 1 you categorize ~20 unknowns; by month 3 it's nearly automatic. That compounding
quietness is the retention hook.

## 8. Privacy model (state this honestly in the README)
Transaction data is stored only in the user's browser (IndexedDB) — never on a server. v1 does
no network calls for parsing at all (deterministic, in-browser). Add an "Export to JSON/CSV"
backup button, because clearing browser data wipes IndexedDB.

## 9. Milestones

- **Layer 0 — model.** ✅ `Entry`/`Account`/`Category`/`MerchantRule` in Dexie.

- **Milestone 1 — ship.** ✅ OFX import → categorize → dedupe → store → table +
  spending-by-category chart + "Load sample" button. Deployed to Vercel.

- **Milestone 2 — becomes a finance app.** ✅ Manual entries + income + `direction: 'transfer'`
  for credit card payments. Month filter tabs. `billingMonth` separates purchase date from
  budget month. Income vs expense bar chart.

- **Milestone 3 — the differentiator.** ✅ Committed `e3eef79` on 2026-06-28.
  - ✅ **Account management:** color-coded cards (Nubank purple, Inter orange, custom presets),
    CRUD modal, account picker on OFX import, color dot per transaction row.
  - ✅ **Recurring items:** `RecurringItemsManager` for fixed income/expenses (salary, rent,
    subscriptions). Pre-fills future month projections. `activeFrom` defaults to next month.
  - ✅ **Installment forecast:** `getProjectedMonth()` computes future months on-the-fly from
    `RecurringItems` + `installment` math — never materialized in DB. `ProjectedView` shows
    `fixo` and `X/Y` badges.
  - ✅ **Future month tabs:** dashed border, distinct from real-data tabs. `DashboardBody`
    branches — future months show projection + manual entries side by side.
  - ✅ **Inline category editing:** click any chip → inline input + datalist autocomplete →
    saves `MerchantRule` for future auto-categorization ("merchant dictionary").
  - ✅ **Data hygiene:** delete per row, clear-all with confirmation, resets month selection.
  - ✅ **Month selector fix:** past months (≤ today) and future months are distinct sets.
  - ⏳ **Invoice summary card:** `LEDGERBAL` is already extracted and stored in
    `InvoiceStatement` table, but no UI shows it yet. Show "Fatura Junho: R$ 1.658,76 em
    compras · R$ 100 já pagos" per account. Move to M4 opening task.

- **Milestone 5 — import por imagem/PDF (Claude Vision, BYO-key).** ✅
  - Um único importer (`src/lib/importers/vision.ts`) cobre **foto/print E PDF** — resolve bancos
    que só dão PDF e o caso Inter (fatura aberta só na tela do app, sem PDF).
  - Chamada **direta do browser** (`dangerouslyAllowBrowser`) com a **chave do próprio usuário**
    (`src/lib/settings.ts`, localStorage). Sem backend; armazenamento continua 100% local.
  - Modelo `claude-sonnet-4-6` + **structured output** (Zod) → `ParsedEntry[]`.
  - **Tabela de revisão editável** (`VisionImportButton.tsx`) antes de gravar — IA pode errar,
    usuário confere/edita/remove. Categorias confirmadas alimentam o `MerchantRule` (beneficia o OFX).
  - Reusa `commitParsedEntries` (extraído de `import-pipeline.ts`): dedupe por hash de conteúdo
    funciona **entre fontes** (mesma compra via OFX e foto não duplica).

- **Milestone 4 — depth and polish.**
  - Invoice summary card (carry-over from M3).
  - Unit tests: Jest setup + tests for `format.ts`, OFX parser, `getProjectedMonth` logic.
  - Export to JSON/CSV (privacy/backup — referenced in §8).
  - "Todos" multi-dashboard: donut by category, bar by account, multi-month income vs expense.
  - Budget categories (Custos fixos / Conforto / Prazeres / Metas — 50/30/20 style).
  - Multiple OFX files for different cards in a single unified view.
  - PDF importer (Inter bank, one bank at a time).
  - Assets/net worth panel (the house, investments).

## 10. Parked ideas (v2+ — do not build during M1)
- AI fallback for low-confidence lines / unknown merchants (optional toggle).
- MCP server so Claude Desktop can categorize a statement and save a report.
- Supabase + auth + multi-device sync.
- PDF importers per bank. CSV importers per bank.
- **Open Finance integration (v2 flagship):** connect all Brazilian banks in one click via
  Pluggy or Belvo (aggregators that use Banco Central's Open Finance). Requires: backend
  (OAuth tokens can't live in the browser), Supabase for auth + token storage, paid API plan.
  This is the natural evolution after the local-first MVP proves the product concept.
  Story: "built local-first for privacy and learning; added Open Finance when the use-case
  justified a backend." Strong architecture narrative for international interviews.
- Local LLM (Ollama) for true offline parsing.
- **"Todos" multi-dashboard view:** when no month is selected, replace the single dashboard
  with multiple panels: spending by category (donut), spending by account (bar), income vs
  expense over time (multi-month bar), and a full transaction table. Turns the "all months"
  view into a real financial overview instead of just a merged table.
- Budget-based category system (Custos fixos / Conforto / Prazeres / Metas style, à la 50/30/20).
  Merchant categories (Food, Transport) would become subcategories under budget categories.
  Higher planning power but more user setup upfront — revisit in M2.
- Account identification on import: ask "qual banco é esse?" when importing an OFX, tag entries
  with accountId. Enables multi-card unified view and color-coding by account. Account model
  already exists in DB (src/lib/db.ts). Natural M2 feature.
- Due date tracking per card: user informs the card's closing/due date on import. Enables
  "this month's bill" grouping and the installment forecast of M3.
- Transaction color-coding by account in the table: when multiple accounts exist, each row
  gets a color accent matching the account. Small UI lift, big clarity gain.
- ~~**PDF import via AI (M5):**~~ ✅ **DONE in M5.** Shipped as a single Claude Vision importer
  that accepts **image OR PDF** (no pdf.js needed — Claude reads PDFs natively), BYO-key in
  localStorage, browser-direct (no backend), structured output → editable review table → DB.
  See PLAN.md §9 Milestone 5.
- **Empréstimos e divisões (M5):** track money lent to people and shared expenses.
  Two sub-features: (1) Split — mark that part of a credit card purchase belongs to someone
  else (e.g., 50% Gabi), which halves your effective amountCents in all totals. Requires
  a `splits` table `{ entryId, personName, amountCents, dueDate? }` and a recalculation
  pass in SummaryCards/SpendingChart. (2) Cobranças — list of pending amounts owed to you,
  with optional `phone` field. "Lembrar" button generates a `wa.me/{phone}?text=...` deep
  link that opens WhatsApp with a pre-filled message — fully local-first, no backend.
  Architectural note: split logic touches every total in the app; design the data model
  carefully before implementing.

## 11. UI prototype (optional, before coding the dashboard)
Decide the *look* fast with a static mockup, then build it by hand to learn. Paste this into a
fresh Claude chat (artifact) or v0:

> "Create a single static HTML+Tailwind mockup (no logic) of a personal finance dashboard called
> FinLivre. Local-first, clean, light/dark. Top: 4 summary cards (Total spent, Income, Net, Upcoming
> installments). Middle-left: a 'spending by category' donut chart with a legend. Middle-right: a
> monthly bar chart (income vs expense). Bottom: a transactions table with columns Date,
> Description, Category (colored chip), Installment (e.g. 3/12), Amount. Include an 'Import OFX'
> button and a 'Load sample statement' link in the header. Brazilian Real (R$) formatting. Make it
> look like a real product, minimal and modern."

## 12. Decisions log
- Name: **FinLivre** (tagline "enfim livre") over Saldo — names the *outcome* (financial freedom),
  stays spellable/searchable for international recruiters, keeps the PT pun as the tagline.
- Local-first web app over desktop/MCP: a desktop app is invisible to recruiters; parsing data
  goes to no one in v1 anyway. Web keeps the recruiter-visible URL.
- Deterministic parsing over AI: more reliable, free, private, abuse-proof demo, and a *stronger*
  engineering story ("I knew when not to use AI"). AI parked as optional v2.
- OFX-first over PDF-first: one OFX parser covers all four banks; PDF layouts are per-bank and fragile.
