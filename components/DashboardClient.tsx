'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type MealLog = { id: string; food_name: string; calories: number; meal_type: string }
type MealPlanItem = { id: string; food_name: string; calories: number; meal_type: string }
type StrengthGoal = { id: string; exercise_name: string; target_weight_kg: number }
type Routine = { id: string; name: string }
type FreqGoal = { target_days_per_week: number } | null

interface Props {
  user: { email: string }
  totalCaloriesToday: number
  mealLogs: MealLog[]
  mealPlanItems: MealPlanItem[]
  workoutsThisWeek: number
  freqGoal: FreqGoal
  strengthGoals: StrengthGoal[]
  routines: Routine[]
}

export default function DashboardClient({
  user,
  totalCaloriesToday,
  mealLogs,
  mealPlanItems,
  workoutsThisWeek,
  freqGoal,
  strengthGoals,
  routines,
}: Props) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = dayNames[new Date().getDay()]
  const targetDays = freqGoal?.target_days_per_week ?? 4

  const loggedMealTypes = new Set(mealLogs.map((l) => l.meal_type))
  const meals = ['breakfast', 'lunch', 'dinner', 'snack']

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">💪 FitBuddy</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold">Good {getGreeting()} 👋</h1>
          <p className="text-gray-400 text-sm mt-0.5">{formatDate()}</p>
        </div>

        {/* Workout Streak */}
        <section className="bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">This Week</h2>
            <span className="text-sm text-gray-400">
              {workoutsThisWeek}/{targetDays} workouts
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: targetDays }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i < workoutsThisWeek ? 'bg-green-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {targetDays - workoutsThisWeek > 0
              ? `${targetDays - workoutsThisWeek} more workout${targetDays - workoutsThisWeek > 1 ? 's' : ''} to hit your weekly goal`
              : '🎉 Weekly goal smashed!'}
          </p>
        </section>

        {/* Today's Workout */}
        <section className="bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Today&apos;s Workout</h2>
            <Link href="/workouts" className="text-sm text-blue-400 hover:text-blue-300">
              All routines →
            </Link>
          </div>
          {routines.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">No routines yet</p>
              <Link
                href="/workouts"
                className="mt-2 inline-block text-sm bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors"
              >
                Create your first routine
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {routines.map((r) => (
                <Link
                  key={r.id}
                  href={`/workouts/${r.id}`}
                  className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition-colors"
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-sm text-blue-400">Start →</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Today's Meals */}
        <section className="bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Today&apos;s Meals</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{totalCaloriesToday} kcal</span>
              <Link href="/diet" className="text-sm text-blue-400 hover:text-blue-300">
                Log food →
              </Link>
            </div>
          </div>
          <div className="space-y-2">
            {meals.map((meal) => {
              const done = loggedMealTypes.has(meal)
              const planned = mealPlanItems.find((m) => m.meal_type === meal)
              return (
                <div
                  key={meal}
                  className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${done ? 'opacity-100' : 'opacity-40'}`}>
                      {mealEmoji(meal)}
                    </span>
                    <div>
                      <p className="font-medium capitalize">{meal}</p>
                      {planned && (
                        <p className="text-xs text-gray-400">
                          {planned.food_name} · {planned.calories} kcal
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-lg ${done ? 'text-green-400' : 'text-gray-600'}`}>
                    {done ? '✓' : '○'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Strength Goals */}
        {strengthGoals.length > 0 && (
          <section className="bg-gray-900 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Strength Goals</h2>
              <Link href="/goals" className="text-sm text-blue-400 hover:text-blue-300">
                Manage →
              </Link>
            </div>
            <div className="space-y-2">
              {strengthGoals.map((goal) => (
                <div key={goal.id} className="bg-gray-800 rounded-xl px-4 py-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{goal.exercise_name}</span>
                    <span className="text-gray-400">Target: {goal.target_weight_kg}kg</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex">
          {[
            { href: '/', label: 'Home', icon: '🏠' },
            { href: '/workouts', label: 'Workout', icon: '🏋️' },
            { href: '/diet', label: 'Diet', icon: '🥗' },
            { href: '/goals', label: 'Goals', icon: '🎯' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center py-3 text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-0.5">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="h-20" /> {/* bottom nav spacer */}
      </main>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function mealEmoji(meal: string) {
  const map: Record<string, string> = {
    breakfast: '🍳',
    lunch: '🍱',
    dinner: '🍽️',
    snack: '🍎',
  }
  return map[meal] ?? '🍴'
}
