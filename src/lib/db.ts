import Dexie, { type Table } from "dexie";

/**
 * FinLivre's entire database lives in the browser (IndexedDB) via Dexie.
 * Everything is an `Entry` — income or expense. Imports, manual entry and
 * recurring rules are all just *sources* that produce Entries. See PLAN.md §4–5.
 *
 * Reminder: money is stored as integer CENTS (amountCents), never floats.
 */

export type Direction = "income" | "expense" | "transfer";
export type Source = "ofx" | "csv" | "pdf" | "manual";
export type AccountType = "credit_card" | "bank" | "cash" | "other";

export interface Account {
  id?: number;
  name: string;
  type: AccountType;
  color: string;         // hex — smart defaults for known banks, user-editable
  closingDay?: number;   // day of month when billing cycle closes (credit cards only)
}

export interface Category {
  id?: number;
  name: string;
  color?: string;
  monthlyBudgetCents?: number;
}

export interface Installment {
  current: number;
  total: number;
}

export interface Entry {
  id?: number;
  date: string;           // ISO yyyy-mm-dd — actual purchase date
  billingMonth?: string;  // yyyy-MM — which budget month this belongs to
  description: string;
  amountCents: number;    // ALWAYS positive; direction carries the sign
  direction: Direction;
  category: string;
  accountId?: number;
  installment?: Installment;
  source: Source;
  importedAt: string;     // ISO timestamp
  hash: string;           // dedupe key
}

export interface MerchantRule {
  merchant: string; // normalized key (primary key)
  category: string;
}

/** Stores the statement balance (LEDGERBAL) from each OFX import per account/month. */
export interface InvoiceStatement {
  id?: number;
  accountId: number;
  month: string;          // yyyy-MM — billing month this statement covers
  balanceCents: number;   // absolute value of LEDGERBAL (what is owed)
  importedAt: string;
}

/** A recurring income or fixed expense that pre-fills every future month. */
export interface RecurringItem {
  id?: number;
  direction: "income" | "expense";
  description: string;
  amountCents: number;
  category: string;
  dayOfMonth?: number;  // day it's expected (e.g. 5 for salary on the 5th)
  activeFrom: string;   // yyyy-MM — first month this applies
  activeTo?: string;    // yyyy-MM — last month (undefined = indefinite)
}

/**
 * A single-month exception to a RecurringItem (e.g. salary was 5004 in June, not 5300).
 * Modeled as an override — NOT a materialized entry — so the "future months are computed
 * on-the-fly" invariant holds and there's no double-count risk against real OFX data.
 */
export interface RecurringOverride {
  id?: number;
  recurringItemId: number;
  month: string;         // yyyy-MM — the single month this override applies to
  amountCents?: number;  // overridden amount for that month
  skip?: boolean;        // true = the recurring item does not apply this month
}

class FinLivreDB extends Dexie {
  entries!: Table<Entry, number>;
  accounts!: Table<Account, number>;
  categories!: Table<Category, number>;
  merchantRules!: Table<MerchantRule, string>;
  invoiceStatements!: Table<InvoiceStatement, number>;
  recurringItems!: Table<RecurringItem, number>;
  recurringOverrides!: Table<RecurringOverride, number>;

  constructor() {
    super("finlivre");
    this.version(1).stores({
      entries: "++id, date, category, direction, accountId, hash",
      accounts: "++id, name",
      categories: "++id, name",
      merchantRules: "merchant",
    });
    // v2: adds invoiceStatements + recurringItems; extends Account with color/closingDay
    // (Dexie only needs the new/changed indexes here — existing field additions are automatic)
    this.version(2).stores({
      entries: "++id, date, category, direction, accountId, hash",
      accounts: "++id, name",
      categories: "++id, name",
      merchantRules: "merchant",
      invoiceStatements: "++id, accountId, month, [accountId+month]",
      recurringItems: "++id, direction",
    });
    // v3: adds recurringOverrides for per-month exceptions to a recurring item.
    this.version(3).stores({
      entries: "++id, date, category, direction, accountId, hash",
      accounts: "++id, name",
      categories: "++id, name",
      merchantRules: "merchant",
      invoiceStatements: "++id, accountId, month, [accountId+month]",
      recurringItems: "++id, direction",
      recurringOverrides: "++id, recurringItemId, month, [recurringItemId+month]",
    });
  }
}

export const db = new FinLivreDB();
