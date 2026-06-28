# Start here — next session

Open this folder (`C:\dev\finlivre`) in Claude Code and work top to bottom. Goal of the session:
**ship Milestone 1.** Don't add anything outside it (see PLAN.md §3 and §10).

## 0. Orient (5 min)
- Read `PLAN.md` (§4 architecture, §5 data model, §9 milestones).
- Skim `docs/nextjs-notes.md` (Server vs Client Components, `useLiveQuery`, Recharts).

## 1. Confirm the app runs
```
npm run dev
```
Open http://localhost:3000 — you should see the default Next page. (Tailwind v4 + Turbopack are on.)

## 2. The Milestone 1 build order
The foundation already exists: `src/lib/db.ts` (Dexie schema), `src/lib/categorize.ts`
(merchant dictionary), `src/lib/importers/ofx.ts` (stub with a guided TODO).

1. **Implement the OFX importer** — `src/lib/importers/ofx.ts`. The TODO walks you through the
   `<STMTTRN>` format. Test it against a **real Nubank `.ofx`** (export one from the Nubank app).
   This is your main learning exercise — try it before asking for the solution.
2. **Build the import pipeline** — a function that does: `parse → categorize → hash/dedupe →
   db.entries.bulkAdd`. Put it in `src/lib/import-pipeline.ts`.
3. **Upload component** (`'use client'`) — a file input that reads the file as text and runs the
   pipeline. Browser-only, so it must be a Client Component.
4. **Transactions table** — read with `useLiveQuery(() => db.entries.orderBy('date').reverse().toArray())`
   so it auto-updates when data changes (this is your RxJS-like reactive binding).
5. **Spending-by-category chart** — Recharts `PieChart`/`BarChart`, fed by a grouping of entries.
6. **Compose the dashboard** in `src/app/page.tsx` (replace the default content).
7. **"Load sample statement" button** — bundle `public/sample.ofx` (anonymized) so recruiters
   (and you) can see it work with one click, no real data, no cost.

## 3. Definition of done for Milestone 1
Upload a real OFX **or** click "Load sample" → see a categorized transactions table + a
spending-by-category chart → reload the page and the data is still there (IndexedDB).

## 4. Then deploy
```
git add -A && git commit -m "Milestone 1: OFX import + dashboard"
```
Push to GitHub, import the repo in Vercel, deploy. Add the live URL to the README.

## Reminders
- Money is integer **cents** everywhere.
- Anything touching Dexie = Client Component (`'use client'`).
- New idea? → PLAN.md §10 "Parked". Finish M1 first.
