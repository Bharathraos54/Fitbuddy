import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 56)

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('started_at')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by ISO week in JS
  const weekCounts: Record<string, number> = {}
  for (const session of data ?? []) {
    const d = new Date(session.started_at)
    const week = getISOWeek(d)
    weekCounts[week] = (weekCounts[week] ?? 0) + 1
  }

  const result = Object.entries(weekCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }))

  return NextResponse.json(result)
}

function getISOWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}
