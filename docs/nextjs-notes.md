# Next.js notes (for an Angular dev)

Condensed reference for building FinLivre. Depth is taught live in chat; this is the cheat sheet.

## 1. App Router = folders are routes
`src/app/page.tsx` is `/`. A folder `src/app/settings/page.tsx` is `/settings`. `layout.tsx`
wraps everything below it (persistent shell — like a root component with `<router-outlet>`).
- **Angular bridge:** routing is file-system based instead of a `RouterModule` config array.

## 2. Server vs Client Components (the big new idea)
By default every component is a **Server Component**: it runs on the server, ships zero JS for
itself, and can't use state, effects, browser APIs, or event handlers.
Add `"use client"` at the top of a file to make it a **Client Component** — interactive, can use
`useState`/`useEffect`, runs in the browser.
- **Angular bridge:** Angular is 100% client-side, so a *Client Component ≈ a normal Angular
  component*. Server Components are the genuinely new thing — there is no Angular equivalent.
- **FinLivre rule:** Dexie/IndexedDB only exists in the browser, so **anything that touches the DB
  must be a Client Component.** The dashboard, upload, table and charts are all `"use client"`.
  For v1, think of FinLivre as a mostly-client app (like Angular) with a server-rendered shell.

## 3. Reactive data with Dexie — your RxJS bridge
`dexie-react-hooks` gives you `useLiveQuery`:
```tsx
"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function Transactions() {
  const entries = useLiveQuery(() => db.entries.orderBy("date").reverse().toArray());
  if (!entries) return <p>Loading…</p>;
  return <ul>{entries.map((e) => <li key={e.id}>{e.description}</li>)}</ul>;
}
```
The component **re-renders automatically whenever the DB changes** — no manual refresh.
- **Angular bridge:** this is your `Observable` + `async` pipe. `useLiveQuery` is the subscription;
  the auto re-render is the `async` pipe. Write to the DB anywhere and every live query updates.

## 4. Charts with Recharts — declarative composition
```tsx
"use client";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

<PieChart width={320} height={260}>
  <Pie data={byCategory} dataKey="total" nameKey="category" innerRadius={60} />
  <Tooltip />
</PieChart>;
```
You compose a chart from components and feed them data via props.
- **Angular bridge:** like building a template from child components and passing `@Input()`s.

## 5. Tailwind v4 note
This project uses Tailwind v4 — config is CSS-based (`@import "tailwindcss"` / `@theme` in
`globals.css`), there's no `tailwind.config.js` by default. Utility classes work as you know them.

## 6. Path alias
`@/` maps to `src/` (configured in `tsconfig.json`). Import as `@/lib/db`.
