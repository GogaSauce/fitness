import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';

import { todayString } from '@/lib/dates';
import { syncStreakReminder } from '@/lib/notifications';
import { fetchAllSessionDates } from '@/lib/sessions';
import { COLORS } from '@/lib/types';

export default function TabsLayout() {
  // Line up the daily streak reminder whenever the signed-in shell mounts.
  useEffect(() => {
    (async () => {
      try {
        const rows = await fetchAllSessionDates();
        const today = todayString();
        await syncStreakReminder(rows.some((r) => r.date === today));
      } catch {
        // Reminder scheduling is best-effort; never block the UI on it.
      }
    })();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: COLORS.background },
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
