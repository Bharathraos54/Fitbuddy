import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: routineId } = await params

  // Verify routine belongs to user
  const { data: routine } = await supabase
    .from('routines')
    .select('id')
    .eq('id', routineId)
    .eq('user_id', user.id)
    .single()

  if (!routine) return NextResponse.json({ error: 'Routine not found' }, { status: 404 })

  const { exercise_name, default_sets, default_reps, default_weight_kg, sort_order } =
    await request.json()

  if (!exercise_name?.trim())
    return NextResponse.json({ error: 'Exercise name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('routine_exercises')
    .insert({
      routine_id: routineId,
      exercise_name: exercise_name.trim(),
      default_sets: default_sets ?? 3,
      default_reps: default_reps ?? 10,
      default_weight_kg: default_weight_kg ?? 0,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { exerciseId } = await request.json()

  const { error } = await supabase
    .from('routine_exercises')
    .delete()
    .eq('id', exerciseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
