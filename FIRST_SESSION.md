# Start here — next session (M5 planning)

Open this folder (`C:\dev\finlivre`) in Claude Code.
M1, M2, M3, M4 complete. Start session by reading PLAN.md §10 (parked ideas) and discussing M5 scope.

## 0. Orient (2 min)
- Read `PLAN.md §9` (milestone status) and `§10` (parked ideas).
- Check `CLAUDE.md` for current state and gotchas.

## 1. M4 task list (work top to bottom)

### 1a. Invoice summary card ✅ DONE
- `src/components/InvoiceCards.tsx` — shows LEDGERBAL per account per month.
- Inserted between SummaryCards and DashboardBody in `page.tsx`.
- Shows "R$ X,XX a pagar". No "já pagos" calc (LEDGERBAL is already net).

### 1b. Unit tests ✅ DONE
- Jest already configured. `fake-indexeddb` already installed.
- **40 tests passing** across 5 suites.
- New test files: `format.test.ts`, `accounts.test.ts`, `projection.test.ts`
- `stripInstallmentText` exported from `projection.ts` (was private).

### 1c. Export to JSON/CSV ✅ DONE
- `src/components/ExportButton.tsx` — dropdown with JSON (full backup) and CSV (spreadsheet).
- JSON: all tables (entries, accounts, recurringItems, merchantRules, invoiceStatements).
- CSV: entries only, account name resolved, UTF-8 BOM for Excel.
- Button placed in header between "Limpar dados" and "Contas".

### Bugs fixed this session
- SpendingChart: replaced hardcoded `width={400}` with `ResponsiveContainer` + custom JSX legend.
- InvoiceCards: removed incorrect "já pagos" logic (LEDGERBAL is net, not gross).
- Recurring items: current month now gets projection in SummaryCards (`hasProjection = selectedMonth >= now`).
- DashboardBody: current month now shows "Previstos para este mês" card with `ProjectedView hideWhenEmpty`.
- RecurringItemsManager: `cancelEdit()` was resetting `activeFrom` to current month instead of next month.

### 1d. "Todos" multi-dashboard ✅ DONE
When `selectedMonth === ''`, DashboardBody renders `<AllTimeDashboard />`:
- Donut: gastos por categoria (`SpendingChart` — já filtrava corretamente por selectedMonth)
- Bar horizontal: gastos por conta (`SpendingByAccountChart.tsx` — novo)
- IncomeExpenseChart: income vs expense all-time
- `TransactionsTable`: todas as transações
- `SummaryCards`: oculto no modo "Todos" (`if (!selectedMonth) return null`)

### 1e. Parcelamento no formulário manual ⏳ NEXT
Adicionar campo `installments` (number, default 1) no `ManualEntryForm`.
Quando > 1: criar N entradas espaçadas mês a mês, cada uma com `amountCents / N`,
descrição `"Compra (1/N)"`, `"Compra (2/N)"`, etc. Só aparece quando `direction === 'expense'`.
Reutiliza a estrutura `installment: { current, total }` já existente na Entry.

### 1f. (Stretch) Budget categories
50/30/20 style: Custos fixos / Conforto / Prazeres / Metas.
Requires thinking through UX before coding — discuss before implementing.

## 2. Reminders
- Money is always integer **cents** (`amountCents`).
- Dexie = Client Component (`'use client'`).
- All `<dialog>` modals need `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`.
- Future projections are on-the-fly (`getProjectedMonth`) — never write projected data to DB.
- New idea? → PLAN.md §10 "Parked". Ask: "does this block M4?" If not → park it.
- Tests: run `npm test` — must stay green before any commit.
- useLiveQuery with array default: always use `[] as MyType[]`, not bare `[]`.
