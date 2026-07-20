import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isGuest } from '@/lib/auth';
import { todayString } from '@/lib/dates';
import {
  getReminderTime,
  setReminderTime,
  syncStreakReminder,
} from '@/lib/notifications';
import { fetchAllSessionDates } from '@/lib/sessions';
import { supabase } from '@/lib/supabase';
import { ACTIVITY_COLORS, COLORS, type ActivityType } from '@/lib/types';

const ACTIVITY_PREFS_KEY = 'trackit.activityPrefs';
const ALL_TYPES: ActivityType[] = ['gym', 'sport', 'cardio'];
const REMINDER_OPTIONS = ['18:00', '19:00', '20:00', '21:00'];

function formatHour(time: string): string {
  const hour = Number(time.split(':')[0]);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${hour < 12 ? 'am' : 'pm'}`;
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [guest, setGuest] = useState(false);
  const [prefs, setPrefs] = useState<ActivityType[]>(ALL_TYPES);
  const [reminder, setReminder] = useState('20:00');

  useEffect(() => {
    const loadUser = () =>
      supabase.auth.getUser().then(({ data }) => {
        setEmail(data.user?.email ?? '');
        setGuest(isGuest(data.user));
      });
    loadUser();
    AsyncStorage.getItem(ACTIVITY_PREFS_KEY).then((raw) => {
      if (raw) setPrefs(JSON.parse(raw));
    });
    getReminderTime().then(setReminder);
    // Reflect a guest → registered upgrade without needing an app restart.
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadUser());
    return () => sub.subscription.unsubscribe();
  }, []);

  const togglePref = (type: ActivityType) => {
    const next = prefs.includes(type)
      ? prefs.filter((t) => t !== type)
      : [...prefs, type];
    setPrefs(next);
    AsyncStorage.setItem(ACTIVITY_PREFS_KEY, JSON.stringify(next));
  };

  const pickReminder = async (time: string) => {
    setReminder(time);
    await setReminderTime(time);
    try {
      const rows = await fetchAllSessionDates();
      const today = todayString();
      await syncStreakReminder(rows.some((r) => r.date === today));
    } catch {
      // best-effort reschedule
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-10"
      style={{ paddingTop: insets.top }}
    >
      <Text className="mb-6 mt-4 text-2xl font-black text-white">Profile</Text>

      <View className="mb-4 rounded-2xl bg-card p-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-secondary">
          Account
        </Text>
        {guest ? (
          <>
            <Text className="mt-2 text-sm text-secondary">
              You're using a guest account — your data is saved on this device.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/signup')}
              className="mt-4 items-center rounded-xl bg-primary py-3"
            >
              <Text className="text-base font-semibold text-white">
                Create Account
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text className="mt-2 text-base text-white">{email}</Text>
        )}
      </View>

      <View className="mb-4 rounded-2xl bg-card p-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-secondary">
          My activities
        </Text>
        <View className="mt-3 flex-row gap-2">
          {ALL_TYPES.map((type) => {
            const active = prefs.includes(type);
            return (
              <TouchableOpacity
                key={type}
                onPress={() => togglePref(type)}
                className="rounded-full border px-4 py-2"
                style={{
                  borderColor: active ? ACTIVITY_COLORS[type] : COLORS.border,
                  backgroundColor: active
                    ? `${ACTIVITY_COLORS[type]}22`
                    : 'transparent',
                }}
              >
                <Text
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{
                    color: active ? ACTIVITY_COLORS[type] : COLORS.textSecondary,
                  }}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="mb-4 rounded-2xl bg-card p-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-secondary">
          Daily reminder
        </Text>
        <Text className="mt-2 text-sm text-secondary">
          A nudge if you haven't logged a session yet that day.
        </Text>
        <View className="mt-3 flex-row gap-2">
          {REMINDER_OPTIONS.map((time) => {
            const active = reminder === time;
            return (
              <TouchableOpacity
                key={time}
                onPress={() => pickReminder(time)}
                className={`rounded-full border px-4 py-2 ${
                  active ? 'border-primary bg-primary/10' : 'border-line'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    active ? 'text-primary' : 'text-secondary'
                  }`}
                >
                  {formatHour(time)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {!guest && (
        <TouchableOpacity
          onPress={() => supabase.auth.signOut()}
          className="mt-2 items-center rounded-xl border border-line py-4"
        >
          <Text className="text-base font-semibold text-red-400">Sign Out</Text>
        </TouchableOpacity>
      )}

      <Text className="mt-8 text-center text-xs text-secondary">
        TrackIt v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </ScrollView>
  );
}
