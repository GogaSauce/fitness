import { supabase } from './supabase';
import { daysBetween, startOfWeekString, todayString } from './dates';
import type {
  ActivityType,
  ParsedSession,
  Session,
  Streak,
  WeeklySummary,
} from './types';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function fetchSessionsForDate(date: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Session[];
}

/** Every logged date + activity type, for calendar marking and weekly counts. */
export async function fetchAllSessionDates(): Promise<
  { date: string; activity_type: ActivityType | null }[]
> {
  const { data, error } = await supabase
    .from('sessions')
    .select('date, activity_type');
  if (error) throw error;
  return data ?? [];
}

export async function fetchStreak(): Promise<Streak | null> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as Streak | null;
}

export function computeWeeklySummary(
  rows: { date: string; activity_type: ActivityType | null }[],
): WeeklySummary {
  const weekStart = startOfWeekString();
  const summary: WeeklySummary = { gym: 0, sport: 0, cardio: 0 };
  for (const row of rows) {
    if (row.date >= weekStart && row.activity_type && row.activity_type in summary) {
      summary[row.activity_type]++;
    }
  }
  return summary;
}

/** Send raw text to the ai-session Edge Function for structuring. */
export async function parseSessionText(text: string): Promise<ParsedSession> {
  const { data, error } = await supabase.functions.invoke('ai-session', {
    body: { mode: 'parse', text },
  });
  if (error) throw new Error(`Couldn't organize your session: ${error.message}`);
  return data as ParsedSession;
}

/** Send base64 audio to the ai-session Edge Function for transcription. */
export async function transcribeAudio(
  audio: string,
  mimeType: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-session', {
    body: { mode: 'transcribe', audio, mimeType },
  });
  if (error) throw new Error(`Transcription failed: ${error.message}`);
  return (data as { transcript: string }).transcript;
}

/**
 * Parse the raw text with AI, save the session, and update the streak.
 * `date` is the calendar day the session belongs to (YYYY-MM-DD).
 */
export async function logSession(date: string, rawText: string): Promise<Session> {
  const userId = await requireUserId();
  const parsed = await parseSessionText(rawText);

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      date,
      raw_input: rawText,
      parsed_data: parsed,
      activity_type: parsed.activity_type,
    })
    .select()
    .single();
  if (error) throw error;

  await updateStreak(userId);
  return data as Session;
}

/**
 * Streak rules:
 * - first session ever → streak of 1
 * - last activity yesterday → increment
 * - last activity today → unchanged (multiple sessions in a day count once)
 * - last activity 2+ days ago → reset to 1
 * Always stamps last_activity_date with today and keeps longest_streak current.
 */
async function updateStreak(userId: string): Promise<void> {
  const today = todayString();
  const existing = await fetchStreak();

  let current = 1;
  if (existing?.last_activity_date) {
    const gap = daysBetween(existing.last_activity_date, today);
    if (gap === 0) {
      current = Math.max(existing.current_streak, 1);
    } else if (gap === 1) {
      current = existing.current_streak + 1;
    }
  }
  const longest = Math.max(existing?.longest_streak ?? 0, current);

  const { error } = await supabase.from('streaks').upsert({
    user_id: userId,
    current_streak: current,
    longest_streak: longest,
    last_activity_date: today,
  });
  if (error) throw error;
}
