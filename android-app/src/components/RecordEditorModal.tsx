// One editor handles create and update flows for both independent local ledgers.
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { FinanceDraft, FinanceTransaction, HealthDraft, HealthEntry, HealthMetric, RecordKind, TransactionType } from '../data/types';
import { colors, type } from '../theme/palette';

type Props = {
  visible: boolean;
  kind: RecordKind;
  entry: FinanceTransaction | HealthEntry | null;
  onClose: () => void;
  onSave: (draft: FinanceDraft | HealthDraft) => Promise<void>;
};

const categories = ['Food', 'Home', 'Transport', 'Health', 'Shopping', 'Other'];
const metrics: { value: HealthMetric; label: string; unit: string }[] = [
  { value: 'steps', label: 'Steps', unit: 'steps' },
  { value: 'sleep', label: 'Sleep', unit: 'hr' },
  { value: 'water', label: 'Water', unit: 'ml' },
  { value: 'workout', label: 'Workout', unit: 'min' },
  { value: 'weight', label: 'Weight', unit: 'kg' },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function RecordEditorModal({ visible, kind, entry, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Other');
  const [metric, setMetric] = useState<HealthMetric>('steps');
  const [unit, setUnit] = useState('steps');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset fields each time the sheet opens, including when switching between edit targets.
  useEffect(() => {
    if (!visible) return;
    if (kind === 'finance' && entry && 'type' in entry) {
      setTitle(entry.title);
      setAmount(String(entry.amount));
      setTransactionType(entry.type);
      setCategory(entry.category);
      setDate(entry.date);
      setNote(entry.note);
    } else if (kind === 'health' && entry && 'metric' in entry) {
      setMetric(entry.metric);
      setUnit(entry.unit);
      setAmount(String(entry.value));
      setDate(entry.date);
      setNote(entry.note);
    } else {
      setTitle('');
      setAmount('');
      setTransactionType('expense');
      setCategory('Other');
      setMetric('steps');
      setUnit('steps');
      setDate(today());
      setNote('');
    }
  }, [entry, kind, visible]);

  async function submit() {
    const numericValue = Number(amount.replace(/,/g, '').trim());
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      Alert.alert('Check the amount', 'Enter a number greater than zero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Check the date', 'Use the YYYY-MM-DD format.');
      return;
    }
    setSaving(true);
    try {
      if (kind === 'finance') {
        if (!title.trim()) {
          Alert.alert('Add a description', 'Give this transaction a short name.');
          return;
        }
        const draft: FinanceDraft = {
          ...(entry && 'type' in entry ? { id: entry.id } : {}),
          title: title.trim(), amount: numericValue, type: transactionType,
          category, date, note: note.trim(),
        };
        await onSave(draft);
      } else {
        const draft: HealthDraft = {
          ...(entry && 'metric' in entry ? { id: entry.id } : {}),
          metric, value: numericValue, unit, date, note: note.trim(),
        };
        await onSave(draft);
      }
    } finally {
      setSaving(false);
    }
  }

  function chooseMetric(nextMetric: HealthMetric) {
    setMetric(nextMetric);
    setUnit(metrics.find((option) => option.value === nextMetric)?.unit ?? '');
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable accessibilityLabel="Close editor" onPress={onClose} style={styles.scrim} />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.headingRow}>
            <View>
              <Text style={styles.eyebrow}>{entry ? 'UPDATE RECORD' : 'NEW RECORD'}</Text>
              <Text style={styles.heading}>{kind === 'finance' ? 'Transaction' : 'Health entry'}</Text>
            </View>
            <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {kind === 'finance' ? (
              <>
                <View style={styles.segment}>
                  {(['expense', 'income'] as const).map((option) => (
                    <Pressable key={option} onPress={() => setTransactionType(option)} style={[styles.segmentItem, transactionType === option && styles.segmentActive]}>
                      <Text style={[styles.segmentText, transactionType === option && styles.segmentTextActive]}>{option.toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </View>
                <Field label="DESCRIPTION" value={title} onChangeText={setTitle} placeholder="e.g. Weekly groceries" />
                <Field label="AMOUNT" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" prefix="$" />
                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <View style={styles.options}>
                  {categories.map((option) => <Option key={option} label={option} selected={category === option} onPress={() => setCategory(option)} />)}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>MEASURE</Text>
                <View style={styles.options}>
                  {metrics.map((option) => <Option key={option.value} label={option.label} selected={metric === option.value} onPress={() => chooseMetric(option.value)} />)}
                </View>
                <Field label={`VALUE · ${unit.toUpperCase()}`} value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" />
              </>
            )}
            <Field label="DATE · YYYY-MM-DD" value={date} onChangeText={setDate} placeholder={today()} />
            <Field label="NOTE · OPTIONAL" value={note} onChangeText={setNote} placeholder="Add a little context" />
            <Pressable disabled={saving} onPress={() => void submit()} style={[styles.saveButton, saving && styles.saveDisabled]}>
              <Text style={styles.saveText}>{saving ? 'SAVING…' : 'SAVE RECORD'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  prefix?: string;
};

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', prefix }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputFrame}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={value}
        />
      </View>
    </View>
  );
}

type OptionProps = { label: string; selected: boolean; onPress: () => void };

function Option({ label, selected, onPress }: OptionProps) {
  return (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.42)' },
  sheet: { maxHeight: '92%', backgroundColor: colors.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 28 },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#B8B8B2', marginBottom: 22 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  eyebrow: { color: colors.red, fontFamily: type.mono, fontSize: 10, letterSpacing: 1 },
  heading: { color: colors.ink, fontFamily: type.medium, fontSize: 25, marginTop: 4 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.ink, fontSize: 25, lineHeight: 28 },
  segment: { flexDirection: 'row', backgroundColor: '#E2E2DE', borderRadius: 8, padding: 3, marginBottom: 18 },
  segmentItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 38, borderRadius: 6 },
  segmentActive: { backgroundColor: colors.ink },
  segmentText: { color: colors.muted, fontFamily: type.mono, fontSize: 10 },
  segmentTextActive: { color: colors.surface },
  fieldWrap: { marginBottom: 15 },
  fieldLabel: { color: colors.muted, fontFamily: type.mono, fontSize: 10, letterSpacing: 0.5, marginBottom: 7 },
  inputFrame: { minHeight: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 7, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  input: { flex: 1, minHeight: 46, color: colors.ink, fontFamily: type.regular, fontSize: 15, paddingVertical: 10 },
  prefix: { color: colors.muted, fontFamily: type.medium, fontSize: 16, marginRight: 7 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 15 },
  option: { minHeight: 34, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', backgroundColor: colors.surface },
  optionSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  optionText: { color: colors.muted, fontFamily: type.medium, fontSize: 12 },
  optionTextSelected: { color: colors.surface },
  saveButton: { minHeight: 50, backgroundColor: colors.red, borderRadius: 7, justifyContent: 'center', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: colors.surface, fontFamily: type.mono, fontSize: 12, letterSpacing: 1 },
});