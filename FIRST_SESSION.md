# Start here

M1 → M10 estão completos e estabilizados.

## Estado atual (2026-07-19)

### M9 ✅ completo — tela de revisão unificada para imports
Comprometido `e3e7084` em 2026-07-12. OFX passou a usar a mesma `ImportReviewTable` que o
Vision já usava, com coluna de mês (`billingMonth`) editável antes de confirmar.

### M10 ✅ completo — Theming & i18n
- Tema claro/escuro/sistema (`next-themes`), ~14 tokens semânticos em `globals.css`
  substituindo os `dark:` espalhados, charts tema-aware (`useChartTheme.ts`), logo
  (`Logo.tsx` + `icon.svg`/`opengraph-image.png`).
- Idioma EN/PT (`src/i18n/`), `LanguageSwitcher` no header.
- Ver `PLAN.md §9 Milestone 10` para detalhes completos e decisões.

### Testes: 112 passando

---

## O que vem agora

Nenhuma milestone nova está especificada ainda. Candidatos em `PLAN.md §10` (parked ideas):
Split/Cobranças (empréstimos e divisões), "Todos" multi-dashboard, PDF importers per bank,
Open Finance integration (v2 flagship). Escolher a próxima com o João antes de começar —
não iniciar uma feature nova sem antes atualizar este arquivo com a spec.

---

## Decisões já travadas (não reabrir)

- Local-first. Sem backend em v1. Sem sync multi-device.
- Categorias-mestre via `buckets` + `categoryBuckets` (Dexie v4). Schema v4 estável.
- `matchesFilters` é o único predicado de filtro. `effectiveMonth` é o único predicado de mês.
- `currentMonth()` usa hora **local** (não UTC). Nunca voltar para `toISOString()`.
- Planejamento ignora filtro de conta (visão global por design).
- Money em `amountCents` (integer), nunca float.
- `'use client'` em qualquer componente que toca Dexie.
- Tema via `next-themes` + classe `.dark` no `<html>` (não `prefers-color-scheme` puro).
  Cores de UI passam pelos tokens semânticos de `globals.css`; cores de dado
  (`categoryColor.ts`, `bucketPresets.ts`, `accounts.ts`) ficam de fora — são brand/data colors.
- i18n via `src/i18n/LocaleContext.tsx`; `pt.ts` é tipado contra a interface `Messages` do `en.ts`.

## Lembretes técnicos

- `useLiveQuery` com default tipado: `[] as Bucket[]`, nunca `[]` cru.
- `<dialog>` precisa de `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`.
- SMIL `<animateTransform>` em vez de CSS transform para animação SVG.
- SVG clipPath/animações: uid único por instância (`uid = String(bucket.id ?? bucket.name)`).
- `npm test` antes de qualquer commit. 112 testes devem passar.
