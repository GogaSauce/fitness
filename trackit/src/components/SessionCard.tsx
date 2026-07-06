import { Text, View } from 'react-native';

import { ACTIVITY_COLORS, type ParsedExercise, type Session } from '@/lib/types';

function exerciseLine(ex: ParsedExercise): string {
  const parts: string[] = [];
  if (ex.sets && ex.reps) parts.push(`${ex.sets}×${ex.reps}`);
  else if (ex.sets) parts.push(`${ex.sets} sets`);
  if (ex.weight_lbs) parts.push(`@ ${ex.weight_lbs} lbs`);
  if (!parts.length && ex.duration_minutes) parts.push(`${ex.duration_minutes} min`);
  return parts.length ? `${ex.name} • ${parts.join(' ')}` : ex.name;
}

export default function SessionCard({ session }: { session: Session }) {
  const parsed = session.parsed_data;
  const type = session.activity_type ?? parsed?.activity_type ?? 'gym';
  const accent = ACTIVITY_COLORS[type] ?? ACTIVITY_COLORS.gym;

  return (
    <View
      className="mb-3 rounded-xl bg-card p-4"
      style={{ borderLeftWidth: 4, borderLeftColor: accent }}
    >
      <Text
        className="text-xs font-bold uppercase tracking-wider"
        style={{ color: accent }}
      >
        {type}
      </Text>

      <Text className="mt-2 text-base font-medium text-white">
        {parsed?.summary ?? session.raw_input ?? 'Logged session'}
      </Text>

      {type === 'gym' && parsed?.exercises && parsed.exercises.length > 0 && (
        <View className="mt-3">
          {parsed.exercises.map((ex, i) => (
            <Text key={i} className="mt-1 text-sm text-secondary">
              {exerciseLine(ex)}
            </Text>
          ))}
        </View>
      )}

      {type !== 'gym' && parsed?.sport_or_activity && (
        <Text className="mt-3 text-sm text-secondary">
          {parsed.sport_or_activity}
          {parsed.total_duration_minutes
            ? ` • ${parsed.total_duration_minutes} min`
            : ''}
        </Text>
      )}

      {parsed?.perceived_effort != null && (
        <Text className="mt-3 self-end text-xs text-secondary">
          Effort: {parsed.perceived_effort}/10
        </Text>
      )}
    </View>
  );
}
