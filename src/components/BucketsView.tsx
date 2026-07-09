'use client';

import { useState } from 'react';
import { formatBRL } from '@/lib/format';
import { bucketProgress, bucketInsights } from '@/lib/buckets';
import type { RollupResult, BucketRollup, BucketStatus } from '@/lib/buckets';
import type { BucketType } from '@/lib/db';

interface Props {
  rollup: RollupResult;
  incomeCents: number;
  expenseCents: number;

}

// ── helpers ───────────────────────────────────────────────────────────────────

function liquidColor(type: BucketType, status: BucketStatus): string {
  if (type === 'gasto') {
    if (status === 'over')  return '#ef4444';
    if (status === 'near')  return '#f59e0b';
    return '#22c55e';
  }
  return status === 'reached' ? '#22c55e' : '#6366f1';
}

function statusLabel(type: BucketType, status: BucketStatus): string {
  if (type === 'gasto') {
    if (status === 'over')  return 'Estourou';
    if (status === 'near')  return 'Atenção';
    return 'OK';
  }
  return status === 'reached' ? 'Atingido' : 'Em progresso';
}

function statusCls(type: BucketType, status: BucketStatus): string {
  if (type === 'gasto') {
    if (status === 'over')  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (status === 'near')  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  }
  return status === 'reached'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
}

/**
 * Wave path: 4 complete periods × 50px = 200px total.
 * SMIL animateTransform translates it −100px (2 periods) → seamless loop.
 * The bucket clip [x=12..88] stays fully covered at every animation frame.
 */
function wavePath(y: number, bottom: number): string {
  let d = `M-10,${y}`;
  for (let i = 0; i < 4; i++) {
    const x = -10 + i * 50;
    d += ` C${x + 8},${y - 3} ${x + 17},${y - 3} ${x + 25},${y}`;
    d += ` C${x + 33},${y + 3} ${x + 42},${y + 3} ${x + 50},${y}`;
  }
  d += ` L190,${bottom} L-10,${bottom} Z`;
  return d;
}

// ── LiquidBucket SVG ──────────────────────────────────────────────────────────

function LiquidBucket({
  ratio,
  fillColor,
  isOver,
  isReached,
  uid,
}: {
  ratio: number;
  fillColor: string;
  isOver: boolean;
  isReached: boolean;
  uid: string;
}) {
  const TOP    = 22;
  const BOTTOM = 90;
  const H      = BOTTOM - TOP;
  const level  = Math.min(ratio, 1);
  const waterY = BOTTOM - level * H;
  const clipId  = `bclip-${uid}`;
  const shimAnim = `bshim-${uid}`;

  return (
    <svg
      viewBox="0 0 100 115"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[140px] mx-auto block"
      aria-hidden="true"
    >
      {/* Shimmer keyframe — only injected when needed */}
      {isReached && (
        <style>{`
          @keyframes ${shimAnim} {
            0%,100% { opacity: 0.10; }
            50%      { opacity: 0.26; }
          }
        `}</style>
      )}

      <defs>
        <clipPath id={clipId}>
          {/* Tapered bucket interior */}
          <path d="M12,22 L88,22 L78,90 L22,90 Z" />
        </clipPath>
      </defs>

      {/* Bucket interior background */}
      <path
        d="M12,22 L88,22 L78,90 L22,90 Z"
        fill="currentColor"
        className="text-zinc-100 dark:text-zinc-800"
      />

      {/* Liquid */}
      {level > 0 && (
        <g clipPath={`url(#${clipId})`}>
          {/* Semi-transparent base fills below the wave */}
          <rect
            x="-5" y={waterY}
            width="110" height={BOTTOM - waterY + 5}
            fill={fillColor} opacity={0.28}
          />
          {/* Wave surface — animated horizontally via SMIL */}
          <g>
            <path d={wavePath(waterY, BOTTOM)} fill={fillColor} opacity={0.88} />
            {/* eslint-disable-next-line react/no-unknown-property */}
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="-100 0"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </g>
          {/* Shimmer overlay when meta target is reached */}
          {isReached && (
            <rect
              x="-5" y={TOP} width="110" height={H}
              fill="white"
              style={{ animation: `${shimAnim} 1.8s ease-in-out infinite` }}
            />
          )}
        </g>
      )}

      {/* Bucket outline drawn over liquid */}
      <path
        d="M12,22 L88,22 L78,90 L22,90 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="text-zinc-300 dark:text-zinc-600"
      />
      {/* Top rim */}
      <rect
        x="6" y="17" width="88" height="6" rx="3"
        fill="currentColor"
        className="text-zinc-300 dark:text-zinc-600"
      />
      {/* Handle */}
      <path
        d="M28,17 Q50,5 72,17"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-zinc-300 dark:text-zinc-600"
      />

      {/* Overflow drips when gasto exceeds 100% */}
      {isOver && (
        <>
          <circle cx="33" cy="90" r="3" fill={fillColor}>
            <animate attributeName="cy"      values="90;112" dur="1.3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.85;0" dur="1.3s" repeatCount="indefinite" />
          </circle>
          <circle cx="52" cy="90" r="2.5" fill={fillColor}>
            <animate attributeName="cy"      values="90;112" dur="1.6s" begin="0.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.75;0" dur="1.6s" begin="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="68" cy="90" r="2" fill={fillColor}>
            <animate attributeName="cy"      values="90;112" dur="1.1s" begin="0.9s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.65;0" dur="1.1s" begin="0.9s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}

// ── BucketCard ────────────────────────────────────────────────────────────────

function BucketCard({ bucket, spentCents, categories, incomeCents }: BucketRollup & { incomeCents: number }) {
  const [expanded, setExpanded] = useState(false);
  const { ratio, targetCents, status } = bucketProgress(
    spentCents, bucket.targetPercent, incomeCents, bucket.type,
  );
  const fill      = liquidColor(bucket.type, status);
  const isOver    = bucket.type === 'gasto' && status === 'over';
  const isReached = bucket.type === 'meta'  && status === 'reached';

  return (
    <div
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 cursor-pointer select-none transition-shadow hover:shadow-md"
      onClick={() => setExpanded(e => !e)}
    >
      {/* Name + status badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: bucket.color }}>
          {bucket.name}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusCls(bucket.type, status)}`}>
          {statusLabel(bucket.type, status)}
        </span>
      </div>

      {/* Animated liquid bucket */}
      <LiquidBucket
        ratio={ratio}
        fillColor={fill}
        isOver={isOver}
        isReached={isReached}
        uid={String(bucket.id ?? bucket.name)}
      />

      {/* Spent vs target */}
      <div className="flex items-baseline justify-between mt-2">
        <span className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
          {formatBRL(spentCents)}
        </span>
        <span className="text-xs text-zinc-400">
          / {formatBRL(targetCents)} ({bucket.targetPercent}%)
        </span>
      </div>

      {/* Category breakdown — revealed on tap/click */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {categories.length === 0 ? (
            <p className="text-xs text-zinc-400">Nenhuma categoria atribuída a este balde.</p>
          ) : (
            <div className="space-y-1">
              {categories.map(({ category, cents }) => (
                <div key={category} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 truncate flex-1 mr-2">
                    {category}
                  </span>
                  <span className="tabular-nums text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                    {formatBRL(cents)}
                    {targetCents > 0 && (
                      <span className="text-zinc-400 ml-1">
                        ({Math.round((cents / targetCents) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── BucketsView ───────────────────────────────────────────────────────────────

export function BucketsView({ rollup, incomeCents, expenseCents }: Props) {
  const insights             = bucketInsights(rollup.buckets, incomeCents);
  const leftover             = incomeCents - expenseCents;
  const hasCategories        = rollup.buckets.some(b => b.categories.length > 0);
  const totalTargetPercent   = rollup.buckets.reduce((s, b) => s + b.bucket.targetPercent, 0);
  const savingsTargetPercent = Math.max(0, 100 - totalTargetPercent);
  const savingsRealPercent   = incomeCents > 0 ? Math.round((leftover / incomeCents) * 100) : 0;
  const savingsShortfall     = savingsTargetPercent > 0 && savingsRealPercent < savingsTargetPercent;


  if (rollup.buckets.length === 0) return null;

  return (
    <div>
      {hasCategories && (
        <p className="text-xs text-zinc-400 mb-4 text-center">
          Toque em um balde para ver as categorias
        </p>
      )}

      {/* Bucket grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {rollup.buckets.map(item => (
          <BucketCard key={item.bucket.id} {...item} incomeCents={incomeCents} />
        ))}

        {/* "Poupança do mês" — derived indicator (the "20%" in 50/30/20) */}
        {incomeCents > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Poupança do mês
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                leftover >= 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {leftover >= 0 ? 'Positivo' : 'Negativo'}
              </span>
            </div>
            <p className={`text-xl font-semibold tabular-nums mt-4 ${
              leftover >= 0 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {leftover < 0 ? '-' : ''}{formatBRL(Math.abs(leftover))}
            </p>
            {savingsTargetPercent > 0 ? (
              <p className={`text-xs mt-1 ${savingsShortfall ? 'text-amber-500' : 'text-zinc-400'}`}>
                Meta {savingsTargetPercent}% → Real {savingsRealPercent}%
                {savingsShortfall && ` (−${savingsTargetPercent - savingsRealPercent}%)`}
              </p>
            ) : (
              <p className="text-xs text-zinc-400 mt-1">Receita menos todos os gastos</p>
            )}
          </div>
        )}
      </div>

      {/* Unassigned spending warning */}
      {rollup.unassigned.spentCents > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-4 mb-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Sem balde: {formatBRL(rollup.unassigned.spentCents)}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            {rollup.unassigned.categories.map(c => c.category).join(', ')} — classifique em "Configurar baldes".
          </p>
        </div>
      )}

      {/* Deterministic insights */}
      {insights.length > 0 && (
        <div className="flex flex-col gap-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`px-4 py-3 rounded-xl text-sm border ${
                insight.severity === 'warning'
                  ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              {insight.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
