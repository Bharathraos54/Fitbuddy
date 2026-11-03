# Gym & Diet Tracker — Claude Project Memory

## What this app is
FitBuddy — a mobile-first web app (installable PWA) for tracking gym workouts, diet,
and fitness goals. Target users: **gym beginners** who don't know what to do; the
AI-generated starter plan (onboarding → `/api/generate-plan`) is the core hook.

## Tech Stack
- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Food data:** Open Food Facts API (free, no key needed)
- **Charts:** Recharts
- **Deployment:** Vercel (when ready)

## Project Structure
```
gym-diet-tracker/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Dashboard (home)
│   ├── workouts/         # Workout routines + sessions
│   ├── diet/             # Meal logging
│   ├── goals/            # Goals tracker
│   └── api/              # API route handlers
├── components/           # Reusable React components
├── lib/                  # Supabase client + utilities
└── CLAUDE.md             # This file
```

## Data Model (Supabase tables)
- `routines` — saved workout templates (e.g. "Push Day")
- `routine_exercises` — exercises within a routine
- `workout_sessions` — logged workout instances
- `session_sets` — sets/reps/weight logged per session
- `meal_plans` — saved meal plan templates
- `meal_plan_items` — individual meals in a plan
- `meal_logs` — daily food entries
- `strength_goals` — target weight per exercise
- `workout_freq_goals` — target days per week
- `user_profiles` — onboarding answers + `onboarding_completed`

Schema and RLS policies live in `supabase/schema.sql`.

## Coding Conventions
- Use TypeScript everywhere — no plain `.js` files
- Use `async/await` not `.then()` chains
- Keep components small — one responsibility per component
- API routes live in `app/api/[resource]/route.ts`
- Supabase in server code / API routes: `import { createClient } from '@/lib/supabase-server'` (async)
- Supabase in client components: `import { createClient } from '@/lib/supabase'`
- All Tailwind — no external CSS files unless absolutely needed

## v1 Scope (what we are building now)
- [ ] Dashboard with daily summary
- [ ] Workout routines (create, edit, start session)
- [ ] Workout session logger (sets, reps, weight)
- [ ] Meal plan viewer + daily meal logging
- [ ] Food search via Open Food Facts API
- [ ] Strength goals tracker
- [ ] Workout frequency / streak tracker

## Out of scope for v1
- Macro tracking (protein/carbs/fat)
- Progress charts (v2)
- Notifications / reminders
- Social features
- Wearable integrations

## Claude Code Features Used in This Project
- **CLAUDE.md** — this file, persistent project memory
- **Hooks** — set up in `.claude/hooks/` (auto-format on save)
- **MCP servers** — `.mcp.json` → `mcp/food-server.mjs` (Open Food Facts)
- **Sub-agents** — for parallel feature building in later phases

## Current Phase
v1 features are built. Now turning it into a product for real users:
- **Phase 0 (in progress):** get it installing, building and running locally
- **Phase 1:** safe for strangers — verify RLS, rate-limit/cap the Claude endpoint, error states, tests
- **Phase 2:** beginner-first UX — mobile-first, PWA install + offline set logging, exercise cues, progression
- **Phase 3:** launch — Vercel deploy, analytics (activation, W1/W4 retention), feedback, landing page
