// Finance data access stays behind this repository so API sync can be added independently.
import type { SQLiteDatabase } from 'expo-sqlite';
import type { FinanceDraft, FinanceTransaction } from './types';

export function listTransactions(database: SQLiteDatabase) {
  return database.getAllAsync<FinanceTransaction>(
    'SELECT id, title, amount, type, category, date, note FROM transactions ORDER BY date DESC, rowid DESC',
  );
}

export async function saveTransaction(database: SQLiteDatabase, draft: FinanceDraft) {
  const id = draft.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await database.runAsync(
    `INSERT INTO transactions (id, title, amount, type, category, date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, amount = excluded.amount,
       type = excluded.type, category = excluded.category, date = excluded.date, note = excluded.note`,
    id,
    draft.title,
    draft.amount,
    draft.type,
    draft.category,
    draft.date,
    draft.note,
  );
}

export async function deleteTransaction(database: SQLiteDatabase, id: string) {
  await database.runAsync('DELETE FROM transactions WHERE id = ?', id);
}