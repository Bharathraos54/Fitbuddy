# FitBuddy

Mobile-first workout, diet and goals tracker for gym beginners, with an AI-generated starter plan.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth) · Claude API · Recharts

## Setup

1. Install Node.js 20+.
2. Install dependencies: `npm ci`
3. Create a Supabase project and run `supabase/schema.sql` in its SQL editor (skip if reusing an existing project).
4. Copy `.env.example` to `.env.local` and fill in your Supabase URL, anon key and Anthropic API key.
   Set `MOCK_AI=true` to skip the Claude call during local development.
5. Start the dev server: `npm run dev`, then open http://localhost:3000.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
