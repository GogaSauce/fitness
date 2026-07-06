export type ActivityType = 'gym' | 'sport' | 'cardio';

export interface ParsedExercise {
  name: string;
  sets: number | null;
  reps: number | null;
  weight_lbs: number | null;
  duration_minutes: number | null;
  notes: string | null;
}

export interface ParsedSession {
  activity_type: ActivityType;
  summary: string;
  exercises: ParsedExercise[];
  total_duration_minutes: number | null;
  perceived_effort: number | null;
  sport_or_activity: string | null;
}

export interface Session {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  raw_input: string | null;
  parsed_data: ParsedSession | null;
  activity_type: ActivityType | null;
  created_at: string;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null; // YYYY-MM-DD
}

export interface WeeklySummary {
  gym: number;
  sport: number;
  cardio: number;
}

export const COLORS = {
  background: '#0f0f0f',
  card: '#1a1a1a',
  primary: '#f97316',
  sport: '#3b82f6',
  cardio: '#22c55e',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#2a2a2a',
} as const;

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  gym: COLORS.primary,
  sport: COLORS.sport,
  cardio: COLORS.cardio,
};
