// Finance view summarizes the month and keeps everyday transaction actions close at hand.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FinanceTransaction } from '../data/types';
import { colors, type } from '../theme/palette';

type Props = {
  transactions: FinanceTransaction[];
  onAdd: () => void;
  onEdit: (entry: FinanceTransaction) => void;
  onDelete: (id: string) => void;
};

function currency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount);
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function FinanceScreen({ transactions, onAdd, onEdit, onDelete }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthRecords = transactions.filter((entry) => entry.date.startsWith(currentMonth));
  const income = monthRecords.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = monthRecords.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <View style={styles.screen}>
      <View style={styles.headerLine}><Text style={styles.wordmark}>P / D K</Text><Text style={styles.module}>01 — FINANCE</Text></View>
      <View style={styles.headingBlock}>
        <Text style={styles.overline}>YOUR MONEY, CLEARLY</Text>
        <Text style={styles.title}>Finance.</Text>
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>NET THIS MONTH</Text>
        <Text style={styles.summaryValue}>{currency(income - expenses)}</Text>
        <View style={styles.summaryDetails}>
          <View style={styles.summaryItem}><Text style={styles.summarySmall}>INCOME</Text><Text style={styles.summaryNumber}>{currency(income)}</Text></View>
          <View style={styles.summarySeparator} />
          <View style={styles.summaryItem}><Text style={styles.summarySmall}>SPENDING</Text><Text style={styles.summaryNumber}>{currency(expenses)}</Text></View>
        </View>
      </View>
      <View style={styles.listHeading}>
        <Text style={styles.sectionTitle}>Transactions <Text style={styles.count}>/ {transactions.length}</Text></Text>
        <Pressable accessibilityRole="button" onPress={onAdd} style={styles.addButton}><Text style={styles.addMark}>+</Text><Text style={styles.addLabel}>ADD</Text></Pressable>
      </View>
      {transactions.length ? transactions.map((entry) => (
        <View key={entry.id} style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => onEdit(entry)} style={styles.rowMain}>
            <View style={[styles.rowSignal, entry.type === 'income' && styles.rowSignalIncome]} />
            <View style={styles.rowCopy}>
              <Text numberOfLines={1} style={styles.rowTitle}>{entry.title}</Text>
              <Text style={styles.rowMeta}>{entry.category.toUpperCase()} · {formatDate(entry.date)}</Text>
            </View>
            <Text style={[styles.amount, entry.type === 'income' && styles.income]}>{entry.type === 'income' ? '+' : '−'}{currency(entry.amount)}</Text>
          </Pressable>
          <Pressable accessibilityLabel={`Delete ${entry.title}`} onPress={() => onDelete(entry.id)} style={styles.deleteButton}><Text style={styles.deleteText}>×</Text></Pressable>
        </View>
      )) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyMark}>—</Text>
          <Text style={styles.emptyTitle}>A clean slate.</Text>
          <Text style={styles.emptyCopy}>Add your first transaction to see your month take shape.</Text>
          <Pressable onPress={onAdd} style={styles.emptyAction}><Text style={styles.emptyActionText}>ADD TRANSACTION  +</Text></Pressable>
        </View>
      )}
      <Text style={styles.localNote}>STORED ON THIS DEVICE · API CONNECTIONS COMING LATER</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 17 },
  headerLine: { flexDirection: 'row', justifyContent: 'space-between' },
  wordmark: { color: colors.ink, fontFamily: type.mono, fontSize: 12, letterSpacing: 1 },
  module: { color: colors.muted, fontFamily: type.mono, fontSize: 9 },
  headingBlock: { paddingTop: 15, paddingBottom: 4 },
  overline: { color: colors.muted, fontFamily: type.mono, fontSize: 10, letterSpacing: 1 },
  title: { color: colors.ink, fontFamily: type.medium, fontSize: 38, marginTop: 5 },
  summary: { backgroundColor: colors.ink, borderRadius: 8, padding: 18, gap: 12 },
  summaryLabel: { color: '#A5A5A0', fontFamily: type.mono, fontSize: 9, letterSpacing: 0.8 },
  summaryValue: { color: colors.surface, fontFamily: type.medium, fontSize: 31 },
  summaryDetails: { flexDirection: 'row', alignItems: 'center', borderTopColor: '#383838', borderTopWidth: 1, paddingTop: 12, gap: 20 },
  summaryItem: { gap: 4 },
  summarySmall: { color: '#888883', fontFamily: type.mono, fontSize: 9 },
  summaryNumber: { color: colors.surface, fontFamily: type.medium, fontSize: 14 },
  summarySeparator: { width: 1, height: 28, backgroundColor: '#444' },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { color: colors.ink, fontFamily: type.medium, fontSize: 18 },
  count: { color: colors.muted, fontFamily: type.mono, fontSize: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.red, borderRadius: 6, paddingHorizontal: 11, minHeight: 34 },
  addMark: { color: colors.surface, fontSize: 20, lineHeight: 23 },
  addLabel: { color: colors.surface, fontFamily: type.mono, fontSize: 9, letterSpacing: 0.5 },
  row: { minHeight: 61, flexDirection: 'row', alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth },
  rowMain: { flex: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowSignal: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.red },
  rowSignalIncome: { backgroundColor: colors.green },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.ink, fontFamily: type.medium, fontSize: 13 },
  rowMeta: { color: colors.muted, fontFamily: type.mono, fontSize: 9 },
  amount: { color: colors.ink, fontFamily: type.mono, fontSize: 12 },
  income: { color: colors.green },
  deleteButton: { width: 36, height: 42, alignItems: 'flex-end', justifyContent: 'center' },
  deleteText: { color: colors.muted, fontSize: 22 },
  emptyState: { alignItems: 'flex-start', paddingTop: 25, paddingBottom: 18, gap: 9 },
  emptyMark: { color: colors.red, fontFamily: type.mono, fontSize: 24 },
  emptyTitle: { color: colors.ink, fontFamily: type.medium, fontSize: 20 },
  emptyCopy: { maxWidth: 270, color: colors.muted, fontFamily: type.regular, fontSize: 13, lineHeight: 19 },
  emptyAction: { borderBottomColor: colors.red, borderBottomWidth: 1, paddingBottom: 4, marginTop: 5 },
  emptyActionText: { color: colors.ink, fontFamily: type.mono, fontSize: 10 },
  localNote: { color: colors.muted, fontFamily: type.mono, fontSize: 8, letterSpacing: 0.3, marginTop: 7 },
});