import { Text, View } from 'react-native';

import type { Streak, WeeklySummary } from '@/lib/types';

interface Props {
  streak: Streak | null;
  weekly: WeeklySummary;
}

export default function StreakDisplay({ streak, weekly }: Props) {
  const count = streak?.current_streak ?? 0;

  return (
    <View className="items-center rounded-2xl bg-card px-4 py-8">
      {count > 0 ? (
        <>
          <Text className="text-7xl font-black text-primary">{count}</Text>
          <Text className="mt-1 text-base text-secondary">
            day streak{count >= 7 ? ' 🔥' : ''}
          </Text>
        </>
      ) : (
        <Text className="py-4 text-center text-2xl font-black text-primary">
          Start your streak today
        </Text>
      )}
      <Text className="mt-4 text-base text-secondary">
        This week:{' '}
        <Text className="font-semibold text-white">{weekly.gym} gym</Text> ·{' '}
        <Text className="font-semibold text-white">{weekly.sport} sport</Text> ·{' '}
        <Text className="font-semibold text-white">{weekly.cardio} cardio</Text>
      </Text>
      {streak && streak.longest_streak > count && (
        <Text className="mt-1 text-xs text-secondary">
          Longest: {streak.longest_streak} days
        </Text>
      )}
    </View>
  );
}
