import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const startOfWeek = getStartOfWeek()

  const [
    { data: mealLogs },
    { data: mealPlanItems },
    { data: sessions },
    { data: freqGoal },
    { data: strengthGoals },
    { data: routines },
  ] = await Promise.all([
    supabase.from('meal_logs').select('*').eq('logged_date', today),
    supabase
      .from('meal_plan_items')
      .select('*, meal_plans!inner(is_active, user_id)')
      .eq('meal_plans.user_id', user.id)
      .eq('meal_plans.is_active', true),
    supabase
      .from('workout_sessions')
      .select('id, completed_at, routine_name, started_at')
      .eq('user_id', user.id)
      .gte('started_at', startOfWeek)
      .not('completed_at', 'is', null),
    supabase.from('workout_freq_goals').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('strength_goals').select('*').eq('user_id', user.id),
    supabase.from('routines').select('*').eq('user_id', user.id).limit(5),
  ])

  const totalCaloriesToday = (mealLogs ?? []).reduce((sum, log) => sum + log.calories, 0)
  const workoutsThisWeek = sessions?.length ?? 0

  return (
    <DashboardClient
      user={{ email: user.email ?? '' }}
      totalCaloriesToday={totalCaloriesToday}
      mealLogs={mealLogs ?? []}
      mealPlanItems={mealPlanItems ?? []}
      workoutsThisWeek={workoutsThisWeek}
      freqGoal={freqGoal}
      strengthGoals={strengthGoals ?? []}
      routines={routines ?? []}
    />
  )
}

function getStartOfWeek(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString()
}
