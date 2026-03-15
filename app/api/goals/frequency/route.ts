import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('workout_freq_goals')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { target_days_per_week } = await request.json()
  if (target_days_per_week == null) return NextResponse.json({ error: 'target_days_per_week is required' }, { status: 400 })

  // Delete existing goal then insert new one (upsert pattern)
  const { error: deleteError } = await supabase
    .from('workout_freq_goals')
    .delete()
    .eq('user_id', user.id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  const { data, error } = await supabase
    .from('workout_freq_goals')
    .insert({ user_id: user.id, target_days_per_week })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
