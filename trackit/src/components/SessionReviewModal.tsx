import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDateHeader } from '@/lib/dates';
import { saveParsedSession } from '@/lib/sessions';
import {
  ACTIVITY_COLORS,
  COLORS,
  type ActivityType,
  type ParsedSession,
} from '@/lib/types';

const MUTED = '#6b7280';
const ACTIVITY_TYPES: ActivityType[] = ['gym', 'sport', 'cardio'];

const EFFORT_LABELS: Record<number, string> = {
  1: 'Very easy',
  2: 'Very easy',
  3: 'Easy',
  4: 'Easy',
  5: 'Moderate',
  6: 'Moderate',
  7: 'Hard',
  8: 'Hard',
  9: 'Very hard',
  10: 'Max effort',
};

interface EditExercise {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  duration_minutes: number | null;
  notes: string | null;
}

interface Props {
  date: string | null;
  rawText: string;
  parsed: ParsedSession | null; // visible when non-null
  notice?: string | null; // shown when the AI parse was skipped/failed
  onDiscard: () => void;
  onSaved: () => void;
}

function numOrNull(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export default function SessionReviewModal({
  date,
  rawText,
  parsed,
  notice,
  onDiscard,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const [activityType, setActivityType] = useState<ActivityType>('gym');
  const [summary, setSummary] = useState('');
  const [exercises, setExercises] = useState<EditExercise[]>([]);
  const [sportName, setSportName] = useState('');
  const [sportDuration, setSportDuration] = useState('');
  const [effort, setEffort] = useState(7);
  const [saving, setSaving] = useState(false);

  // Seed the editable fields whenever a fresh parse comes in.
  useEffect(() => {
    if (!parsed) return;
    setActivityType(parsed.activity_type);
    setSummary(parsed.summary);
    setExercises(
      parsed.exercises.map((ex) => ({
        name: ex.name ?? '',
        sets: ex.sets?.toString() ?? '',
        reps: ex.reps?.toString() ?? '',
        weight: ex.weight_lbs?.toString() ?? '',
        duration_minutes: ex.duration_minutes,
        notes: ex.notes,
      })),
    );
    setSportName(parsed.sport_or_activity ?? '');
    setSportDuration(parsed.total_duration_minutes?.toString() ?? '');
    setEffort(parsed.perceived_effort ?? 7);
  }, [parsed]);

  const isGym = activityType === 'gym';

  const updateExercise = (i: number, field: keyof EditExercise, value: string) => {
    setExercises((prev) => {
      const next = prev.slice();
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };
  const removeExercise = (i: number) =>
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  const addExercise = () =>
    setExercises((prev) => [
      ...prev,
      { name: '', sets: '', reps: '', weight: '', duration_minutes: null, notes: null },
    ]);

  const confirm = async () => {
    if (!date || !parsed) return;
    const edited: ParsedSession = {
      activity_type: activityType,
      summary: summary.trim(),
      exercises: isGym
        ? exercises.map((e) => ({
            name: e.name.trim(),
            sets: numOrNull(e.sets),
            reps: numOrNull(e.reps),
            weight_lbs: numOrNull(e.weight),
            duration_minutes: e.duration_minutes,
            notes: e.notes,
          }))
        : [],
      total_duration_minutes: isGym
        ? parsed.total_duration_minutes
        : numOrNull(sportDuration),
      perceived_effort: effort,
      sport_or_activity: isGym ? null : sportName.trim() || null,
    };
    setSaving(true);
    try {
      await saveParsedSession(date, rawText, edited);
      onSaved();
    } catch (e) {
      Alert.alert(
        "Couldn't save session",
        e instanceof Error ? e.message : 'Something went wrong. Try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={parsed !== null}
      animationType="slide"
      onRequestClose={onDiscard}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 10,
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: COLORS.textSecondary,
              }}
            >
              Review & confirm
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontSize: 19,
                fontWeight: '800',
                color: '#fff',
              }}
            >
              {date ? formatDateHeader(date) : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDiscard}
            hitSlop={10}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: COLORS.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {notice ? (
            <View
              style={{
                marginTop: 6,
                marginBottom: 10,
                padding: 12,
                borderRadius: 12,
                backgroundColor: `${COLORS.primary}18`,
                borderWidth: 1,
                borderColor: `${COLORS.primary}55`,
              }}
            >
              <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600' }}>
                {notice}
              </Text>
            </View>
          ) : null}

          {/* What you said */}
          <View
            style={{
              marginTop: 6,
              marginBottom: 16,
              padding: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Label color={MUTED} style={{ marginBottom: 4 }}>
              What you said
            </Label>
            <Text
              style={{
                fontSize: 13,
                lineHeight: 20,
                color: COLORS.textSecondary,
                fontStyle: 'italic',
              }}
            >
              "{rawText}"
            </Text>
          </View>

          {/* Activity type */}
          <Label style={{ marginBottom: 8 }}>Activity type</Label>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            {ACTIVITY_TYPES.map((t) => {
              const active = activityType === t;
              const color = ACTIVITY_COLORS[t];
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setActivityType(t)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? color : COLORS.border,
                    backgroundColor: active ? `${color}22` : 'transparent',
                  }}
                >
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      backgroundColor: color,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: active ? color : COLORS.textSecondary,
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Summary */}
          <Label style={{ marginBottom: 8 }}>Summary</Label>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            multiline
            textAlignVertical="top"
            style={{
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 12,
              padding: 12,
              paddingHorizontal: 14,
              color: '#fff',
              fontSize: 15,
              lineHeight: 21,
              minHeight: 64,
              marginBottom: 20,
            }}
          />

          {isGym ? (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <Label>Exercises</Label>
                <TouchableOpacity onPress={addExercise} hitSlop={8}>
                  <Text
                    style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}
                  >
                    + Add
                  </Text>
                </TouchableOpacity>
              </View>

              {exercises.map((ex, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: COLORS.card,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderLeftWidth: 3,
                    borderLeftColor: COLORS.primary,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <TextInput
                      value={ex.name}
                      onChangeText={(v) => updateExercise(i, 'name', v)}
                      placeholder="Exercise name"
                      placeholderTextColor={MUTED}
                      style={{
                        flex: 1,
                        borderBottomWidth: 1,
                        borderBottomColor: COLORS.border,
                        paddingVertical: 4,
                        paddingHorizontal: 2,
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: '600',
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => removeExercise(i)}
                      hitSlop={8}
                    >
                      <Text style={{ color: MUTED, fontSize: 16 }}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <NumberField
                      label="Sets"
                      value={ex.sets}
                      onChangeText={(v) => updateExercise(i, 'sets', v)}
                    />
                    <NumberField
                      label="Reps"
                      value={ex.reps}
                      onChangeText={(v) => updateExercise(i, 'reps', v)}
                    />
                    <NumberField
                      label="Lbs"
                      value={ex.weight}
                      onChangeText={(v) => updateExercise(i, 'weight', v)}
                    />
                  </View>
                </View>
              ))}
              <View style={{ height: 8 }} />
            </>
          ) : (
            <>
              <Label style={{ marginBottom: 8 }}>Details</Label>
              <View
                style={{
                  backgroundColor: COLORS.card,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 12,
                  padding: 12,
                  paddingHorizontal: 14,
                  marginBottom: 20,
                  gap: 10,
                }}
              >
                <UnderlineField
                  label="Activity"
                  value={sportName}
                  onChangeText={setSportName}
                />
                <UnderlineField
                  label="Duration (min)"
                  value={sportDuration}
                  onChangeText={setSportDuration}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          {/* Perceived effort */}
          <Label style={{ marginBottom: 8 }}>Perceived effort</Label>
          <View
            style={{
              flexDirection: 'row',
              gap: 6,
              marginBottom: 8,
            }}
          >
            {Array.from({ length: 10 }, (_, idx) => idx + 1).map((n) => {
              const active = n === effort;
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => setEffort(n)}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: active ? COLORS.primary : COLORS.border,
                    backgroundColor: active ? COLORS.primary : COLORS.card,
                  }}
                >
                  <Text
                    style={{
                      color: active ? '#fff' : COLORS.textSecondary,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={{ fontSize: 12, color: MUTED }}>
            {effort}/10 · {EFFORT_LABELS[effort]}
          </Text>
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            backgroundColor: COLORS.background,
          }}
        >
          <TouchableOpacity
            onPress={onDiscard}
            disabled={saving}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
            }}
          >
            <Text
              style={{ color: COLORS.textSecondary, fontSize: 15, fontWeight: '700' }}
            >
              Discard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirm}
            disabled={saving}
            style={{
              flex: 2,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: COLORS.primary,
              alignItems: 'center',
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                Confirm & Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Label({
  children,
  color = COLORS.textSecondary,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: object;
}) {
  return (
    <Text
      style={[
        {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function NumberField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={{ flex: 1, gap: 3 }}>
      <Text
        style={{
          fontSize: 10,
          color: MUTED,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={{
          backgroundColor: COLORS.background,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 8,
          paddingVertical: 7,
          paddingHorizontal: 8,
          color: '#fff',
          fontSize: 14,
        }}
      />
    </View>
  );
}

function UnderlineField({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'numeric';
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text
        style={{
          fontSize: 10,
          color: MUTED,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          paddingVertical: 4,
          paddingHorizontal: 2,
          color: '#fff',
          fontSize: 15,
          fontWeight: '600',
        }}
      />
    </View>
  );
}
