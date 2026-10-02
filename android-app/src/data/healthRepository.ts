// Health records are stored locally; this boundary is the future Fitbit import seam.
import type { SQLiteDatabase } from 'expo-sqlite';
import type { HealthDraft, HealthEntry } from './types';

export function listHealthEntries(database: SQLiteDatabase) {
  return database.getAllAsync<HealthEntry>(
    'SELECT id, metric, value, unit, date, note FROM health_entries ORDER BY date DESC, rowid DESC',
  );
}

export async function saveHealthEntry(database: SQLiteDatabase, draft: HealthDraft) {
  const id = draft.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await database.runAsync(
    `INSERT INTO health_entries (id, metric, value, unit, date, note)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET metric = excluded.metric, value = excluded.value,
       unit = excluded.unit, date = excluded.date, note = excluded.note`,
    id,
    draft.metric,
    draft.value,
    draft.unit,
    draft.date,
    draft.note,
  );
}

export async function deleteHealthEntry(database: SQLiteDatabase, id: string) {
  await database.runAsync('DELETE FROM health_entries WHERE id = ?', id);
}