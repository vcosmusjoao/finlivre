# Start here — sprint de visibilidade (pós M8) + spec M9

M1 → M8 estão completos e estabilizados.

## Estado atual (2026-06-30, fim do dia)

### M8 ✅ completo — bugs incluídos
- Baldes 50/30/20, SVG animado SMIL, aba Planejamento, BucketSettings, 36 novos testes.
- **Bugs corrigidos pós-entrega (mesma sessão):**
  1. `rollupBuckets` não somava recorrentes → corrigido para incluir `getProjectedMonth`
     no mês corrente/futuro (espelha `SummaryCards`).
  2. `BucketSettings` mostrava categorias de receita (Salário) → corrigido para filtrar
     só `direction:'expense'` de entries + recurringItems.
  3. **`currentMonth()` usava `toISOString()` (UTC)** → retornava mês seguinte após 21h
     no Brasil (UTC-3). Corrigido para usar hora local (`d.getFullYear()`, `d.getMonth()`).
     Esse bug único causava: julho sumindo do seletor, recorrentes aparecendo 2 meses
     atrasados, e renda do Planejamento calculada errada.
  4. "Sobra do mês" → "Poupança do mês" com "Meta X% → Real Y%".
  5. Mini-resumo Receita/Gastos/Saldo adicionado no topo do Planejamento.
  6. `AppShell` oculta `AccountFilter` na rota `/planejamento`.
  7. `planejamento/page.tsx` usa `accountId:'all'` (ignora filtro de conta por design).

### Testes: 103 passando

---

## O que vem agora (em ordem)

### 1. Sprint de visibilidade — NÃO é feature

**Não adicionar mais features antes disso.** O padrão do João é escopo crescente → projeto
inacabado. O README e o LinkedIn são o que transforma o trabalho técnico em portfólio visível.

**README (prioridade máxima):**
- Live URL (Vercel) no topo.
- Screenshots: Dashboard, Lançamentos (import OFX + Vision), Planejamento (baldes animados).
- Seção em inglês — público-alvo = recrutadores internacionais.
- Decisões técnicas para recrutadores:
  - Local-first (IndexedDB/Dexie v4, schema migrations v1→v4), zero backend.
  - OFX parser determinístico + Claude Vision BYO-key, browser-direct.
  - SVG animado via SMIL (`<animateTransform>`) — CSS transforms em SVG usam pixels CSS,
    não unidades SVG. SMIL opera no sistema de coordenadas SVG diretamente.
  - Arquitetura "tudo é Entry" — fontes (OFX/Vision/manual/recorrente) são apenas importers;
    o ledger é a única fonte de verdade.
  - `matchesFilters` e `effectiveMonth` como predicados únicos que todos reutilizam.

**LinkedIn:** post curto em inglês, link Vercel, stack, narrativa "built it to use it".

**GitHub:** repositório público, description + topics, pinned no perfil.

### 2. M9 — tela de revisão unificada para imports

**Spec completa em `PLAN.md §9 Milestone 9`.** Resumo executivo:

**Problema:** OFX é importado diretamente (sem revisão). Vision/PDF tem tela de revisão.
O usuário não consegue ver nem corrigir erros de `billingMonth` antes do commit no OFX.

**Solução:** extrair `ImportReviewTable` como componente compartilhado de `VisionImportButton.tsx`.
OFX passa a fazer: `parse → tela de revisão → confirmar → commitParsedEntries`.

**Coluna "Mês":** a tabela de revisão exibe `effectiveMonth(entry)` com `<select>` para
corrigir o `billingMonth` de cada entry (ou de todas de uma vez) antes de confirmar.

**Arquivos a tocar:**
- `components/VisionImportButton.tsx` — extrai tabela para componente separado
- `components/ImportReviewTable.tsx` — novo componente compartilhado
- `components/UploadButton.tsx` — plugar a tabela de revisão
- `lib/importers/ofx.ts` — verificar que `billingMonth` está sendo preenchido

**Não muda:** `commitParsedEntries` e dedupe por hash — são o núcleo estável.

---

## Decisões já travadas (não reabrir)

- Local-first. Sem backend em v1. Sem sync multi-device.
- Categorias-mestre via `buckets` + `categoryBuckets` (Dexie v4). Schema v4 estável.
- `matchesFilters` é o único predicado de filtro. `effectiveMonth` é o único predicado de mês.
- `currentMonth()` usa hora **local** (não UTC). Nunca voltar para `toISOString()`.
- Planejamento ignora filtro de conta (visão global por design).
- Money em `amountCents` (integer), nunca float.
- `'use client'` em qualquer componente que toca Dexie.

## Lembretes técnicos

- `useLiveQuery` com default tipado: `[] as Bucket[]`, nunca `[]` cru.
- `<dialog>` precisa de `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`.
- SMIL `<animateTransform>` em vez de CSS transform para animação SVG.
- SVG clipPath/animações: uid único por instância (`uid = String(bucket.id ?? bucket.name)`).
- `npm test` antes de qualquer commit. 103 testes devem passar.
