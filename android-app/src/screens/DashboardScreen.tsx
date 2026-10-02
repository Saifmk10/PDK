// Overview combines the latest finance and health signals without hiding the details one tap away.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FinanceTransaction, HealthEntry } from '../data/types';
import { colors, type } from '../theme/palette';
import type { AppScreen } from '../voice/commands';

type Props = {
  transactions: FinanceTransaction[];
  healthEntries: HealthEntry[];
  onNavigate: (screen: AppScreen) => void;
  onAddFinance: () => void;
  onAddHealth: () => void;
};

function currency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function DashboardScreen({ transactions, healthEntries, onNavigate, onAddFinance, onAddHealth }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const monthTransactions = transactions.filter((item) => item.date.startsWith(currentMonth));
  const income = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const spend = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const todaySteps = healthEntries.find((item) => item.metric === 'steps' && item.date === today);
  const latestHealth = healthEntries[0];
  const latestTransactions = transactions.slice(0, 3);

  return (
    <View style={styles.screen}>
      <View style={styles.topline}>
        <Text style={styles.wordmark}>P / D K</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</Text>
      </View>
      <View style={styles.intro}>
        <Text style={styles.overline}>YOUR PERSONAL SYSTEM</Text>
        <Text style={styles.title}>Make today{ '\n' }count.</Text>
        <View style={styles.redRule} />
      </View>

      <Pressable onPress={() => onNavigate('finance')} style={styles.feature}>
        <View style={styles.featureTop}>
          <Text style={styles.featureLabel}>MONEY / THIS MONTH</Text>
          <Text style={styles.featureArrow}>↗</Text>
        </View>
        <Text style={styles.featureValue}>{currency(income - spend)}</Text>
        <View style={styles.moneyRow}>
          <View><Text style={styles.minorLabel}>IN</Text><Text style={styles.minorValue}>{currency(income)}</Text></View>
          <View style={styles.featureDivider} />
          <View><Text style={styles.minorLabel}>OUT</Text><Text style={styles.minorValue}>{currency(spend)}</Text></View>
          <Pressable accessibilityRole="button" onPress={(event) => { event.stopPropagation(); onAddFinance(); }} style={styles.addLight}><Text style={styles.addLightText}>+</Text></Pressable>
        </View>
      </Pressable>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Body</Text>
        <Pressable onPress={() => onNavigate('health')}><Text style={styles.textLink}>VIEW HEALTH ↗</Text></Pressable>
      </View>
      <Pressable onPress={() => onNavigate('health')} style={styles.healthRow}>
        <View style={styles.healthMark}><Text style={styles.healthMarkText}>+</Text></View>
        <View style={styles.healthCopy}>
          <Text style={styles.healthValue}>{todaySteps ? `${todaySteps.value.toLocaleString()} ${todaySteps.unit}` : latestHealth ? `${latestHealth.value} ${latestHealth.unit}` : 'Start with one entry'}</Text>
          <Text style={styles.healthCaption}>{todaySteps ? 'TODAY’S STEPS' : latestHealth ? `${latestHealth.metric.toUpperCase()} · ${formatDate(latestHealth.date)}` : 'HEALTH TRACKING'}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={(event) => { event.stopPropagation(); onAddHealth(); }} style={styles.addDark}><Text style={styles.addDarkText}>+</Text></Pressable>
      </Pressable>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <Pressable onPress={() => onNavigate('finance')}><Text style={styles.textLink}>ALL ACTIVITY ↗</Text></Pressable>
      </View>
      {latestTransactions.length ? latestTransactions.map((transaction) => (
        <View key={transaction.id} style={styles.activityRow}>
          <View style={styles.activityDot} />
          <View style={styles.activityCopy}>
            <Text numberOfLines={1} style={styles.activityTitle}>{transaction.title}</Text>
            <Text style={styles.activityMeta}>{transaction.category.toUpperCase()} · {formatDate(transaction.date)}</Text>
          </View>
          <Text style={[styles.activityAmount, transaction.type === 'income' && styles.income]}>{transaction.type === 'income' ? '+' : '−'}{currency(transaction.amount)}</Text>
        </View>
      )) : (
        <View style={styles.emptyLine}><Text style={styles.emptyText}>Your entries will live here.</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { color: colors.ink, fontFamily: type.mono, fontSize: 12, letterSpacing: 1 },
  date: { color: colors.muted, fontFamily: type.mono, fontSize: 9, letterSpacing: 0.5 },
  intro: { paddingTop: 16, paddingBottom: 2 },
  overline: { color: colors.muted, fontFamily: type.mono, fontSize: 10, letterSpacing: 1 },
  title: { color: colors.ink, fontFamily: type.medium, fontSize: 38, lineHeight: 42, marginTop: 8 },
  redRule: { width: 31, height: 3, backgroundColor: colors.red, marginTop: 16 },
  feature: { backgroundColor: colors.ink, borderRadius: 8, padding: 18, gap: 15 },
  featureTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featureLabel: { color: '#B8B8B3', fontFamily: type.mono, fontSize: 9, letterSpacing: 1 },
  featureArrow: { color: colors.red, fontSize: 18 },
  featureValue: { color: colors.surface, fontFamily: type.medium, fontSize: 32 },
  moneyRow: { borderTopColor: '#383838', borderTopWidth: 1, paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 22 },
  minorLabel: { color: '#888883', fontFamily: type.mono, fontSize: 9, marginBottom: 4 },
  minorValue: { color: colors.surface, fontFamily: type.medium, fontSize: 14 },
  featureDivider: { width: 1, height: 26, backgroundColor: '#3D3D3D' },
  addLight: { marginLeft: 'auto', width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  addLightText: { color: colors.ink, fontSize: 24, lineHeight: 27 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 3 },
  sectionTitle: { color: colors.ink, fontFamily: type.medium, fontSize: 18 },
  textLink: { color: colors.muted, fontFamily: type.mono, fontSize: 9, letterSpacing: 0.3 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopColor: colors.line, borderTopWidth: 1, borderBottomColor: colors.line, borderBottomWidth: 1 },
  healthMark: { width: 38, height: 38, borderRadius: 8, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  healthMarkText: { color: colors.surface, fontSize: 24, lineHeight: 26 },
  healthCopy: { flex: 1, gap: 3 },
  healthValue: { color: colors.ink, fontFamily: type.medium, fontSize: 16 },
  healthCaption: { color: colors.muted, fontFamily: type.mono, fontSize: 9, letterSpacing: 0.3 },
  addDark: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  addDarkText: { color: colors.surface, fontSize: 22, lineHeight: 25 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 46, borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth },
  activityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red },
  activityCopy: { flex: 1, gap: 3 },
  activityTitle: { color: colors.ink, fontFamily: type.medium, fontSize: 13 },
  activityMeta: { color: colors.muted, fontFamily: type.mono, fontSize: 9 },
  activityAmount: { color: colors.ink, fontFamily: type.mono, fontSize: 12 },
  income: { color: colors.green },
  emptyLine: { borderTopColor: colors.line, borderTopWidth: 1, paddingVertical: 15 },
  emptyText: { color: colors.muted, fontFamily: type.regular, fontSize: 13 },
});