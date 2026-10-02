// The app shell owns screen navigation, local data refresh, and the shared record editor.
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation } from './src/components/BottomNavigation';
import { RecordEditorModal } from './src/components/RecordEditorModal';
import { VoiceAssistantButton } from './src/components/VoiceAssistantButton';
import { initializeDatabase } from './src/data/database';
import { deleteTransaction, listTransactions, saveTransaction } from './src/data/financeRepository';
import { deleteHealthEntry, listHealthEntries, saveHealthEntry } from './src/data/healthRepository';
import type { FinanceDraft, FinanceTransaction, HealthDraft, HealthEntry, RecordKind } from './src/data/types';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { HealthScreen } from './src/screens/HealthScreen';
import { colors } from './src/theme/palette';
import type { AppScreen } from './src/voice/commands';

function PersonalDevelopmentApp() {
  const database = useSQLiteContext();
  const [screen, setScreen] = useState<AppScreen>('overview');
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);
  const [editorKind, setEditorKind] = useState<RecordKind | null>(null);
  const [editingEntry, setEditingEntry] = useState<FinanceTransaction | HealthEntry | null>(null);

  // Refresh both local ledgers after every successful mutation so every screen stays in sync.
  async function refreshRecords() {
    const [nextTransactions, nextHealthEntries] = await Promise.all([
      listTransactions(database),
      listHealthEntries(database),
    ]);
    setTransactions(nextTransactions);
    setHealthEntries(nextHealthEntries);
  }

  useEffect(() => {
    void refreshRecords();
  }, [database]);

  function openEditor(kind: RecordKind, entry?: FinanceTransaction | HealthEntry) {
    setEditorKind(kind);
    setEditingEntry(entry ?? null);
  }

  async function saveRecord(draft: FinanceDraft | HealthDraft) {
    if (editorKind === 'finance') {
      await saveTransaction(database, draft as FinanceDraft);
    } else {
      await saveHealthEntry(database, draft as HealthDraft);
    }
    setEditorKind(null);
    setEditingEntry(null);
    await refreshRecords();
  }

  async function removeTransaction(id: string) {
    await deleteTransaction(database, id);
    await refreshRecords();
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
        <VoiceAssistantButton onNavigate={setScreen} />
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
