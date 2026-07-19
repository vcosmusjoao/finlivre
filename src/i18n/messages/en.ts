// English message catalog — the default locale and the source of truth for the
// `Messages` shape. `pt.ts` is typed against this interface, so TypeScript flags
// any key (or function signature) that drifts between the two locales.
export interface Messages {
  common: {
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    confirm: string;
    name: string;
    color: string;
    customColor: string;
    type: string;
    category: string;
    description: string;
    date: string;
    amount: string;
    account: string;
    noAccount: string;
    income: string;
    expense: string;
    transfer: string;
  };
  totals: {
    income: string;
    expenses: string;
    balance: string;
  };
  nav: {
    appName: string;
    tagline: string;
    dashboard: string;
    transactions: string;
    planning: string;
    settings: string;
  };
  themeToggle: {
    label: string;
    light: string;
    dark: string;
    system: string;
  };
  monthSelector: {
    overview: string;
  };
  accountFilter: {
    allAccounts: string;
    manual: string;
  };
  accountTypes: {
    credit_card: string;
    bank: string;
    cash: string;
    other: string;
  };
  accountPicker: {
    title: string;
    subtitle: string;
    newAccount: string;
    namePlaceholder: string;
    closesOnDay: string;
    dayPlaceholder: string;
    createAndSelect: string;
    importWithoutAccount: string;
    nameRequired: string;
    createError: (msg: string) => string;
  };
  accountsManager: {
    button: string;
    title: string;
    empty: string;
    closesOnDay: (day: number) => string;
    editAccount: string;
    newAccount: string;
    namePlaceholder: string;
    addAccount: string;
    nameRequired: string;
    saveError: (msg: string) => string;
  };
  apiKeySettings: {
    title: string;
    description: string;
    createKeyAt: string;
    removeKey: string;
  };
  bucketSettings: {
    button: string;
    title: string;
    applyPreset: string;
    emptyState: string;
    total: string;
    remainderNote: (percent: number) => string;
    sumWarning: string;
    saveBuckets: string;
    assignCategories: string;
    unassignedCount: (n: number) => string;
    noBucket: string;
  };
  bucketType: {
    gasto: string;
    meta: string;
  };
  bucketsView: {
    over: string;
    near: string;
    ok: string;
    reached: string;
    inProgress: string;
    noCategoriesAssigned: string;
    tapHint: string;
    monthlySavings: string;
    positive: string;
    negative: string;
    targetVsReal: (target: number, real: number) => string;
    incomeMinusExpenses: string;
    unassignedSpending: (amount: string) => string;
    unassignedHint: (categories: string) => string;
    insightOverBudget: (bucketName: string, overByReais: string) => string;
    insightGoalReached: (bucketName: string) => string;
  };
  clearDataButton: {
    confirmPrompt: string;
    clearData: string;
  };
  exportButton: {
    button: string;
    jsonLabel: string;
    jsonHint: string;
    csvLabel: string;
    csvHint: string;
    csvHeaders: string[];
  };
  importReview: {
    cacheHint: string;
    title: string;
    subtitle: string;
    headers: {
      date: string;
      month: string;
      description: string;
      amount: string;
      type: string;
      category: string;
    };
    remove: string;
    addRow: string;
    noValidRows: string;
    account: string;
    billingMonth: string;
    applyMonthToAll: string;
    invoiceTotal: string;
    invoiceTotalPlaceholder: string;
    importRows: (n: number) => string;
  };
  incomeExpenseChart: {
    title: string;
  };
  spendingChart: {
    others: string;
  };
  invoiceCards: {
    cardFallback: string;
    invoiceFor: (month: string) => string;
    due: string;
  };
  manualEntryForm: {
    addButton: string;
    title: string;
    descriptionPlaceholder: string;
    categoryPlaceholder: string;
    installments: string;
    installmentsSummary: (n: number, value: string) => string;
    descriptionRequired: string;
    invalidAmount: string;
    categoryRequired: string;
  };
  projectedView: {
    calculating: string;
    recurringFallback: string;
    emptyTitle: string;
    emptyHint: string;
    expectedIncome: string;
    committedExpenses: string;
    hiddenThisMonth: string;
    restore: string;
    adjustHint: string;
    fixedBadge: string;
    adjusted: string;
    revertHint: string;
    skipThisMonth: string;
  };
  recurringItemsManager: {
    button: string;
    title: string;
    subtitle: string;
    empty: string;
    fixedIncome: string;
    fixedExpenses: string;
    newItem: string;
    prefillHint: string;
    descriptionPlaceholder: string;
    categoryPlaceholder: string;
    dayOfMonth: string;
    dayPlaceholder: string;
    startingFrom: string;
    until: string;
    descriptionRequired: string;
    invalidAmount: string;
    categoryRequired: string;
    startDateRequired: string;
    saveError: (msg: string) => string;
    add: string;
    dayLabel: (n: number) => string;
  };
  sampleButton: {
    loaded: string;
    loading: string;
    load: string;
  };
  summaryCards: {
    projectionNote: string;
  };
  transactionsTable: {
    titleForMonth: (month: string) => string;
    titleAll: string;
    countLabel: (n: number) => string;
    empty: string;
    headers: {
      date: string;
      description: string;
      category: string;
      amount: string;
    };
    selectAll: string;
    selectOne: (desc: string) => string;
    invoicePayment: string;
    clickToCategorize: string;
    categorizePrompt: string;
    deleteEntry: string;
    selectedCount: (n: number) => string;
    categoryPlaceholderOption: string;
    apply: string;
    cancelSelection: string;
    retroTitle: string;
    retroBody: (n: number, category: string) => string;
    onlySelected: string;
    applyToAll: string;
  };
  uploadButton: {
    noTransactionsFound: string;
    importOfx: string;
    importResult: (added: number, skipped: number) => string;
    importError: string;
  };
  visionImportButton: {
    noTransactionsFound: string;
    analyzing: string;
    import: string;
    genericError: string;
  };
  dashboardBody: {
    upcomingCommitments: string;
    projection: string;
    spendingByCategory: string;
    expectedThisMonth: string;
  };
  dashboardPage: {
    spendingByCategory: string;
    spendingByAccount: string;
    futureMonthNotice: string;
    seeCommitmentsIn: string;
    expectedThisMonth: string;
  };
  lancamentosPage: {
    upcomingCommitments: string;
    projection: string;
  };
  planejamentoPage: {
    noBucketsTitle: string;
    noBucketsHint: string;
    aggregateOfAllMonths: string;
    futureMonthNotice: string;
  };
}

export const en: Messages = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    name: 'Name',
    color: 'Color',
    customColor: 'Custom color',
    type: 'Type',
    category: 'Category',
    description: 'Description',
    date: 'Date',
    amount: 'Amount (R$)',
    account: 'Account',
    noAccount: 'No account',
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
  },
  totals: {
    income: 'Income',
    expenses: 'Expenses',
    balance: 'Balance',
  },
  nav: {
    appName: 'FinLivre',
    tagline: 'finally free.',
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    planning: 'Planning',
    settings: 'Settings',
  },
  themeToggle: {
    label: 'Theme:',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  monthSelector: {
    overview: 'Overview',
  },
  accountFilter: {
    allAccounts: 'All accounts',
    manual: 'Manual',
  },
  accountTypes: {
    credit_card: 'Credit card',
    bank: 'Bank account',
    cash: 'Cash / wallet',
    other: 'Other',
  },
  accountPicker: {
    title: 'Which account is this?',
    subtitle: 'Select an existing account or create a new one.',
    newAccount: '+ New account',
    namePlaceholder: 'e.g. Nubank, Inter, Rent…',
    closesOnDay: 'Closes on day',
    dayPlaceholder: 'e.g. 5',
    createAndSelect: 'Create and select',
    importWithoutAccount: 'Import without account',
    nameRequired: 'Name is required.',
    createError: (msg: string) => `Error creating: ${msg}`,
  },
  accountsManager: {
    button: 'Accounts',
    title: 'Accounts',
    empty: 'No accounts yet.',
    closesOnDay: (day: number) => `closes on day ${day}`,
    editAccount: 'Edit account',
    newAccount: 'New account',
    namePlaceholder: 'e.g. Nubank, Apartment loan…',
    addAccount: 'Add account',
    nameRequired: 'Name is required.',
    saveError: (msg: string) => `Error saving: ${msg}`,
  },
  apiKeySettings: {
    title: 'Anthropic API key',
    description:
      "To read invoice photos and PDFs, FinLivre uses Claude with your own key. It's stored only in this browser. Importing an image sends the file to Anthropic under your key — your data stays off any server of ours.",
    createKeyAt: 'Create a key at',
    removeKey: 'Remove key',
  },
  bucketSettings: {
    button: 'Configure buckets',
    title: 'Planning buckets',
    applyPreset: 'Apply preset',
    emptyState: 'Apply a preset above to get started.',
    total: 'Total:',
    remainderNote: (percent: number) => `The remaining ${percent}% = "Money left over"`,
    sumWarning: 'Warning: total exceeds 100%',
    saveBuckets: 'Save buckets',
    assignCategories: 'Assign categories',
    unassignedCount: (n: number) => `${n} unassigned`,
    noBucket: '— no bucket —',
  },
  bucketType: {
    gasto: 'Expense',
    meta: 'Goal',
  },
  bucketsView: {
    over: 'Over budget',
    near: 'Warning',
    ok: 'OK',
    reached: 'Reached',
    inProgress: 'In progress',
    noCategoriesAssigned: 'No category assigned to this bucket.',
    tapHint: 'Tap a bucket to see its categories',
    monthlySavings: 'Monthly savings',
    positive: 'Positive',
    negative: 'Negative',
    targetVsReal: (target: number, real: number) => `Target ${target}% → Actual ${real}%`,
    incomeMinusExpenses: 'Income minus all expenses',
    unassignedSpending: (amount: string) => `Unassigned: ${amount}`,
    unassignedHint: (categories: string) => `${categories} — categorize them in "Configure buckets".`,
    insightOverBudget: (bucketName: string, overByReais: string) => `"${bucketName}" went over the limit by R$ ${overByReais}.`,
    insightGoalReached: (bucketName: string) => `Goal "${bucketName}" reached!`,
  },
  clearDataButton: {
    confirmPrompt: 'Clear everything?',
    clearData: 'Clear data',
  },
  exportButton: {
    button: 'Export',
    jsonLabel: 'JSON',
    jsonHint: 'full backup',
    csvLabel: 'CSV',
    csvHint: 'for spreadsheet',
    csvHeaders: ['Date', 'Description', 'Amount (R$)', 'Direction', 'Category', 'Account', 'Installment', 'Billing month', 'Source'],
  },
  importReview: {
    cacheHint: '⚡ local cache · no token usage',
    title: 'Review transactions',
    subtitle: 'Check the values before saving — you can edit, remove, or add rows.',
    headers: {
      date: 'Date',
      month: 'Month',
      description: 'Description',
      amount: 'Amount (R$)',
      type: 'Type',
      category: 'Category',
    },
    remove: 'Remove',
    addRow: '+ Add row',
    noValidRows: 'No valid rows to import.',
    account: 'Account',
    billingMonth: 'Billing month',
    applyMonthToAll: 'Apply month to all rows',
    invoiceTotal: 'Invoice total',
    invoiceTotalPlaceholder: '0,00 (optional)',
    importRows: (n: number) => `Import ${n} ${n === 1 ? 'row' : 'rows'}`,
  },
  incomeExpenseChart: {
    title: 'Income vs Expenses',
  },
  spendingChart: {
    others: 'Others',
  },
  invoiceCards: {
    cardFallback: 'Card',
    invoiceFor: (month: string) => `invoice ${month}`,
    due: 'due',
  },
  manualEntryForm: {
    addButton: '+ Add',
    title: 'New entry',
    descriptionPlaceholder: 'e.g. Rent, Salary…',
    categoryPlaceholder: 'e.g. Groceries…',
    installments: 'Installments',
    installmentsSummary: (n: number, value: string) => `${n}x of R$ ${value}`,
    descriptionRequired: 'Description is required.',
    invalidAmount: 'Invalid amount.',
    categoryRequired: 'Category is required.',
  },
  projectedView: {
    calculating: 'Calculating projection…',
    recurringFallback: 'Recurring',
    emptyTitle: 'No upcoming commitments detected for this month.',
    emptyHint: 'Installments and recurring items will appear here automatically.',
    expectedIncome: 'Expected income',
    committedExpenses: 'Committed expenses',
    hiddenThisMonth: 'Hidden this month',
    restore: 'restore',
    adjustHint: 'Click to adjust only this month',
    fixedBadge: 'fixed',
    adjusted: 'adjusted',
    revertHint: 'Revert to original value',
    skipThisMonth: 'skip this month',
  },
  recurringItemsManager: {
    button: 'Recurring',
    title: 'Recurring',
    subtitle: 'Fixed salary, rent, subscriptions…',
    empty: 'No recurring items yet.',
    fixedIncome: 'Fixed income',
    fixedExpenses: 'Fixed expenses',
    newItem: 'New recurring item',
    prefillHint: 'Automatically pre-fills future months. To add it for the current month, use + Add.',
    descriptionPlaceholder: 'e.g. Salary, Rent, Netflix…',
    categoryPlaceholder: 'Salary, Housing…',
    dayOfMonth: 'On day',
    dayPlaceholder: 'e.g. 5',
    startingFrom: 'Starting',
    until: 'Until (empty = indefinite)',
    descriptionRequired: 'Description is required.',
    invalidAmount: 'Invalid amount.',
    categoryRequired: 'Category is required.',
    startDateRequired: 'Start date is required.',
    saveError: (msg: string) => `Error: ${msg}`,
    add: 'Add',
    dayLabel: (n: number) => `day ${n}`,
  },
  sampleButton: {
    loaded: 'Sample loaded',
    loading: 'Loading…',
    load: 'Load sample',
  },
  summaryCards: {
    projectionNote: 'Projection — committed installments + recurring income/expenses',
  },
  transactionsTable: {
    titleForMonth: (month: string) => `Transactions for ${month}`,
    titleAll: 'All transactions',
    countLabel: (n: number) => `${n} ${n === 1 ? 'transaction' : 'transactions'}`,
    empty: 'No transactions imported yet.',
    headers: {
      date: 'Date',
      description: 'Description',
      category: 'Category',
      amount: 'Amount',
    },
    selectAll: 'Select all',
    selectOne: (desc: string) => `Select ${desc}`,
    invoicePayment: 'invoice payment',
    clickToCategorize: 'Click to categorize',
    categorizePrompt: '? Categorize',
    deleteEntry: 'Delete entry',
    selectedCount: (n: number) => `${n} selected`,
    categoryPlaceholderOption: 'Category...',
    apply: 'Apply',
    cancelSelection: 'Cancel selection',
    retroTitle: 'Categorize similar ones?',
    retroBody: (n: number, category: string) =>
      `We found ${n} other uncategorized transaction${n === 1 ? '' : 's'} from the same merchants. Apply "${category}" to them too?`,
    onlySelected: 'Only selected',
    applyToAll: 'Apply to all',
  },
  uploadButton: {
    noTransactionsFound: 'No transactions found in the file.',
    importOfx: 'Import OFX',
    importResult: (added: number, skipped: number) => `${added} imported${skipped > 0 ? `, ${skipped} duplicates` : ''}.`,
    importError: 'Error importing file.',
  },
  visionImportButton: {
    noTransactionsFound: 'No transactions found in the image/PDF.',
    analyzing: 'Analyzing with AI…',
    import: 'Import photo/PDF',
    genericError: 'Error analyzing. Check your API key and connection.',
  },
  dashboardBody: {
    upcomingCommitments: 'Upcoming commitments',
    projection: 'projection',
    spendingByCategory: 'Spending by category',
    expectedThisMonth: 'Expected this month',
  },
  dashboardPage: {
    spendingByCategory: 'Spending by category',
    spendingByAccount: 'Spending by account',
    futureMonthNotice: 'Future month — no real data yet.',
    seeCommitmentsIn: 'See upcoming commitments in',
    expectedThisMonth: 'Expected this month',
  },
  lancamentosPage: {
    upcomingCommitments: 'Upcoming commitments',
    projection: 'projection',
  },
  planejamentoPage: {
    noBucketsTitle: 'No buckets configured yet',
    noBucketsHint:
      'Buckets organize your categories into groups like Needs, Wants, and Goals — the foundation of the 50/30/20 method.',
    aggregateOfAllMonths: 'Aggregate of all months',
    futureMonthNotice:
      "Future month — goals calculated based on projected income. Real expenses don't exist yet for this month.",
  },
};
