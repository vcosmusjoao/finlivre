'use client';

import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RecurringItem } from '@/lib/db';
import { formatBRL, currentMonth, addMonths } from '@/lib/format';
import { useLocale } from '@/i18n/LocaleContext';

const EMPTY_FORM = {
  direction: 'income' as 'income' | 'expense',
  description: '',
  amount: '',
  category: '',
  dayOfMonth: '',
  activeFrom: currentMonth(),
  activeTo: '',
};

export function RecurringItemsManager() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const items = useLiveQuery(() => db.recurringItems.toArray(), []);
  const categories = useLiveQuery(() =>
    db.entries.orderBy('category').uniqueKeys() as Promise<string[]>
  , [], []);
  const { t } = useLocale();
  const DIRECTION_LABEL = { income: t.common.income, expense: t.common.expense };

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function open() {
    setForm({ ...EMPTY_FORM, activeFrom: addMonths(currentMonth(), 1) });
    setEditingId(null);
    setError('');
    dialogRef.current?.showModal();
  }

  function startEdit(item: RecurringItem) {
    setForm({
      direction: item.direction,
      description: item.description,
      amount: (item.amountCents / 100).toFixed(2).replace('.', ','),
      category: item.category,
      dayOfMonth: item.dayOfMonth?.toString() ?? '',
      activeFrom: item.activeFrom,
      activeTo: item.activeTo ?? '',
    });
    setEditingId(item.id!);
    setError('');
  }

  function cancelEdit() {
    setForm({ ...EMPTY_FORM, activeFrom: addMonths(currentMonth(), 1) });
    setEditingId(null);
    setError('');
  }

  async function handleSave() {
    const amountCents = Math.round(
      parseFloat(form.amount.replace(',', '.')) * 100
    );
    if (!form.description.trim()) { setError(t.recurringItemsManager.descriptionRequired); return; }
    if (isNaN(amountCents) || amountCents <= 0) { setError(t.recurringItemsManager.invalidAmount); return; }
    if (!form.category.trim()) { setError(t.recurringItemsManager.categoryRequired); return; }
    if (!form.activeFrom) { setError(t.recurringItemsManager.startDateRequired); return; }

    const data = {
      direction: form.direction,
      description: form.description.trim(),
      amountCents,
      category: form.category.trim(),
      dayOfMonth: form.dayOfMonth ? Number(form.dayOfMonth) : undefined,
      activeFrom: form.activeFrom,
      activeTo: form.activeTo || undefined,
    };

    try {
      if (editingId !== null) {
        await db.recurringItems.update(editingId, data);
      } else {
        await db.recurringItems.add(data);
      }
      cancelEdit();
      if (editingId === null) dialogRef.current?.close();
    } catch (e) {
      setError(t.recurringItemsManager.saveError(e instanceof Error ? e.message : String(e)));
    }
  }

  async function handleDelete(id: number) {
    await db.recurringItems.delete(id);
    if (editingId === id) cancelEdit();
  }

  const income = items?.filter(i => i.direction === 'income') ?? [];
  const expenses = items?.filter(i => i.direction === 'expense') ?? [];

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        {t.recurringItemsManager.button}
      </button>

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 w-full max-w-lg shadow-xl backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t.recurringItemsManager.title}</h2>
            <p className="text-xs text-zinc-400">{t.recurringItemsManager.subtitle}</p>
          </div>
          <button type="button" onClick={() => dialogRef.current?.close()}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none">×</button>
        </div>

        {/* Lists */}
        {(items ?? []).length === 0 && (
          <p className="text-sm text-zinc-400 mb-4">{t.recurringItemsManager.empty}</p>
        )}

        {income.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-emerald-600 mb-2">{t.recurringItemsManager.fixedIncome}</p>
            <div className="flex flex-col gap-1">
              {income.map(item => (
                <ItemRow key={item.id} item={item} onEdit={startEdit} onDelete={handleDelete} directionLabel={DIRECTION_LABEL} />
              ))}
            </div>
          </div>
        )}

        {expenses.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-red-500 mb-2">{t.recurringItemsManager.fixedExpenses}</p>
            <div className="flex flex-col gap-1">
              {expenses.map(item => (
                <ItemRow key={item.id} item={item} onEdit={startEdit} onDelete={handleDelete} directionLabel={DIRECTION_LABEL} />
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="border-t border-border-divider pt-4">
          <h3 className="text-sm font-medium text-body mb-1">
            {editingId !== null ? t.common.edit : t.recurringItemsManager.newItem}
          </h3>
          <p className="text-xs text-zinc-400 mb-3">
            {t.recurringItemsManager.prefillHint}
          </p>
          <div className="flex flex-col gap-3">

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t.common.type}</span>
                <select value={form.direction} onChange={e => set('direction', e.target.value)} className={inputCls}>
                  <option value="income">{t.common.income}</option>
                  <option value="expense">{t.common.expense}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t.common.amount}</span>
                <input type="text" inputMode="decimal" placeholder="0,00"
                  value={form.amount} onChange={e => set('amount', e.target.value)} className={inputCls} />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{t.common.description}</span>
              <input type="text" placeholder={t.recurringItemsManager.descriptionPlaceholder}
                value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t.common.category}</span>
                <input type="text" list="rec-category-list" placeholder={t.recurringItemsManager.categoryPlaceholder}
                  value={form.category} onChange={e => set('category', e.target.value)} className={inputCls} />
                <datalist id="rec-category-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t.recurringItemsManager.dayOfMonth}</span>
                <input type="number" min={1} max={31} placeholder={t.recurringItemsManager.dayPlaceholder}
                  value={form.dayOfMonth} onChange={e => set('dayOfMonth', e.target.value)} className={inputCls} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t.recurringItemsManager.startingFrom}</span>
                <input type="month" value={form.activeFrom} onChange={e => set('activeFrom', e.target.value)} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t.recurringItemsManager.until}</span>
                <input type="month" value={form.activeTo} onChange={e => set('activeTo', e.target.value)} className={inputCls} />
              </label>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2 justify-end">
              {editingId !== null && (
                <button type="button" onClick={cancelEdit}
                  className="text-sm px-3 py-1.5 rounded-lg border border-border text-body">
                  {t.common.cancel}
                </button>
              )}
              <button type="button" onClick={handleSave}
                className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                {editingId !== null ? t.common.save : t.recurringItemsManager.add}
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

function ItemRow({ item, onEdit, onDelete, directionLabel }: {
  item: RecurringItem;
  onEdit: (item: RecurringItem) => void;
  onDelete: (id: number) => void;
  directionLabel: Record<'income' | 'expense', string>;
}) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-divider px-3 py-2">
      <span className={`text-xs font-medium w-14 ${item.direction === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
        {directionLabel[item.direction]}
      </span>
      <span className="text-sm text-body flex-1">{item.description}</span>
      <span className="text-sm tabular-nums text-muted-foreground">{formatBRL(item.amountCents)}</span>
      {item.dayOfMonth && <span className="text-xs text-zinc-400">{t.recurringItemsManager.dayLabel(item.dayOfMonth)}</span>}
      <button type="button" onClick={() => onEdit(item)}
        className="text-xs text-zinc-400 hover:text-indigo-600 transition-colors ml-1">{t.common.edit}</button>
      <button type="button" onClick={() => onDelete(item.id!)}
        className="text-xs text-zinc-400 hover:text-red-500 transition-colors">{t.common.delete}</button>
    </div>
  );
}

const inputCls = 'rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
