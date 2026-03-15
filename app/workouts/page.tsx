'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Exercise = { id: string; exercise_name: string; default_sets: number; default_reps: number; default_weight_kg: number }
type Routine = { id: string; name: string; routine_exercises: Exercise[] }

export default function WorkoutsPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchRoutines() }, [])

  async function fetchRoutines() {
    const res = await fetch('/api/routines')
    const data = await res.json()
    setRoutines(data ?? [])
    setLoading(false)
  }

  async function createRoutine(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    await fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setNewName('')
    setShowForm(false)
    setSaving(false)
    fetchRoutines()
  }

  async function deleteRoutine(id: string) {
    if (!confirm('Delete this routine?')) return
    await fetch(`/api/routines/${id}`, { method: 'DELETE' })
    fetchRoutines()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white">←</Link>
          <h1 className="text-xl font-bold">My Routines</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {/* Create form */}
        {showForm && (
          <form
            onSubmit={createRoutine}
            className="bg-gray-900 rounded-2xl p-4 space-y-3 border border-blue-500/40"
          >
            <p className="font-semibold">New routine</p>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Push Day, Leg Day..."
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewName('') }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Routines list */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : routines.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="text-gray-400">No routines yet</p>
            <p className="text-gray-600 text-sm mt-1">Create your first routine to get started</p>
          </div>
        ) : (
          routines.map((routine) => (
            <div key={routine.id} className="bg-gray-900 rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{routine.name}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {routine.routine_exercises.length} exercise{routine.routine_exercises.length !== 1 ? 's' : ''}
                  </p>
                  {routine.routine_exercises.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {routine.routine_exercises.map((e) => e.exercise_name).join(' · ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteRoutine(routine.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/workouts/${routine.id}`}
                  className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg py-2 transition-colors"
                >
                  Edit exercises
                </Link>
                <Link
                  href={`/workouts/${routine.id}/session`}
                  className="flex-1 text-center bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
                >
                  Start workout →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex">
        {[
          { href: '/', label: 'Home', icon: '🏠' },
          { href: '/workouts', label: 'Workout', icon: '🏋️' },
          { href: '/diet', label: 'Diet', icon: '🥗' },
          { href: '/goals', label: 'Goals', icon: '🎯' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center py-3 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs mt-0.5">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
