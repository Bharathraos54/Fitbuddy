'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Exercise = { id: string; exercise_name: string; default_sets: number; default_reps: number; default_weight_kg: number }
type Routine = { id: string; name: string; routine_exercises: Exercise[] }
type LoggedSet = { id: string; exercise_name: string; set_number: number; reps: number; weight_kg: number }

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Input state per exercise
  const [inputs, setInputs] = useState<Record<string, { reps: number; weight_kg: number }>>({})

  useEffect(() => {
    initSession()
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [id])

  async function initSession() {
    // Fetch routine
    const res = await fetch(`/api/routines/${id}`)
    if (!res.ok) { router.push('/workouts'); return }
    const r: Routine = await res.json()
    setRoutine(r)

    // Pre-fill inputs from defaults
    const defaults: Record<string, { reps: number; weight_kg: number }> = {}
    r.routine_exercises.forEach((ex) => {
      defaults[ex.id] = { reps: ex.default_reps, weight_kg: ex.default_weight_kg }
    })
    setInputs(defaults)

    // Create session
    const sessionRes = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routine_id: r.id, routine_name: r.name }),
    })
    const session = await sessionRes.json()
    setSessionId(session.id)
    setLoading(false)
  }

  async function logSet(exercise: Exercise) {
    if (!sessionId) return
    const input = inputs[exercise.id]
    const setsForExercise = loggedSets.filter((s) => s.exercise_name === exercise.exercise_name).length

    const res = await fetch(`/api/sessions/${sessionId}/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_name: exercise.exercise_name,
        set_number: setsForExercise + 1,
        reps: input.reps,
        weight_kg: input.weight_kg,
      }),
    })
    const newSet = await res.json()
    setLoggedSets((prev) => [...prev, newSet])
  }

  async function completeSession() {
    if (!sessionId) return
    setCompleting(true)
    if (timerRef.current) clearInterval(timerRef.current)
    await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' })
    router.push('/workouts')
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Starting session...</div>
  if (!routine) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-32">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <div>
          <h1 className="font-bold text-lg">{routine.name}</h1>
          <p className="text-sm text-gray-400">⏱ {formatTime(elapsed)}</p>
        </div>
        <span className="text-sm text-gray-400">{loggedSets.length} sets logged</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {routine.routine_exercises.map((exercise) => {
          const setsForThis = loggedSets.filter((s) => s.exercise_name === exercise.exercise_name)
          const input = inputs[exercise.id] ?? { reps: exercise.default_reps, weight_kg: exercise.default_weight_kg }

          return (
            <div key={exercise.id} className="bg-gray-900 rounded-2xl p-4 space-y-3">
              {/* Exercise header */}
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{exercise.exercise_name}</h2>
                <span className="text-sm text-gray-400">{setsForThis.length} / {exercise.default_sets} sets</span>
              </div>

              {/* Logged sets */}
              {setsForThis.length > 0 && (
                <div className="space-y-1">
                  {setsForThis.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 text-sm bg-gray-800 rounded-lg px-3 py-1.5">
                      <span className="text-green-400 font-medium">Set {s.set_number}</span>
                      <span className="text-gray-300">{s.reps} reps</span>
                      {s.weight_kg > 0 && <span className="text-gray-300">@ {s.weight_kg}kg</span>}
                      <span className="ml-auto text-green-400">✓</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Input row */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Reps</label>
                  <input
                    type="number"
                    min="1"
                    value={input.reps}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [exercise.id]: { ...input, reps: parseInt(e.target.value) || 0 } }))}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={input.weight_kg}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [exercise.id]: { ...input, weight_kg: parseFloat(e.target.value) || 0 } }))}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold"
                  />
                </div>
                <div className="pt-5">
                  <button
                    onClick={() => logSet(exercise)}
                    className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-lg px-4 py-2 transition-all"
                  >
                    + Set
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Complete button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950 border-t border-gray-800">
        <button
          onClick={completeSession}
          disabled={completing || loggedSets.length === 0}
          className="w-full max-w-2xl mx-auto block bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold rounded-2xl py-4 transition-colors text-lg"
        >
          {completing ? 'Saving...' : `Complete Workout (${loggedSets.length} sets)`}
        </button>
      </div>
    </div>
  )
}
