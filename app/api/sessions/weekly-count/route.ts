import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

function getMondayOfCurrentWeek(): string {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday, 1 = Monday, ...
  // Adjust so Monday = 0, Sunday = 6
  const daysFromMonday = (day + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysFromMonday)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = getMondayOfCurrentWeek()

  const { count, error } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .gte('created_at', weekStart)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ count: count ?? 0 })
}
