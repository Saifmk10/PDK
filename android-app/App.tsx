// The app shell owns screen navigation, local data refresh, and the shared record editor.
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation } from './src/components/BottomNavigation';
import { RecordEditorModal } from './src/components/RecordEditorModal';
import { VoiceAssistantButton } from './src/components/VoiceAssistantButton';
import { initializeDatabase } from './src/data/database';
import { deleteTransaction, listIncomeTransactions } from './src/data/financeRepository';
import { deleteHealthEntry, listHealthEntries, saveHealthEntry } from './src/data/healthRepository';
import type { FinanceDraft, FinanceTransaction, HealthDraft, HealthEntry, RecordKind } from './src/data/types';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { HealthScreen } from './src/screens/HealthScreen';
import { colors } from './src/theme/palette';
import type { AppScreen } from './src/voice/commands';
import { add_entry, get_entries, remove_entry } from './app_fucntions/operations';
import type { EntryApiRow } from './app_fucntions/operations';

function mapEntryRows(rows: EntryApiRow[]): FinanceTransaction[] {
  return rows.map(([id, category, amount, date, description, type]) => ({
    id: `api-${id}`,
    source: 'api',
    title: description,
    amount,
    type,
    category,
    date,
    note: '',
  }));
}

function PersonalDevelopmentApp() {
  const database = useSQLiteContext();
  const [screen, setScreen] = useState<AppScreen>('overview');
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);
  const [editorKind, setEditorKind] = useState<RecordKind | null>(null);
  const [editingEntry, setEditingEntry] = useState<FinanceTransaction | HealthEntry | null>(null);
  const currentAppState = useRef(AppState.currentState);

  // Expenses come from the API; income and health entries remain device-local.
  async function refreshRecords() {
    setFinanceLoading(true);
    try {
      const [expenseRows, nextIncomeTransactions, nextHealthEntries] = await Promise.all([
        get_entries(),
        listIncomeTransactions(database),
        listHealthEntries(database),
      ]);
      setTransactions([...nextIncomeTransactions, ...mapEntryRows(expenseRows)].sort((left, right) => right.date.localeCompare(left.date)));
      setHealthEntries(nextHealthEntries);
      setFinanceError(null);
    } catch (error) {
      setFinanceError(error instanceof Error ? error.message : 'Could not load finance data.');
    } finally {
      setFinanceLoading(false);
    }
  }

  useEffect(() => {
    void refreshRecords();
    const subscription = AppState.addEventListener('change', (nextState) => {
      const returnedToForeground = currentAppState.current === 'background' || currentAppState.current === 'inactive';
      currentAppState.current = nextState;
      if (returnedToForeground && nextState === 'active') void refreshRecords();
    });
    return () => subscription.remove();
  }, [database]);

  function openEditor(kind: RecordKind, entry?: FinanceTransaction | HealthEntry) {
    setEditorKind(kind);
    setEditingEntry(entry ?? null);
  }

  async function saveRecord(draft: FinanceDraft | HealthDraft) {
    if (editorKind === 'finance') {
      const financeDraft = draft as FinanceDraft;
      await add_entry(financeDraft.category, financeDraft.amount, financeDraft.date, financeDraft.title, financeDraft.type);
    } else {
      await saveHealthEntry(database, draft as HealthDraft);
    }
    setEditorKind(null);
    setEditingEntry(null);
    await refreshRecords();
  }

  async function removeTransaction(id: string) {
    const entry = transactions.find((transaction) => transaction.id === id);
    if (!entry) return;
    try {
      if (entry.source === 'api') {
        await remove_entry(entry.category, entry.amount, entry.date, entry.title, entry.type);
      } else {
        await deleteTransaction(database, id);
      }
      await refreshRecords();
    } catch (error) {
      setFinanceError(error instanceof Error ? error.message : 'Could not remove transaction.');
    }
  }

  async function removeHealthEntry(id: string) {
    await deleteHealthEntry(database, id);
    await refreshRecords();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {screen === 'overview' ? (
            <DashboardScreen
              transactions={transactions}
              healthEntries={healthEntries}
              onNavigate={setScreen}
              onAddFinance={() => openEditor('finance')}
              onAddHealth={() => openEditor('health')}
            />
          ) : screen === 'finance' ? (
            <FinanceScreen
              transactions={transactions}
              loading={financeLoading}
              loadError={financeError}
              onRefresh={() => void refreshRecords()}
              onAdd={() => openEditor('finance')}
              onEdit={(entry) => openEditor('finance', entry)}
              onDelete={removeTransaction}
            />
          ) : (
            <HealthScreen
              entries={healthEntries}
              onAdd={() => openEditor('health')}
              onEdit={(entry) => openEditor('health', entry)}
              onDelete={removeHealthEntry}
            />
          )}
        </ScrollView>
        <VoiceAssistantButton onNavigate={setScreen} onExpenseAdded={refreshRecords} />
        <BottomNavigation activeScreen={screen} onNavigate={setScreen} />
      </View>
      <RecordEditorModal
        visible={editorKind !== null}
        kind={editorKind ?? 'finance'}
        entry={editingEntry}
        onClose={() => setEditorKind(null)}
        onSave={saveRecord}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="personal-development-kit.db" onInit={initializeDatabase}>
        <PersonalDevelopmentApp />
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  app: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 18, gap: 20 },
});
