import { db } from "./db";

/**
 * Deterministic categorization — no AI. Three layers, cheapest first:
 *   1. user-learned rule (MerchantRule)  -> always wins
 *   2. seed dictionary keyword match     -> specific BEFORE generic
 *   3. fallback "Uncategorized"          -> user picks once, we learn it
 *
 * This is a starter dictionary. Grow it as you see your own statements.
 * Order matters: more specific keywords must come before generic ones.
 */
export const SEED_RULES: { keyword: string; category: string }[] = [
  { keyword: "UBER EATS", category: "Food" }, // before "UBER"
  { keyword: "IFOOD", category: "Food" },
  { keyword: "RAPPI", category: "Food" },
  { keyword: "RESTAURANTE", category: "Food" },
  { keyword: "UBER", category: "Transport" },
  { keyword: "99APP", category: "Transport" },
  { keyword: "99 ", category: "Transport" },
  { keyword: "POSTO", category: "Transport" }, // gas station
  { keyword: "NETFLIX", category: "Subscriptions" },
  { keyword: "SPOTIFY", category: "Subscriptions" },
  { keyword: "PRIME", category: "Subscriptions" },
  { keyword: "DROGA", category: "Pharmacy" }, // Drogasil, Droga Raia
  { keyword: "FARMACIA", category: "Pharmacy" },
  { keyword: "MERCADO", category: "Groceries" },
  { keyword: "CARREFOUR", category: "Groceries" },
  { keyword: "PAO DE ACUCAR", category: "Groceries" },
  { keyword: "AMAZON", category: "Shopping" },
  { keyword: "MERCADO LIVRE", category: "Shopping" },
  { keyword: "MAGAZINE", category: "Shopping" },
];

/** Strip payment-gateway prefixes and normalize for matching. */
export function normalizeMerchant(description: string): string {
  return description
    .toUpperCase()
    .replace(/^(PAG\*|IFD\*|MP\*|MERCADOPAGO\*|PAYPAL \*)/, "")
    .trim();
}

/** Returns a category name, or "Uncategorized" if nothing matches. */
export async function categorize(description: string): Promise<string> {
  const key = normalizeMerchant(description);

  const learned = await db.merchantRules.get(key);
  if (learned) return learned.category;

  const hit = SEED_RULES.find((r) => key.includes(r.keyword));
  return hit ? hit.category : "Uncategorized";
}

/** Call this when the user manually categorizes a merchant — it sticks for next time. */
export async function learnRule(description: string, category: string): Promise<void> {
  await db.merchantRules.put({ merchant: normalizeMerchant(description), category });
}
