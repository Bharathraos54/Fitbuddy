import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealType = typeof VALID_MEAL_TYPES[number]

interface ProfileData {
  age?: number
  weight_kg?: number
  height_cm?: number
  gender?: string
  fitness_level?: string
  primary_goal?: string
  equipment?: string
  days_per_week?: number
  diet_type?: string
  allergies?: string
  preferred_foods?: string
  cuisines?: string[]
  calorie_mode?: string
}

interface ExerciseItem {
  exercise_name: string
  default_sets?: number
  default_reps?: number
  default_weight_kg?: number
  sort_order?: number
}

interface RoutineItem {
  name: string
  exercises: ExerciseItem[]
}

interface MealItem {
  meal_type: string
  food_name: string
  calories?: number
  sort_order?: number
}

interface GeneratedPlan {
  routines: RoutineItem[]
  meal_plan: {
    name: string
    items: MealItem[]
  }
}

function buildPrompt(profile: ProfileData): string {
  const goalLabels: Record<string, string> = {
    lose_weight: 'lose weight',
    build_muscle: 'build muscle',
    improve_endurance: 'improve endurance',
    stay_healthy: 'stay healthy',
  }
  const equipmentLabels: Record<string, string> = {
    bodyweight: 'bodyweight only (no equipment)',
    dumbbells: 'dumbbells at home',
    full_gym: 'full gym access',
  }

  return `You are an expert fitness and nutrition coach with 15 years of experience. Your job is to create a highly personalised workout and meal plan based on the user's profile below.

== USER PROFILE ==
- Age: ${profile.age ?? 'not specified'}
- Weight: ${profile.weight_kg ?? 'not specified'} kg
- Height: ${profile.height_cm ?? 'not specified'} cm
- Gender: ${profile.gender ?? 'not specified'}
- Fitness level: ${profile.fitness_level ?? 'beginner'}
- Primary goal: ${goalLabels[profile.primary_goal ?? ''] ?? profile.primary_goal ?? 'stay healthy'}
- Equipment available: ${equipmentLabels[profile.equipment ?? ''] ?? profile.equipment ?? 'bodyweight only'}
- Training days per week: ${profile.days_per_week ?? 3}
- Diet type: ${profile.diet_type ?? 'non_vegetarian'}
- Allergies / restrictions: ${profile.allergies || 'none'}
- Foods they prefer or have available: ${profile.preferred_foods || 'no preference'}
- Preferred cuisines: ${profile.cuisines?.join(', ') || 'no preference'}

== YOUR TASK ==
1. Create exactly ${profile.days_per_week ?? 3} workout routines (one per training day), each with 4–6 exercises. Structure them intelligently — e.g. Push/Pull/Legs or Upper/Lower splits — based on the user's goal and fitness level. Order exercises within each routine logically (compound movements first, isolation last).

2. Create one daily meal plan with breakfast, lunch, dinner, and a snack. Use the user's preferred foods and cuisines as inspiration, but apply your expertise to ensure the meals are nutritionally balanced and aligned with their primary goal. Do not be limited only to what they listed — include other foods where nutritionally beneficial.

== OUTPUT FORMAT ==
Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation before or after.

{
  "routines": [
    {
      "name": "string (e.g. Push Day, Leg Day, Full Body A)",
      "exercises": [
        {
          "exercise_name": "string",
          "default_sets": 3,
          "default_reps": 10,
          "default_weight_kg": 0,
          "sort_order": 1
        }
      ]
    }
  ],
  "meal_plan": {
    "name": "string (e.g. My AI Meal Plan)",
    "items": [
      {
        "meal_type": "breakfast",
        "food_name": "string",
        "calories": 350,
        "sort_order": 1
      }
    ]
  }
}

== RULES ==
- meal_type must be exactly one of: breakfast, lunch, dinner, snack
- default_weight_kg should be 0 for bodyweight exercises
- Output ONLY the raw JSON object, nothing else`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profileData: ProfileData = await request.json()

  // Save profile before calling Claude — don't lose data if Claude fails
  await supabase.from('user_profiles').upsert({
    id: user.id,
    ...profileData,
    onboarding_completed: false,
    updated_at: new Date().toISOString(),
  })

  // Call Claude
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Configuration error: ANTHROPIC_API_KEY is missing' }, { status: 500 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let plan: GeneratedPlan

  if (process.env.MOCK_AI === 'true') {
    plan = {
      routines: [
        {
          name: 'Push Day',
          exercises: [
            { exercise_name: 'Bench Press', default_sets: 4, default_reps: 8, default_weight_kg: 60, sort_order: 1 },
            { exercise_name: 'Overhead Press', default_sets: 3, default_reps: 10, default_weight_kg: 40, sort_order: 2 },
            { exercise_name: 'Incline Dumbbell Press', default_sets: 3, default_reps: 12, default_weight_kg: 20, sort_order: 3 },
            { exercise_name: 'Lateral Raises', default_sets: 3, default_reps: 15, default_weight_kg: 8, sort_order: 4 },
            { exercise_name: 'Tricep Pushdowns', default_sets: 3, default_reps: 12, default_weight_kg: 15, sort_order: 5 },
          ],
        },
        {
          name: 'Pull Day',
          exercises: [
            { exercise_name: 'Deadlift', default_sets: 4, default_reps: 6, default_weight_kg: 80, sort_order: 1 },
            { exercise_name: 'Barbell Row', default_sets: 4, default_reps: 8, default_weight_kg: 60, sort_order: 2 },
            { exercise_name: 'Pull-Ups', default_sets: 3, default_reps: 8, default_weight_kg: 0, sort_order: 3 },
            { exercise_name: 'Face Pulls', default_sets: 3, default_reps: 15, default_weight_kg: 12, sort_order: 4 },
            { exercise_name: 'Bicep Curls', default_sets: 3, default_reps: 12, default_weight_kg: 12, sort_order: 5 },
          ],
        },
        {
          name: 'Leg Day',
          exercises: [
            { exercise_name: 'Squat', default_sets: 4, default_reps: 8, default_weight_kg: 80, sort_order: 1 },
            { exercise_name: 'Romanian Deadlift', default_sets: 3, default_reps: 10, default_weight_kg: 60, sort_order: 2 },
            { exercise_name: 'Leg Press', default_sets: 3, default_reps: 12, default_weight_kg: 100, sort_order: 3 },
            { exercise_name: 'Walking Lunges', default_sets: 3, default_reps: 12, default_weight_kg: 0, sort_order: 4 },
            { exercise_name: 'Calf Raises', default_sets: 4, default_reps: 15, default_weight_kg: 40, sort_order: 5 },
          ],
        },
      ],
      meal_plan: {
        name: 'Mock AI Meal Plan',
        items: [
          { meal_type: 'breakfast', food_name: 'Oats with banana and peanut butter', calories: 420, sort_order: 1 },
          { meal_type: 'lunch', food_name: 'Grilled chicken with brown rice and spinach', calories: 550, sort_order: 2 },
          { meal_type: 'dinner', food_name: 'Salmon with sweet potato and broccoli', calories: 600, sort_order: 3 },
          { meal_type: 'snack', food_name: 'Greek yogurt with mixed berries', calories: 180, sort_order: 4 },
        ],
      },
    }
  } else {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: buildPrompt(profileData) }],
      })

      const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
      const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
      plan = JSON.parse(cleaned) as GeneratedPlan
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: `Failed to generate plan: ${msg}` }, { status: 500 })
    }
  }

  if (!plan.routines?.length) {
    return NextResponse.json({ error: 'Claude returned no routines' }, { status: 500 })
  }
  if (!plan.meal_plan?.items?.length) {
    return NextResponse.json({ error: 'Claude returned no meal plan' }, { status: 500 })
  }

  // Clamp invalid meal_type values to 'snack'
  plan.meal_plan.items = plan.meal_plan.items.map(item => ({
    ...item,
    meal_type: (VALID_MEAL_TYPES as readonly string[]).includes(item.meal_type)
      ? (item.meal_type as MealType)
      : 'snack',
  }))

  // Save routines + exercises
  for (const routine of plan.routines) {
    const { data: savedRoutine, error: routineError } = await supabase
      .from('routines')
      .insert({ user_id: user.id, name: routine.name })
      .select('id')
      .single()

    if (routineError || !savedRoutine) {
      return NextResponse.json({ error: `Failed to save routine: ${routineError?.message}` }, { status: 500 })
    }

    const exercises = routine.exercises.map((ex, idx) => ({
      routine_id: savedRoutine.id,
      exercise_name: ex.exercise_name,
      default_sets: ex.default_sets ?? 3,
      default_reps: ex.default_reps ?? 10,
      default_weight_kg: ex.default_weight_kg ?? 0,
      sort_order: ex.sort_order ?? idx + 1,
    }))

    const { error: exError } = await supabase.from('routine_exercises').insert(exercises)
    if (exError) {
      return NextResponse.json({ error: `Failed to save exercises: ${exError.message}` }, { status: 500 })
    }
  }

  // Save meal plan (deactivate existing first)
  await supabase.from('meal_plans').update({ is_active: false }).eq('user_id', user.id)

  const { data: savedPlan, error: planError } = await supabase
    .from('meal_plans')
    .insert({ user_id: user.id, name: plan.meal_plan.name, is_active: true })
    .select('id')
    .single()

  if (planError || !savedPlan) {
    return NextResponse.json({ error: `Failed to save meal plan: ${planError?.message}` }, { status: 500 })
  }

  const mealItems = plan.meal_plan.items.map((item, idx) => ({
    meal_plan_id: savedPlan.id,
    meal_type: item.meal_type,
    food_name: item.food_name,
    calories: item.calories ?? 0,
    sort_order: item.sort_order ?? idx + 1,
  }))

  const { error: itemsError } = await supabase.from('meal_plan_items').insert(mealItems)
  if (itemsError) {
    return NextResponse.json({ error: `Failed to save meal items: ${itemsError.message}` }, { status: 500 })
  }

  // Set workout frequency goal from days_per_week
  if (profileData.days_per_week) {
    await supabase.from('workout_freq_goals').delete().eq('user_id', user.id)
    await supabase.from('workout_freq_goals').insert({
      user_id: user.id,
      target_days_per_week: profileData.days_per_week,
    })
  }

  // Mark onboarding complete
  await supabase.from('user_profiles').upsert({
    id: user.id,
    ...profileData,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
