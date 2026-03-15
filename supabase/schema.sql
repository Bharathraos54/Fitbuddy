-- ============================================================
-- Gym & Diet Tracker — Database Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- ─── WORKOUT TABLES ──────────────────────────────────────────

-- Saved workout templates (e.g. "Push Day", "Leg Day")
create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- Exercises within a routine template
create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines(id) on delete cascade not null,
  exercise_name text not null,
  sort_order integer not null default 0,
  default_sets integer not null default 3,
  default_reps integer not null default 10,
  default_weight_kg numeric(6,2) default 0
);

-- A single workout session (one instance of doing a routine)
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_id uuid references routines(id) on delete set null,
  routine_name text not null,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- Individual sets logged during a session
create table session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions(id) on delete cascade not null,
  exercise_name text not null,
  set_number integer not null,
  reps integer not null,
  weight_kg numeric(6,2) not null default 0,
  logged_at timestamptz default now()
);

-- ─── DIET TABLES ─────────────────────────────────────────────

-- A named meal plan (e.g. "Cutting Plan", "Bulk Phase")
create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Individual meals inside a meal plan template
create table meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid references meal_plans(id) on delete cascade not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name text not null,
  calories integer not null default 0,
  sort_order integer not null default 0
);

-- Daily food log entries (what was actually eaten)
create table meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_plan_item_id uuid references meal_plan_items(id) on delete set null,
  food_name text not null,
  calories integer not null default 0,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  logged_date date not null default current_date,
  logged_at timestamptz default now()
);

-- ─── GOALS TABLES ────────────────────────────────────────────

-- Strength goal per exercise (e.g. "Bench Press → 100kg")
create table strength_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_name text not null,
  target_weight_kg numeric(6,2) not null,
  created_at timestamptz default now()
);

-- Workout frequency goal (e.g. "Train 4x per week")
create table workout_freq_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  target_days_per_week integer not null check (target_days_per_week between 1 and 7),
  created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY (RLS) ────────────────────────────────
-- This ensures users can only see their own data

alter table routines enable row level security;
alter table routine_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table session_sets enable row level security;
alter table meal_plans enable row level security;
alter table meal_plan_items enable row level security;
alter table meal_logs enable row level security;
alter table strength_goals enable row level security;
alter table workout_freq_goals enable row level security;

-- Policies: users can only read/write their own rows
create policy "Users own their routines" on routines for all using (auth.uid() = user_id);
create policy "Users own their sessions" on workout_sessions for all using (auth.uid() = user_id);
create policy "Users own their meal plans" on meal_plans for all using (auth.uid() = user_id);
create policy "Users own their meal logs" on meal_logs for all using (auth.uid() = user_id);
create policy "Users own their strength goals" on strength_goals for all using (auth.uid() = user_id);
create policy "Users own their freq goals" on workout_freq_goals for all using (auth.uid() = user_id);

-- Policies for child tables (accessible via parent join)
create policy "Users own their routine exercises" on routine_exercises for all
  using (routine_id in (select id from routines where user_id = auth.uid()));

create policy "Users own their session sets" on session_sets for all
  using (session_id in (select id from workout_sessions where user_id = auth.uid()));

create policy "Users own their meal plan items" on meal_plan_items for all
  using (meal_plan_id in (select id from meal_plans where user_id = auth.uid()));

-- ─── USER PROFILES TABLE ─────────────────────────────────────
-- Stores onboarding data collected during the AI plan wizard

create table user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  age           integer,
  weight_kg     numeric(5,1),
  height_cm     numeric(5,1),
  gender        text check (gender in ('male','female','other')),
  fitness_level text check (fitness_level in ('beginner','intermediate','advanced')),
  primary_goal  text check (primary_goal in ('lose_weight','build_muscle','improve_endurance','stay_healthy')),
  equipment     text check (equipment in ('bodyweight','dumbbells','full_gym')),
  days_per_week integer check (days_per_week between 1 and 7),
  diet_type     text check (diet_type in ('vegetarian','vegan','non_vegetarian','pescatarian')),
  allergies     text,
  preferred_foods text,
  cuisines      text[],
  calorie_mode  text check (calorie_mode in ('self_set','ai_suggest')),
  onboarding_completed boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "Users own their profile"
  on user_profiles for all
  using (auth.uid() = id);
