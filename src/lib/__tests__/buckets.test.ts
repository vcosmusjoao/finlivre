import 'fake-indexeddb/auto';
import { db } from '../db';
import { BUCKET_PRESETS } from '../bucketPresets';
import {
  applyPreset,
  bucketForCategory,
  rollupBuckets,
  bucketProgress,
  bucketInsights,
  monthIncomeCents,
  type BucketRollup,
} from '../buckets';

// ── helpers ───────────────────────────────────────────────────────────────────

let hashCounter = 0;

function addEntry(
  category: string,
  amountCents: number,
  month: string,
  direction: 'expense' | 'income' = 'expense',
) {
  return db.entries.add({
    date: `${month}-15`,
    billingMonth: month,
    description: 'Test',
    amountCents,
    direction,
    category,
    source: 'manual',
    importedAt: new Date().toISOString(),
    hash: `test-${hashCounter++}`,
  });
}

function makeBucketRollup(
  name: string,
  type: 'gasto' | 'meta',
  targetPercent: number,
  spentCents: number,
): BucketRollup {
  return {
    bucket: { id: 1, name, type, targetPercent, color: '#000', order: 0 },
    spentCents,
    categories: [],
  };
}

beforeEach(async () => {
  await db.entries.clear();
  await db.buckets.clear();
  await db.categoryBuckets.clear();
});

// ── BUCKET_PRESETS ────────────────────────────────────────────────────────────

describe('BUCKET_PRESETS', () => {
  it('cada preset tem nome e ao menos 1 balde', () => {
    for (const preset of BUCKET_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.buckets.length).toBeGreaterThan(0);
    }
  });

  it('cada balde tem targetPercent entre 0 e 100', () => {
    for (const preset of BUCKET_PRESETS) {
      for (const b of preset.buckets) {
        expect(b.targetPercent).toBeGreaterThanOrEqual(0);
        expect(b.targetPercent).toBeLessThanOrEqual(100);
      }
    }
  });

  it('cada balde tem type válido', () => {
    for (const preset of BUCKET_PRESETS) {
      for (const b of preset.buckets) {
        expect(['gasto', 'meta']).toContain(b.type);
      }
    }
  });

  it('preset 50/30/20 tem exatamente 2 baldes de gasto', () => {
    const preset = BUCKET_PRESETS.find(p => p.name === '50/30/20')!;
    expect(preset.buckets).toHaveLength(2);
    expect(preset.buckets.every(b => b.type === 'gasto')).toBe(true);
  });

  it('preset Método dos Potes tem 6 baldes', () => {
    const preset = BUCKET_PRESETS.find(p => p.name === 'Método dos Potes')!;
    expect(preset.buckets).toHaveLength(6);
  });
});

// ── applyPreset ───────────────────────────────────────────────────────────────

describe('applyPreset', () => {
  it('grava os baldes do preset no DB', async () => {
    await applyPreset(BUCKET_PRESETS[0]);
    const buckets = await db.buckets.orderBy('order').toArray();
    expect(buckets).toHaveLength(2);
    expect(buckets[0].name).toBe('Necessidades');
    expect(buckets[1].name).toBe('Desejos');
  });

  it('trocar preset substitui os baldes anteriores', async () => {
    await applyPreset(BUCKET_PRESETS[0]);
    await applyPreset(BUCKET_PRESETS[1]);
    const buckets = await db.buckets.orderBy('order').toArray();
    expect(buckets).toHaveLength(6);
    expect(buckets[0].name).toBe('Custos fixos');
  });

  it('trocar preset também limpa as atribuições de categoria', async () => {
    await applyPreset(BUCKET_PRESETS[0]);
    const [first] = await db.buckets.orderBy('order').toArray();
    await db.categoryBuckets.put({ category: 'Alimentação', bucketId: first.id! });
    expect(await db.categoryBuckets.count()).toBe(1);

    await applyPreset(BUCKET_PRESETS[1]);
    expect(await db.categoryBuckets.count()).toBe(0);
  });
});

// ── bucketForCategory ─────────────────────────────────────────────────────────

describe('bucketForCategory', () => {
  it('retorna bucketId quando a categoria está atribuída', () => {
    const assignments = [{ category: 'Alimentação', bucketId: 1 }];
    expect(bucketForCategory('Alimentação', assignments)).toBe(1);
  });

  it('retorna undefined para categoria sem atribuição', () => {
    expect(bucketForCategory('Viagem', [])).toBeUndefined();
  });

  it('não confunde categorias parecidas', () => {
    const assignments = [
      { category: 'Alimentação', bucketId: 1 },
      { category: 'Alimentação fora', bucketId: 2 },
    ];
    expect(bucketForCategory('Alimentação', assignments)).toBe(1);
    expect(bucketForCategory('Alimentação fora', assignments)).toBe(2);
  });
});

// ── rollupBuckets ─────────────────────────────────────────────────────────────

describe('rollupBuckets', () => {
  let necessidadesId: number;
  let desejosId: number;

  beforeEach(async () => {
    await applyPreset(BUCKET_PRESETS[0]); // Necessidades + Desejos
    const buckets = await db.buckets.orderBy('order').toArray();
    necessidadesId = buckets[0].id!;
    desejosId = buckets[1].id!;
    await db.categoryBuckets.bulkPut([
      { category: 'Alimentação', bucketId: necessidadesId },
      { category: 'Lazer', bucketId: desejosId },
    ]);
  });

  it('agrupa despesas no balde correto', async () => {
    await addEntry('Alimentação', 20000, '2026-05');
    await addEntry('Lazer', 5000, '2026-05');

    const { buckets } = await rollupBuckets({ month: '2026-05' });
    expect(buckets.find(b => b.bucket.id === necessidadesId)!.spentCents).toBe(20000);
    expect(buckets.find(b => b.bucket.id === desejosId)!.spentCents).toBe(5000);
  });

  it('balde sem gastos no mês aparece com spentCents = 0', async () => {
    await addEntry('Alimentação', 10000, '2026-05');

    const { buckets } = await rollupBuckets({ month: '2026-05' });
    expect(buckets.find(b => b.bucket.id === desejosId)!.spentCents).toBe(0);
  });

  it('despesas sem balde vão para unassigned', async () => {
    await addEntry('Saúde', 8000, '2026-05');

    const { unassigned } = await rollupBuckets({ month: '2026-05' });
    expect(unassigned.spentCents).toBe(8000);
    expect(unassigned.categories[0]).toEqual({ category: 'Saúde', cents: 8000 });
  });

  it('ignora lançamentos de income', async () => {
    await addEntry('Salário', 500000, '2026-05', 'income');
    await addEntry('Alimentação', 10000, '2026-05');

    const { buckets, unassigned } = await rollupBuckets({ month: '2026-05' });
    const totalSpent = buckets.reduce((s, b) => s + b.spentCents, 0) + unassigned.spentCents;
    expect(totalSpent).toBe(10000);
  });

  it('respeita filtro de mês', async () => {
    await addEntry('Alimentação', 10000, '2026-05');
    await addEntry('Alimentação', 20000, '2026-04');

    const { buckets } = await rollupBuckets({ month: '2026-05' });
    expect(buckets.find(b => b.bucket.id === necessidadesId)!.spentCents).toBe(10000);
  });

  it('acumula múltiplas entradas da mesma categoria no balde', async () => {
    await addEntry('Alimentação', 15000, '2026-05');
    await addEntry('Alimentação', 5000, '2026-05');

    const { buckets } = await rollupBuckets({ month: '2026-05' });
    const necessidades = buckets.find(b => b.bucket.id === necessidadesId)!;
    expect(necessidades.spentCents).toBe(20000);
    expect(necessidades.categories).toEqual([{ category: 'Alimentação', cents: 20000 }]);
  });

  it('todos os baldes aparecem no resultado mesmo sem gastos', async () => {
    const { buckets } = await rollupBuckets({ month: '2026-05' });
    expect(buckets).toHaveLength(2);
  });
});

// ── bucketProgress ────────────────────────────────────────────────────────────

describe('bucketProgress', () => {
  const income = 500000; // R$ 5.000

  describe('type: gasto', () => {
    it('under: gasto abaixo de 80% do target', () => {
      // target = 50% de 500000 = 250000; gastar 190000 = 76%
      expect(bucketProgress(190000, 50, income, 'gasto').status).toBe('under');
    });

    it('near: gasto entre 80% e 100% do target', () => {
      // 85% de 250000 = 212500
      expect(bucketProgress(212500, 50, income, 'gasto').status).toBe('near');
    });

    it('near: exatamente no target (100%)', () => {
      expect(bucketProgress(250000, 50, income, 'gasto').status).toBe('near');
    });

    it('over: gasto acima do target', () => {
      expect(bucketProgress(250001, 50, income, 'gasto').status).toBe('over');
    });

    it('retorna targetCents correto', () => {
      expect(bucketProgress(0, 30, income, 'gasto').targetCents).toBe(150000);
    });

    it('ratio correto quando no target', () => {
      const { ratio } = bucketProgress(250000, 50, income, 'gasto');
      expect(ratio).toBeCloseTo(1.0);
    });
  });

  describe('type: meta', () => {
    it('progress: abaixo do target', () => {
      expect(bucketProgress(40000, 10, income, 'meta').status).toBe('progress');
    });

    it('reached: exatamente no target', () => {
      expect(bucketProgress(50000, 10, income, 'meta').status).toBe('reached');
    });

    it('reached: acima do target', () => {
      expect(bucketProgress(60000, 10, income, 'meta').status).toBe('reached');
    });
  });

  it('ratio = 0 quando targetCents = 0', () => {
    expect(bucketProgress(0, 0, income, 'gasto').ratio).toBe(0);
  });
});

// ── bucketInsights ────────────────────────────────────────────────────────────

describe('bucketInsights', () => {
  const income = 500000; // R$ 5.000

  it('gera aviso (warning) quando balde de gasto estoura', () => {
    // target = 50% de 500000 = 250000; gastar 300000 → over
    const rollup = makeBucketRollup('Necessidades', 'gasto', 50, 300000);
    const insights = bucketInsights([rollup], income);
    expect(insights).toHaveLength(1);
    expect(insights[0].severity).toBe('warning');
    expect(insights[0].bucketName).toBe('Necessidades');
  });

  it('gera sucesso (success) quando meta é atingida', () => {
    // target = 10% de 500000 = 50000; gastar/poupar 50000 → reached
    const rollup = makeBucketRollup('Metas', 'meta', 10, 50000);
    const insights = bucketInsights([rollup], income);
    expect(insights).toHaveLength(1);
    expect(insights[0].severity).toBe('success');
  });

  it('sem insights quando gasto de gasto está sob controle', () => {
    const rollup = makeBucketRollup('Desejos', 'gasto', 30, 50000); // 50000 < 150000
    expect(bucketInsights([rollup], income)).toHaveLength(0);
  });

  it('sem insights quando meta não foi atingida', () => {
    const rollup = makeBucketRollup('Metas', 'meta', 10, 10000); // 10000 < 50000
    expect(bucketInsights([rollup], income)).toHaveLength(0);
  });

  it('processa múltiplos baldes e retorna insight por cada problema', () => {
    const rollups = [
      makeBucketRollup('Necessidades', 'gasto', 50, 300000), // over → warning
      makeBucketRollup('Desejos', 'gasto', 30, 50000),       // under → sem insight
      makeBucketRollup('Metas', 'meta', 10, 60000),           // reached → success
    ];
    const insights = bucketInsights(rollups, income);
    expect(insights).toHaveLength(2);
    expect(insights.map(i => i.severity)).toEqual(['warning', 'success']);
  });
});

// ── monthIncomeCents ──────────────────────────────────────────────────────────

describe('monthIncomeCents', () => {
  it('soma a renda real do mês a partir dos lançamentos', async () => {
    await addEntry('Salário', 530000, '2026-01', 'income');
    await addEntry('Freelance', 50000, '2026-01', 'income');
    await addEntry('Salário', 530000, '2026-02', 'income'); // outro mês — não conta

    expect(await monthIncomeCents({ month: '2026-01' })).toBe(580000);
  });

  it('retorna 0 quando não há renda no mês', async () => {
    expect(await monthIncomeCents({ month: '2026-01' })).toBe(0);
  });

  it('não soma despesas, só income', async () => {
    await addEntry('Alimentação', 20000, '2026-01', 'expense');
    await addEntry('Salário', 530000, '2026-01', 'income');

    expect(await monthIncomeCents({ month: '2026-01' })).toBe(530000);
  });
});
