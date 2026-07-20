import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CalendarView from '@/components/CalendarView';
import DayModal from '@/components/DayModal';
import StreakDisplay from '@/components/StreakDisplay';
import Toast from '@/components/Toast';
import { isGuest } from '@/lib/auth';
import { todayString } from '@/lib/dates';
import { syncStreakReminder } from '@/lib/notifications';
import {
  computeWeeklySummary,
  fetchAllSessionDates,
  fetchStreak,
} from '@/lib/sessions';
import { supabase } from '@/lib/supabase';
import type { Streak, WeeklySummary } from '@/lib/types';

const GUEST_BANNER_THRESHOLD = 3;

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [weekly, setWeekly] = useState<WeeklySummary>({
    gym: 0,
    sport: 0,
    cardio: 0,
  });
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [guest, setGuest] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [streakRow, rows, { data: userData }] = await Promise.all([
        fetchStreak(),
        fetchAllSessionDates(),
        supabase.auth.getUser(),
      ]);
      setStreak(streakRow);
      setWeekly(computeWeeklySummary(rows));
      setLoggedDates(new Set(rows.map((r) => r.date)));
      setSessionCount(rows.length);
      setGuest(isGuest(userData.user));
    } catch (e) {
      console.warn('Failed to load home data', e);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Keep the banner in sync if the guest upgrades their account elsewhere.
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const showGuestBanner = guest && sessionCount >= GUEST_BANNER_THRESHOLD;

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

        {showGuestBanner && (
          <TouchableOpacity
            onPress={() => router.push('/signup')}
            className="mb-4 flex-row items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-3"
          >
            <Text className="flex-1 pr-2 text-sm font-semibold text-white">
              Save your streak forever — create a free account
            </Text>
            <Text className="text-lg font-bold text-primary">→</Text>
          </TouchableOpacity>
        )}

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
