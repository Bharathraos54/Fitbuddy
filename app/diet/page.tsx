'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type MealLog = { id: string; food_name: string; calories: number; meal_type: string }
type FoodResult = {
  id: string
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
}
type MealPlanItem = { id: string; food_name: string; calories: number; meal_type: string }
type MealPlan = { id: string; name: string; is_active: boolean; meal_plan_items: MealPlanItem[] }

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const MEAL_EMOJI: Record<string, string> = { breakfast: '🍳', lunch: '🍱', dinner: '🍽️', snack: '🍎' }

export default function DietPage() {
  const [logs, setLogs] = useState<MealLog[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<string>('breakfast')
  const [showSearch, setShowSearch] = useState(false)
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'today' | 'plan'>('today')

  const activePlan = mealPlans.find((p) => p.is_active)
  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0)

  const fetchData = useCallback(async () => {
    const [logsRes, plansRes] = await Promise.all([
      fetch('/api/meal-logs'),
      fetch('/api/meal-plans'),
    ])
    setLogs(await logsRes.json())
    setMealPlans(await plansRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Debounced food search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.products ?? [])
      setSearching(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  async function logFood(food: FoodResult, grams = 100) {
    const calories = Math.round((food.calories_per_100g * grams) / 100)
    await fetch('/api/meal-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_name: food.name, calories, meal_type: selectedMealType }),
    })
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    fetchData()
  }

  async function logPlanItem(item: MealPlanItem) {
    await fetch('/api/meal-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        food_name: item.food_name,
        calories: item.calories,
        meal_type: item.meal_type,
        meal_plan_item_id: item.id,
      }),
    })
    fetchData()
  }

  async function deleteLog(id: string) {
    await fetch('/api/meal-logs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchData()
  }

  async function createPlan() {
    if (!newPlanName.trim()) return
    await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPlanName.trim() }),
    })
    setNewPlanName('')
    setShowNewPlan(false)
    fetchData()
  }

  const loggedMealTypes = new Set(logs.map((l) => l.meal_type))

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" className="text-gray-400 hover:text-white">←</Link>
          <h1 className="text-xl font-bold">Diet</h1>
          <span className="ml-auto text-sm font-semibold text-blue-400">{totalCalories} kcal today</span>
        </div>
        {/* Tabs */}
        <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
          {(['today', 'plan'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {tab === 'today' ? "Today's Log" : 'Meal Plan'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* TODAY TAB */}
        {activeTab === 'today' && (
          <>
            {/* Log food button */}
            <button
              onClick={() => setShowSearch(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl py-3 transition-colors"
            >
              + Log Food
            </button>

            {/* Food search modal */}
            {showSearch && (
              <div className="bg-gray-900 rounded-2xl p-4 space-y-3 border border-blue-500/40">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Search food</p>
                  <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Meal type selector */}
                <div className="flex gap-2 flex-wrap">
                  {MEAL_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedMealType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${selectedMealType === type ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                      {MEAL_EMOJI[type]} {type}
                    </button>
                  ))}
                </div>

                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search foods (e.g. chicken breast, rice...)"
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />

                {searching && <p className="text-sm text-gray-400 text-center">Searching...</p>}

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((food) => (
                      <div key={food.id} className="bg-gray-800 rounded-xl px-3 py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium leading-tight">{food.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {food.calories_per_100g} kcal · {food.protein_per_100g}g protein per 100g
                          </p>
                        </div>
                        <button
                          onClick={() => logFood(food)}
                          className="ml-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                        >
                          + 100g
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && !searching && searchResults.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">No results found</p>
                )}
              </div>
            )}

            {/* Meals by type */}
            {MEAL_TYPES.map((mealType) => {
              const mealLogs = logs.filter((l) => l.meal_type === mealType)
              const mealCalories = mealLogs.reduce((s, l) => s + l.calories, 0)
              return (
                <div key={mealType} className="bg-gray-900 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold capitalize">
                      {MEAL_EMOJI[mealType]} {mealType}
                    </h2>
                    <span className="text-sm text-gray-400">{mealCalories} kcal</span>
                  </div>
                  {mealLogs.length === 0 ? (
                    <p className="text-sm text-gray-600">Nothing logged yet</p>
                  ) : (
                    <div className="space-y-1">
                      {mealLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{log.food_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400">{log.calories} kcal</span>
                            <button onClick={() => deleteLog(log.id)} className="text-gray-600 hover:text-red-400 transition-colors">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* PLAN TAB */}
        {activeTab === 'plan' && (
          <>
            {!activePlan ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-4xl">🥗</p>
                <p className="text-gray-400">No meal plan yet</p>
                <button
                  onClick={() => setShowNewPlan(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Create Meal Plan
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{activePlan.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Active plan · {activePlan.meal_plan_items.length} meals</p>
                  </div>
                  <button
                    onClick={() => setShowNewPlan(true)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    New plan
                  </button>
                </div>

                {MEAL_TYPES.map((mealType) => {
                  const items = activePlan.meal_plan_items.filter((i) => i.meal_type === mealType)
                  const isLogged = loggedMealTypes.has(mealType)
                  return (
                    <div key={mealType} className="bg-gray-900 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium capitalize">{MEAL_EMOJI[mealType]} {mealType}</h3>
                        {isLogged && <span className="text-xs text-green-400">✓ Logged</span>}
                      </div>
                      {items.length === 0 ? (
                        <p className="text-xs text-gray-600">No meals in plan for {mealType}</p>
                      ) : (
                        items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
                            <div>
                              <p className="text-sm font-medium">{item.food_name}</p>
                              <p className="text-xs text-gray-400">{item.calories} kcal</p>
                            </div>
                            <button
                              onClick={() => logPlanItem(item)}
                              disabled={isLogged}
                              className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {isLogged ? 'Done' : 'Log it'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )
                })}
              </>
            )}

            {/* New plan form */}
            {showNewPlan && (
              <div className="bg-gray-900 rounded-2xl p-4 space-y-3 border border-blue-500/40">
                <p className="font-semibold">New meal plan</p>
                <input
                  autoFocus
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. Cutting Plan, Bulk Phase..."
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button onClick={createPlan} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg py-2 transition-colors">Create</button>
                  <button onClick={() => setShowNewPlan(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </>
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
          <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center py-3 text-gray-400 hover:text-white transition-colors">
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs mt-0.5">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
