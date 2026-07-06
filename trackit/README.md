# TrackIt

A fitness session logger. Dump what you did — typed or spoken — and Gemini turns
it into a structured training log. A calendar and streak counter keep you honest
across gym sessions, sports, and cardio.

## Stack

- **Expo SDK 57** (managed) + **Expo Router** + **NativeWind**
- **Supabase** — auth, Postgres, and an Edge Function (`ai-session`) that proxies
  Gemini so the API key never ships in the app bundle
- **Gemini 2.0 Flash** — voice transcription and workout parsing
- **expo-audio** for recording, **react-native-calendars** for the calendar

## Setup

### 1. Supabase

The Supabase CLI can't be installed globally via npm, so run it through `npx`
(no separate install needed):

```sh
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push                      # applies supabase/migrations
npx supabase secrets set GEMINI_API_KEY=<your-gemini-key>
npx supabase functions deploy ai-session
```

The migration creates the `sessions` and `streaks` tables with row-level
security (users only see their own rows).

### 2. App environment

```sh
cp .env.example .env   # fill in your Supabase URL + publishable key
```

### 3. Run

```sh
npm install
npx expo start
```

Open in Expo Go or a development build. Voice recording and local notifications
work in Expo Go; use a dev build for full notification behavior on Android.

## Layout

```
src/app                          screens (expo-router): (auth) login/signup, (tabs) home/profile
src/components                   CalendarView, DayModal, SessionCard, StreakDisplay, VoiceRecorder, Toast
src/lib                          supabase client, types, session/streak logic, notifications
supabase/migrations              schema + RLS
supabase/functions/ai-session    Gemini proxy (transcribe + parse modes)
```
