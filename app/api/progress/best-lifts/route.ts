import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

type SessionSetRow = {
  exercise_name: string
  weight_kg: number
  workout_sessions: { user_id: string }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('session_sets')
    .select('exercise_name, weight_kg, workout_sessions!inner(user_id)')
    .eq('workout_sessions.user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as unknown as SessionSetRow[]

  // Reduce to max weight per exercise
  const bestMap = rows.reduce<Record<string, number>>((acc, row) => {
    const current = acc[row.exercise_name] ?? 0
    if (row.weight_kg > current) {
      acc[row.exercise_name] = row.weight_kg
    }
    return acc
  }, {})

  const result = Object.entries(bestMap).map(([exercise_name, best_weight_kg]) => ({
    exercise_name,
    best_weight_kg,
  }))

  return NextResponse.json(result)
}
