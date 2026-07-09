import type { Bucket } from './db';

export interface BucketPreset {
  name: string;
  buckets: Omit<Bucket, 'id'>[];
}

/**
 * Built-in presets for the bucket planning system.
 * "Sobra do mês" (the 20% in 50/30/20) is a derived indicator, not a bucket —
 * so the 50/30/20 preset only defines the two spending buckets.
 */
export const BUCKET_PRESETS: BucketPreset[] = [
  {
    name: '50/30/20',
    buckets: [
      { name: 'Necessidades', type: 'gasto', targetPercent: 50, color: '#3b82f6', order: 0 },
      { name: 'Desejos',      type: 'gasto', targetPercent: 30, color: '#a855f7', order: 1 },
    ],
  },
  {
    name: 'Método dos Potes',
    buckets: [
      { name: 'Custos fixos',         type: 'gasto', targetPercent: 55, color: '#3b82f6', order: 0 },
      { name: 'Conforto',             type: 'gasto', targetPercent: 10, color: '#a855f7', order: 1 },
      { name: 'Metas',                type: 'meta',  targetPercent: 10, color: '#22c55e', order: 2 },
      { name: 'Prazeres',             type: 'gasto', targetPercent: 10, color: '#f97316', order: 3 },
      { name: 'Liberdade financeira', type: 'meta',  targetPercent: 10, color: '#eab308', order: 4 },
      { name: 'Conhecimento',         type: 'meta',  targetPercent:  5, color: '#06b6d4', order: 5 },
    ],
  },
];
