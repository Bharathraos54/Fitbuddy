'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type StrengthGoal = {
  id: string
  exercise_name: string
  target_weight_kg: number
  created_at: string
}

type BestLift = {
  exercise_name: string
  best_weight_kg: number
}

type FrequencyGoal = {
  id: string
  target_days_per_week: number
} | null

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/workouts', label: 'Workout', icon: '🏋️' },
  { href: '/diet', label: 'Diet', icon: '🥗' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
]

export default function GoalsPage() {
  // Strength goals state
  const [strengthGoals, setStrengthGoals] = useState<StrengthGoal[]>([])
  const [bestLifts, setBestLifts] = useState<BestLift[]>([])
  const [newExercise, setNewExercise] = useState('')
  const [newTargetKg, setNewTargetKg] = useState('')
  const [showStrengthForm, setShowStrengthForm] = useState(false)
  const [savingStrength, setSavingStrength] = useState(false)

  // Frequency goal state
  const [freqGoal, setFreqGoal] = useState<FrequencyGoal>(null)
  const [weeklyCount, setWeeklyCount] = useState(0)
  const [newFreqDays, setNewFreqDays] = useState('')
  const [showFreqForm, setShowFreqForm] = useState(false)
  const [savingFreq, setSavingFreq] = useState(false)

  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [strengthRes, bestRes, freqRes, weekRes] = await Promise.all([
      fetch('/api/goals/strength'),
      fetch('/api/progress/best-lifts'),
      fetch('/api/goals/frequency'),
      fetch('/api/sessions/weekly-count'),
    ])

    const [strengthData, bestData, freqData, weekData] = await Promise.all([
      strengthRes.json(),
      bestRes.json(),
      freqRes.json(),
      weekRes.json(),
    ])

    setStrengthGoals(Array.isArray(strengthData) ? strengthData : [])
    setBestLifts(Array.isArray(bestData) ? bestData : [])
    setFreqGoal(freqData ?? null)
    setWeeklyCount(typeof weekData?.count === 'number' ? weekData.count : 0)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function getBestForExercise(exerciseName: string): number {
    const match = bestLifts.find(
      (b) => b.exercise_name.toLowerCase() === exerciseName.toLowerCase()
    )
    return match?.best_weight_kg ?? 0
  }

  async function addStrengthGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!newExercise.trim() || !newTargetKg) return
    setSavingStrength(true)
    await fetch('/api/goals/strength', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_name: newExercise.trim(),
        target_weight_kg: parseFloat(newTargetKg),
      }),
    })
    setNewExercise('')
    setNewTargetKg('')
    setShowStrengthForm(false)
    setSavingStrength(false)
    fetchAll()
  }

  async function deleteStrengthGoal(id: string) {
    if (!confirm('Delete this goal?')) return
    await fetch('/api/goals/strength', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchAll()
  }

  async function saveFreqGoal(e: React.FormEvent) {
    e.preventDefault()
    const days = parseInt(newFreqDays, 10)
    if (!days || days < 1 || days > 7) return
    setSavingFreq(true)
    await fetch('/api/goals/frequency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_days_per_week: days }),
    })
    setNewFreqDays('')
    setShowFreqForm(false)
    setSavingFreq(false)
    fetchAll()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white">←</Link>
          <h1 className="text-xl font-bold">Goals</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* ── Strength Goals ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Strength Goals</h2>
            <button
              onClick={() => setShowStrengthForm(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + Add Goal
            </button>
          </div>

          {/* Add strength goal form */}
          {showStrengthForm && (
            <form
              onSubmit={addStrengthGoal}
              className="bg-gray-900 rounded-2xl p-4 space-y-3 border border-blue-500/40"
            >
              <p className="font-semibold">New strength goal</p>
              <input
                autoFocus
                type="text"
                value={newExercise}
                onChange={(e) => setNewExercise(e.target.value)}
                placeholder="Exercise name (e.g. Bench Press)"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newTargetKg}
                  onChange={(e) => setNewTargetKg(e.target.value)}
                  placeholder="Target weight (kg)"
                  className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingStrength}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
                >
                  {savingStrength ? 'Saving...' : 'Save Goal'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowStrengthForm(false); setNewExercise(''); setNewTargetKg('') }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Strength goal cards */}
          {strengthGoals.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-gray-400">No strength goals yet</p>
              <p className="text-gray-600 text-sm mt-1">Add a goal to track your progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {strengthGoals.map((goal) => {
                const current = getBestForExercise(goal.exercise_name)
                const target = goal.target_weight_kg
                const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
                const achieved = pct >= 100

                return (
                  <div key={goal.id} className="bg-gray-900 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{goal.exercise_name}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {current > 0 ? `${current} kg` : 'No lifts yet'} &rarr; {target} kg target
                        </p>
                      </div>
                      <button
                        onClick={() => deleteStrengthGoal(goal.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none ml-3"
                        aria-label="Delete goal"
                      >
                        ×
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{pct}% of target</span>
                        {achieved && <span className="text-green-400 font-semibold">Goal reached!</span>}
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${achieved ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Workout Frequency ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Workout Frequency</h2>
            <button
              onClick={() => {
                setNewFreqDays(freqGoal ? String(freqGoal.target_days_per_week) : '')
                setShowFreqForm(true)
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {freqGoal ? 'Edit' : 'Set Goal'}
            </button>
          </div>

          {/* Current frequency goal card */}
          <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
            {freqGoal ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Weekly target</p>
                    <p className="text-2xl font-bold mt-0.5">
                      {freqGoal.target_days_per_week}
                      <span className="text-base font-normal text-gray-400 ml-1">days / week</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">This week</p>
                    <p className="text-2xl font-bold mt-0.5">
                      {weeklyCount}
                      <span className="text-base font-normal text-gray-400 ml-1">done</span>
                    </p>
                  </div>
                </div>

                {/* Frequency progress bar */}
                <div className="space-y-1">
                  {(() => {
                    const freqPct = Math.min(100, Math.round((weeklyCount / freqGoal.target_days_per_week) * 100))
                    const freqAchieved = freqPct >= 100
                    return (
                      <>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{weeklyCount} of {freqGoal.target_days_per_week} sessions</span>
                          {freqAchieved && <span className="text-green-400 font-semibold">Week complete!</span>}
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${freqAchieved ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${freqPct}%` }}
                          />
                        </div>
                      </>
                    )
                  })()}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400">No frequency goal set yet</p>
                <p className="text-gray-600 text-sm mt-1">Set a weekly workout target to stay consistent</p>
              </div>
            )}
          </div>

          {/* Edit frequency form */}
          {showFreqForm && (
            <form
              onSubmit={saveFreqGoal}
              className="bg-gray-900 rounded-2xl p-4 space-y-3 border border-blue-500/40"
            >
              <p className="font-semibold">{freqGoal ? 'Update' : 'Set'} weekly frequency goal</p>
              <div className="flex items-center gap-3">
                <input
                  autoFocus
                  type="number"
                  min="1"
                  max="7"
                  value={newFreqDays}
                  onChange={(e) => setNewFreqDays(e.target.value)}
                  placeholder="Days per week (1–7)"
                  className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400 text-sm whitespace-nowrap">days / week</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingFreq}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
                >
                  {savingFreq ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowFreqForm(false); setNewFreqDays('') }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex">
        {NAV_ITEMS.map((item) => (
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
