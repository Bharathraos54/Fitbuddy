import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const exercise = searchParams.get('exercise')
  if (!exercise) return NextResponse.json({ error: 'exercise query param is required' }, { status: 400 })

  // Fetch session_sets joined with workout_sessions for this user and exercise
  const { data, error } = await supabase
    .from('session_sets')
    .select('weight_kg, workout_sessions!inner(user_id, started_at, completed_at)')
    .eq('exercise_name', exercise)
    .eq('workout_sessions.user_id', user.id)
    .not('workout_sessions.completed_at', 'is', null)
    .order('workout_sessions(started_at)', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by session date (YYYY-MM-DD), take max weight_kg per session
  const dateMap: Record<string, number> = {}
  for (const row of data ?? []) {
    const session = (row.workout_sessions as unknown) as { started_at: string; completed_at: string | null }
    const date = new Date(session.started_at).toISOString().split('T')[0]
    const weight = row.weight_kg ?? 0
    if (dateMap[date] === undefined || weight > dateMap[date]) {
      dateMap[date] = weight
    }
  }

  const result = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-20)
    .map(([date, max_weight_kg]) => ({ date, max_weight_kg }))

  return NextResponse.json(result)
}
