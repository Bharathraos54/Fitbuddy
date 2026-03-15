'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'

type WeekCount = { week: string; count: number }
type StrengthPoint = { date: string; max_weight_kg: number }
type BestLift = { exercise_name: string; best_weight_kg: number }

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/workouts', label: 'Workout', icon: '🏋️' },
  { href: '/diet', label: 'Diet', icon: '🥗' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
  { href: '/progress', label: 'Progress', icon: '📈' },
]

const tooltipStyle = {
  contentStyle: {
    background: '#1f2937',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
  },
}

export default function ProgressPage() {
  // Workout frequency state
  const [workoutHistory, setWorkoutHistory] = useState<WeekCount[]>([])
  const [workoutLoading, setWorkoutLoading] = useState(true)

  // Strength progress state
  const [exercises, setExercises] = useState<BestLift[]>([])
  const [exercisesLoading, setExercisesLoading] = useState(true)
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [strengthHistory, setStrengthHistory] = useState<StrengthPoint[]>([])
  const [strengthLoading, setStrengthLoading] = useState(false)

  // Fetch workout history on mount
  useEffect(() => {
    async function fetchWorkoutHistory() {
      try {
        const res = await fetch('/api/progress/workout-history')
        if (res.ok) {
          const data: WeekCount[] = await res.json()
          setWorkoutHistory(data)
        }
      } finally {
        setWorkoutLoading(false)
      }
    }
    fetchWorkoutHistory()
  }, [])

  // Fetch exercise list (best-lifts) on mount
  useEffect(() => {
    async function fetchExercises() {
      try {
        const res = await fetch('/api/progress/best-lifts')
        if (res.ok) {
          const data: BestLift[] = await res.json()
          setExercises(data)
          if (data.length > 0) {
            setSelectedExercise(data[0].exercise_name)
          }
        }
      } finally {
        setExercisesLoading(false)
      }
    }
    fetchExercises()
  }, [])

  // Fetch strength history when selected exercise changes
  useEffect(() => {
    if (!selectedExercise) return

    async function fetchStrengthHistory() {
      setStrengthLoading(true)
      try {
        const res = await fetch(
          `/api/progress/strength-history?exercise=${encodeURIComponent(selectedExercise)}`
        )
        if (res.ok) {
          const data: StrengthPoint[] = await res.json()
          setStrengthHistory(data)
        }
      } finally {
        setStrengthLoading(false)
      }
    }
    fetchStrengthHistory()
  }, [selectedExercise])

  // Format week label: "2026-W10" -> "W10"
  function formatWeek(week: string): string {
    const parts = week.split('-')
    return parts[1] ?? week
  }

  // Format date label: "2026-03-14" -> "Mar 14"
  function formatDate(date: string): string {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const workoutChartData = workoutHistory.map((item) => ({
    ...item,
    weekLabel: formatWeek(item.week),
  }))

  const strengthChartData = strengthHistory.map((item) => ({
    ...item,
    dateLabel: formatDate(item.date),
  }))

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          ←
        </Link>
        <h1 className="text-xl font-bold">Progress</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Section 1: Workout Frequency */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
          <div>
            <h2 className="font-semibold text-white">Workout Frequency</h2>
            <p className="text-sm text-gray-400 mt-0.5">Workouts per week — last 8 weeks</p>
          </div>

          {workoutLoading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              Loading...
            </div>
          ) : workoutChartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              No workout data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={workoutChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle.contentStyle}
                  labelFormatter={(label) => `Week ${label}`}
                  formatter={(value) => [value, 'Workouts']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Section 2: Strength Progress */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
          <div>
            <h2 className="font-semibold text-white">Strength Progress</h2>
            <p className="text-sm text-gray-400 mt-0.5">Max weight lifted per session</p>
          </div>

          {exercisesLoading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              Loading exercises...
            </div>
          ) : exercises.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              No exercises logged yet
            </div>
          ) : (
            <>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                {exercises.map((ex) => (
                  <option key={ex.exercise_name} value={ex.exercise_name}>
                    {ex.exercise_name}
                  </option>
                ))}
              </select>

              {strengthLoading ? (
                <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
                  Loading...
                </div>
              ) : strengthChartData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
                  No data yet for this exercise
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={strengthChartData}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle.contentStyle}
                      formatter={(value) => [`${value} kg`, 'Max weight']}
                    />
                    <Line
                      type="monotone"
                      dataKey="max_weight_kg"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex">
        {navItems.map((item) => (
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
