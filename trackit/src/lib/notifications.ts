import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_TIME_KEY = 'trackit.reminderTime'; // "HH:MM"
export const DEFAULT_REMINDER_TIME = '20:00';
const CHANNEL_ID = 'streak-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Streak reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

export async function getReminderTime(): Promise<string> {
  return (await AsyncStorage.getItem(REMINDER_TIME_KEY)) ?? DEFAULT_REMINDER_TIME;
}

export async function setReminderTime(time: string): Promise<void> {
  await AsyncStorage.setItem(REMINDER_TIME_KEY, time);
}

/**
 * Schedule the single next streak reminder (one per day maximum).
 * If a session is already logged today — or today's reminder time has
 * passed — the reminder lands tomorrow instead. Call this on app open,
 * after logging a session, and when the reminder time changes.
 */
export async function syncStreakReminder(hasLoggedToday: boolean): Promise<void> {
  const granted = await requestNotificationPermissions();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!granted) return;

  const [hour, minute] = (await getReminderTime()).split(':').map(Number);
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (hasLoggedToday || next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'TrackIt',
      body: "Your streak is waiting — log today's session 💪",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: next,
      channelId: CHANNEL_ID,
    },
  });
}
