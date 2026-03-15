'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Exercise = {
  id: string
  exercise_name: string
  default_sets: number
  default_reps: number
  default_weight_kg: number
  sort_order: number
}

type Routine = { id: string; name: string; routine_exercises: Exercise[] }

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ exercise_name: '', default_sets: 3, default_reps: 10, default_weight_kg: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchRoutine() }, [id])

  async function fetchRoutine() {
    const res = await fetch(`/api/routines/${id}`)
    if (!res.ok) { router.push('/workouts'); return }
    setRoutine(await res.json())
    setLoading(false)
  }

  async function addExercise(e: React.FormEvent) {
    e.preventDefault()
    if (!form.exercise_name.trim()) return
    setSaving(true)
    await fetch(`/api/routines/${id}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sort_order: routine?.routine_exercises.length ?? 0 }),
    })
    setForm({ exercise_name: '', default_sets: 3, default_reps: 10, default_weight_kg: 0 })
    setShowForm(false)
    setSaving(false)
    fetchRoutine()
  }

  async function removeExercise(exerciseId: string) {
    await fetch(`/api/routines/${id}/exercises`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId }),
    })
    fetchRoutine()
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>
  if (!routine) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/workouts" className="text-gray-400 hover:text-white">←</Link>
          <h1 className="text-xl font-bold">{routine.name}</h1>
        </div>
        <p className="text-sm text-gray-400 ml-7">{routine.routine_exercises.length} exercises</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {/* Start workout CTA */}
        <Link
          href={`/workouts/${id}/session`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl py-4 transition-colors"
        >
          🏋️ Start Workout
        </Link>

        {/* Exercises */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="font-semibold text-gray-300">Exercises</h2>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + Add exercise
          </button>
        </div>

        {/* Add exercise form */}
        {showForm && (
          <form onSubmit={addExercise} className="bg-gray-900 rounded-2xl p-4 space-y-3 border border-blue-500/40">
            <input
              autoFocus
              type="text"
              value={form.exercise_name}
              onChange={(e) => setForm({ ...form, exercise_name: e.target.value })}
              placeholder="Exercise name (e.g. Bench Press)"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Sets', key: 'default_sets' },
                { label: 'Reps', key: 'default_reps' },
                { label: 'Weight (kg)', key: 'default_weight_kg' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
              >
                {saving ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Exercise list */}
        {routine.routine_exercises.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No exercises yet — add your first one above</p>
          </div>
        ) : (
          routine.routine_exercises.map((ex, i) => (
            <div key={ex.id} className="bg-gray-900 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                  <span className="font-medium">{ex.exercise_name}</span>
                </div>
                <p className="text-xs text-gray-400 ml-6 mt-0.5">
                  {ex.default_sets} sets × {ex.default_reps} reps
                  {ex.default_weight_kg > 0 ? ` @ ${ex.default_weight_kg}kg` : ''}
                </p>
              </div>
              <button
                onClick={() => removeExercise(ex.id)}
                className="text-gray-600 hover:text-red-400 transition-colors text-lg"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
