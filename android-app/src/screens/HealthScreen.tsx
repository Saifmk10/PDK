// Health view brings together manual tracking, a compact seven-day activity trend, and recent entries.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HealthEntry } from '../data/types';
import { colors, type } from '../theme/palette';

type Props = {
  entries: HealthEntry[];
  onAdd: () => void;
  onEdit: (entry: HealthEntry) => void;
  onDelete: (id: string) => void;
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function HealthScreen({ entries, onAdd, onEdit, onDelete }: Props) {
  const latestSteps = entries.find((entry) => entry.metric === 'steps');
  const stepEntries = entries.filter((entry) => entry.metric === 'steps');
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = dateKey(date);
    return { key, label: date.toLocaleDateString(undefined, { weekday: 'narrow' }), value: stepEntries.find((entry) => entry.date === key)?.value ?? 0 };
  });
  const scale = Math.max(1, ...days.map((day) => day.value));

  return (
    <View style={styles.screen}>
      <View style={styles.headerLine}><Text style={styles.wordmark}>P / D K</Text><Text style={styles.module}>02 — HEALTH</Text></View>
      <View style={styles.headingBlock}>
        <Text style={styles.overline}>SMALL SIGNALS, BIG PICTURE</Text>
        <Text style={styles.title}>Health.</Text>
      </View>
      <View style={styles.hero}>
        <View style={styles.heroTop}><Text style={styles.heroLabel}>LATEST STEP COUNT</Text><Text style={styles.heroMark}>+</Text></View>
        <Text style={styles.heroValue}>{latestSteps ? latestSteps.value.toLocaleString() : '—'}</Text>
        <Text style={styles.heroFoot}>{latestSteps ? `${latestSteps.unit.toUpperCase()} · ${formatDate(latestSteps.date).toUpperCase()}` : 'NO STEP ENTRIES YET'}</Text>
      </View>
      <View style={styles.trendHeader}><Text style={styles.sectionTitle}>Steps / 7 days</Text><Text style={styles.trendUnit}>DAILY</Text></View>
      <View style={styles.chart}>
        {days.map((day) => (
          <View key={day.key} style={styles.barGroup}>
            <View style={styles.barTrack}><View style={[styles.bar, { height: day.value ? `${Math.max(8, (day.value / scale) * 100)}%` : 3 }, day.value ? styles.barFilled : undefined]} /></View>
            <Text style={styles.dayLabel}>{day.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.listHeading}>
        <Text style={styles.sectionTitle}>Entries <Text style={styles.count}>/ {entries.length}</Text></Text>
        <Pressable accessibilityRole="button" onPress={onAdd} style={styles.addButton}><Text style={styles.addMark}>+</Text><Text style={styles.addLabel}>LOG</Text></Pressable>
      </View>
      {entries.length ? entries.map((entry) => (
        <View key={entry.id} style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => onEdit(entry)} style={styles.rowMain}>
            <View style={styles.metricMark}><Text style={styles.metricMarkText}>{entry.metric === 'steps' ? 'S' : entry.metric.charAt(0).toUpperCase()}</Text></View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{entry.metric.toUpperCase()} <Text style={styles.rowDate}>· {formatDate(entry.date)}</Text></Text>
              <Text style={styles.rowNote} numberOfLines={1}>{entry.note || 'Tap to edit entry'}</Text>
            </View>
            <Text style={styles.value}>{entry.value.toLocaleString()} <Text style={styles.unit}>{entry.unit}</Text></Text>
          </Pressable>
          <Pressable accessibilityLabel={`Delete ${entry.metric} entry`} onPress={() => onDelete(entry.id)} style={styles.deleteButton}><Text style={styles.deleteText}>×</Text></Pressable>
        </View>
      )) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Begin anywhere.</Text>
          <Text style={styles.emptyCopy}>Log steps, sleep, water, a workout, or weight. Your entries stay on this device.</Text>
          <Pressable onPress={onAdd} style={styles.emptyAction}><Text style={styles.emptyActionText}>LOG AN ENTRY  +</Text></Pressable>
        </View>
      )}
      <Text style={styles.localNote}>FITBIT IMPORT IS A FUTURE CONNECTION · NOTHING IS SYNCED</Text>
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
  hero: { borderRadius: 8, backgroundColor: colors.red, padding: 18, gap: 8 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: '#FFE6E3', fontFamily: type.mono, fontSize: 9, letterSpacing: 0.7 },
  heroMark: { color: colors.surface, fontSize: 22 },
  heroValue: { color: colors.surface, fontFamily: type.medium, fontSize: 39 },
  heroFoot: { color: '#FFE6E3', fontFamily: type.mono, fontSize: 9 },
  trendHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { color: colors.ink, fontFamily: type.medium, fontSize: 17 },
  trendUnit: { color: colors.muted, fontFamily: type.mono, fontSize: 9 },
  chart: { height: 103, flexDirection: 'row', gap: 9, paddingTop: 4 },
  barGroup: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  barTrack: { height: 76, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '58%', minHeight: 3, borderRadius: 2, backgroundColor: '#D7D7D3' },
  barFilled: { backgroundColor: colors.ink },
  dayLabel: { color: colors.muted, fontFamily: type.mono, fontSize: 9 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  count: { color: colors.muted, fontFamily: type.mono, fontSize: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.ink, borderRadius: 6, paddingHorizontal: 11, minHeight: 34 },
  addMark: { color: colors.surface, fontSize: 20, lineHeight: 23 },
  addLabel: { color: colors.surface, fontFamily: type.mono, fontSize: 9, letterSpacing: 0.5 },
  row: { minHeight: 61, flexDirection: 'row', alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth },
  rowMain: { flex: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 9 },
  metricMark: { width: 30, height: 30, borderRadius: 7, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  metricMarkText: { color: colors.red, fontFamily: type.mono, fontSize: 12 },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.ink, fontFamily: type.medium, fontSize: 11 },
  rowDate: { color: colors.muted, fontFamily: type.regular, fontSize: 11 },
  rowNote: { color: colors.muted, fontFamily: type.regular, fontSize: 10 },
  value: { color: colors.ink, fontFamily: type.mono, fontSize: 12 },
  unit: { color: colors.muted, fontSize: 9 },
  deleteButton: { width: 34, height: 42, alignItems: 'flex-end', justifyContent: 'center' },
  deleteText: { color: colors.muted, fontSize: 22 },
  emptyState: { gap: 9, paddingTop: 16 },
  emptyTitle: { color: colors.ink, fontFamily: type.medium, fontSize: 19 },
  emptyCopy: { maxWidth: 290, color: colors.muted, fontFamily: type.regular, fontSize: 13, lineHeight: 19 },
  emptyAction: { alignSelf: 'flex-start', borderBottomColor: colors.red, borderBottomWidth: 1, paddingBottom: 4, marginTop: 3 },
  emptyActionText: { color: colors.ink, fontFamily: type.mono, fontSize: 10 },
  localNote: { color: colors.muted, fontFamily: type.mono, fontSize: 8, letterSpacing: 0.2, marginTop: 5 },
});