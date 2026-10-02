// Shared ledger types keep storage, forms, and screen props aligned.
export type RecordKind = 'finance' | 'health';
export type TransactionType = 'income' | 'expense';
export type HealthMetric = 'steps' | 'sleep' | 'water' | 'workout' | 'weight';

export type FinanceTransaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note: string;
};

export type HealthEntry = {
  id: string;
  metric: HealthMetric;
  value: number;
  unit: string;
  date: string;
  note: string;
};

export type FinanceDraft = Omit<FinanceTransaction, 'id'> & { id?: string };
export type HealthDraft = Omit<HealthEntry, 'id'> & { id?: string };