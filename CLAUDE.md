# Gym & Diet Tracker — Claude Project Memory

## What this app is
A personal web app for tracking gym workouts, diet, and fitness goals.
Built by Bharath as a learning project to explore Claude Code features.

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

## Coding Conventions
- Use TypeScript everywhere — no plain `.js` files
- Use `async/await` not `.then()` chains
- Keep components small — one responsibility per component
- API routes live in `app/api/[resource]/route.ts`
- Supabase client import: `import { supabase } from '@/lib/supabase'`
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
- **MCP servers** — for Open Food Facts API integration
- **Sub-agents** — for parallel feature building in later phases

## Current Phase
Phase 8 complete. All features built. App is fully functional.
