-- TrackIt initial schema: sessions + streaks with per-user RLS.

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  raw_input text,
  parsed_data jsonb,
  activity_type text check (activity_type in ('gym', 'sport', 'cardio')),
  created_at timestamptz default now()
);

create index sessions_user_date_idx on public.sessions (user_id, date);

create table public.streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_date date
);

alter table public.sessions enable row level security;
alter table public.streaks enable row level security;

create policy "Users manage own sessions"
  on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own streak"
  on public.streaks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
