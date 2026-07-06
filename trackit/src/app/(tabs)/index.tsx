import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CalendarView from '@/components/CalendarView';
import DayModal from '@/components/DayModal';
import StreakDisplay from '@/components/StreakDisplay';
import Toast from '@/components/Toast';
import { todayString } from '@/lib/dates';
import { syncStreakReminder } from '@/lib/notifications';
import {
  computeWeeklySummary,
  fetchAllSessionDates,
  fetchStreak,
} from '@/lib/sessions';
import type { Streak, WeeklySummary } from '@/lib/types';

export default function Home() {
  const insets = useSafeAreaInsets();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [weekly, setWeekly] = useState<WeeklySummary>({
    gym: 0,
    sport: 0,
    cardio: 0,
  });
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [streakRow, rows] = await Promise.all([
        fetchStreak(),
        fetchAllSessionDates(),
      ]);
      setStreak(streakRow);
      setWeekly(computeWeeklySummary(rows));
      setLoggedDates(new Set(rows.map((r) => r.date)));
    } catch (e) {
      console.warn('Failed to load home data', e);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSessionLogged = useCallback(() => {
    setSelectedDate(null);
    setToastVisible(true);
    refresh();
    syncStreakReminder(true).catch(() => {});
  }, [refresh]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerClassName="px-4 pb-8">
        <Text className="mb-2 mt-4 text-2xl font-black text-white">
          Track<Text className="text-primary">It</Text>
        </Text>

        <StreakDisplay streak={streak} weekly={weekly} />

        <Text className="mb-3 mt-8 text-lg font-semibold text-white">
          Consistency
        </Text>
        <CalendarView
          loggedDates={loggedDates}
          onDayPress={(date) => {
            if (date <= todayString()) setSelectedDate(date);
          }}
        />
      </ScrollView>

      <DayModal
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
        onLogged={onSessionLogged}
      />
      <Toast
        visible={toastVisible}
        message="Session logged ✓"
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}
