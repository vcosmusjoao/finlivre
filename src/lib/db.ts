import Dexie, { type Table } from "dexie";

/**
 * FinLivre's entire database lives in the browser (IndexedDB) via Dexie.
 * Everything is an `Entry` — income or expense. Imports, manual entry and
 * recurring rules are all just *sources* that produce Entries. See PLAN.md §4–5.
 *
 * Reminder: money is stored as integer CENTS (amountCents), never floats.
 */

export type Direction = "income" | "expense";
export type Source = "ofx" | "csv" | "pdf" | "manual";
export type AccountType = "credit_card" | "bank" | "cash" | "other";

export interface Account {
  id?: number;
  name: string; // e.g. "Nubank", "Salary account"
  type: AccountType;
  color?: string;
}

export interface Category {
  id?: number;
  name: string; // e.g. "Food"
  color?: string;
  monthlyBudgetCents?: number; // optional budget, in cents
}

export interface Installment {
  current: number; // 3
  total: number; // 12
}

export interface Entry {
  id?: number;
  date: string; // ISO yyyy-mm-dd
  description: string; // raw text from the source
  amountCents: number; // ALWAYS positive; direction carries the sign
  direction: Direction;
  category: string; // category name, or "Uncategorized"
  accountId?: number;
  installment?: Installment;
  source: Source;
  importedAt: string; // ISO timestamp
  hash: string; // dedupe key (date + amount + description + account)
}

/** Learned mapping that makes categorization more automatic over time. */
export interface MerchantRule {
  merchant: string; // normalized key (primary key)
  category: string;
}

class FinLivreDB extends Dexie {
  entries!: Table<Entry, number>;
  accounts!: Table<Account, number>;
  categories!: Table<Category, number>;
  merchantRules!: Table<MerchantRule, string>;

  constructor() {
    super("finlivre");
    // Listed fields after the primary key are INDEXES (what you can .where() on).
    this.version(1).stores({
      entries: "++id, date, category, direction, accountId, hash",
      accounts: "++id, name",
      categories: "++id, name",
      merchantRules: "merchant",
    });
  }
}

export const db = new FinLivreDB();
