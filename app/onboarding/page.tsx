'use client'

import { useState } from 'react'

interface Profile {
  age: string
  weight_kg: string
  height_cm: string
  gender: string
  fitness_level: string
  primary_goal: string
  equipment: string
  days_per_week: string
  diet_type: string
  allergies: string
  preferred_foods: string
  cuisines: string[]
  calorie_mode: string
}

const CUISINE_OPTIONS = [
  'Indian', 'Mediterranean', 'Asian', 'American', 'Mexican',
  'Italian', 'Middle Eastern', 'Japanese', 'Thai', 'Greek',
]

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<Profile>({
    age: '',
    weight_kg: '',
    height_cm: '',
    gender: '',
    fitness_level: '',
    primary_goal: '',
    equipment: '',
    days_per_week: '3',
    diet_type: '',
    allergies: '',
    preferred_foods: '',
    cuisines: [],
    calorie_mode: 'ai_suggest',
  })

  function set(field: keyof Profile, value: string | string[]) {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  function toggleCuisine(c: string) {
    setProfile(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(c)
        ? prev.cuisines.filter(x => x !== c)
        : [...prev.cuisines, c],
    }))
  }

  async function handleSkip() {
    await fetch('/api/user-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarding_completed: true }),
    })
    window.location.href = '/'
  }

  async function handleGenerate() {
    setStep(5)
    setError('')
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: profile.age ? parseInt(profile.age) : undefined,
          weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : undefined,
          height_cm: profile.height_cm ? parseFloat(profile.height_cm) : undefined,
          gender: profile.gender || undefined,
          fitness_level: profile.fitness_level || undefined,
          primary_goal: profile.primary_goal || undefined,
          equipment: profile.equipment || undefined,
          days_per_week: profile.days_per_week ? parseInt(profile.days_per_week) : 3,
          diet_type: profile.diet_type || undefined,
          allergies: profile.allergies || undefined,
          preferred_foods: profile.preferred_foods || undefined,
          cuisines: profile.cuisines.length ? profile.cuisines : undefined,
          calorie_mode: profile.calorie_mode,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep(4)
    }
  }

  const inputClass = 'w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm text-gray-400 mb-1'
  const btnPrimary = 'w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg py-2.5 transition-colors'
  const btnSecondary = 'w-full text-sm text-gray-400 hover:text-white transition-colors mt-2'

  // Step 5 — full-screen loading
  if (step === 5) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Claude is building your plan…</h2>
          <p className="text-gray-400 mt-1">This takes about 15–20 seconds</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🤖</div>
          <h1 className="text-2xl font-bold text-white">Welcome to FitBuddy</h1>
          <p className="text-gray-400 mt-1">Claude will create a personalised workout & meal plan</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 === step ? 'w-6 bg-blue-500' : i + 1 < step ? 'w-2 bg-blue-700' : 'w-2 bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          {/* Step 1 — About You */}
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-white">Step 1 — About You</h2>

              <div>
                <label className={labelClass}>Age</label>
                <input type="number" value={profile.age} onChange={e => set('age', e.target.value)}
                  className={inputClass} placeholder="e.g. 28" min="10" max="100" />
              </div>

              <div>
                <label className={labelClass}>Weight (kg)</label>
                <input type="number" value={profile.weight_kg} onChange={e => set('weight_kg', e.target.value)}
                  className={inputClass} placeholder="e.g. 75" min="30" max="300" />
              </div>

              <div>
                <label className={labelClass}>Height (cm)</label>
                <input type="number" value={profile.height_cm} onChange={e => set('height_cm', e.target.value)}
                  className={inputClass} placeholder="e.g. 175" min="100" max="250" />
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <select value={profile.gender} onChange={e => set('gender', e.target.value)} className={inputClass}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / prefer not to say</option>
                </select>
              </div>

              <button className={btnPrimary} onClick={() => setStep(2)}>Next</button>
              <button className={btnSecondary} onClick={handleSkip}>I&apos;ll set up manually →</button>
            </>
          )}

          {/* Step 2 — Fitness Profile */}
          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-white">Step 2 — Fitness Profile</h2>

              <div>
                <label className={labelClass}>Fitness level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                    <button key={level} onClick={() => set('fitness_level', level)}
                      className={`py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                        profile.fitness_level === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Primary goal</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'lose_weight', label: 'Lose weight' },
                    { value: 'build_muscle', label: 'Build muscle' },
                    { value: 'improve_endurance', label: 'Improve endurance' },
                    { value: 'stay_healthy', label: 'Stay healthy' },
                  ].map(({ value, label }) => (
                    <button key={value} onClick={() => set('primary_goal', value)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        profile.primary_goal === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg py-2.5 transition-colors">
                  Back
                </button>
                <button onClick={() => setStep(3)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg py-2.5 transition-colors">
                  Next
                </button>
              </div>
              <button className={btnSecondary} onClick={handleSkip}>I&apos;ll set up manually →</button>
            </>
          )}

          {/* Step 3 — Your Setup */}
          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-white">Step 3 — Your Setup</h2>

              <div>
                <label className={labelClass}>Equipment available</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'bodyweight', label: 'Bodyweight only', sub: 'No equipment needed' },
                    { value: 'dumbbells', label: 'Dumbbells at home', sub: 'Basic home setup' },
                    { value: 'full_gym', label: 'Full gym access', sub: 'Machines, barbells, cables' },
                  ].map(({ value, label, sub }) => (
                    <button key={value} onClick={() => set('equipment', value)}
                      className={`py-3 px-4 rounded-lg text-left transition-colors ${
                        profile.equipment === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>
                      <div className="font-medium text-sm">{label}</div>
                      <div className={`text-xs mt-0.5 ${profile.equipment === value ? 'text-blue-200' : 'text-gray-500'}`}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Training days per week: <span className="text-white font-semibold">{profile.days_per_week}</span></label>
                <input type="range" min="1" max="7" value={profile.days_per_week}
                  onChange={e => set('days_per_week', e.target.value)}
                  className="w-full accent-blue-500" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 day</span><span>7 days</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(2)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg py-2.5 transition-colors">
                  Back
                </button>
                <button onClick={() => setStep(4)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg py-2.5 transition-colors">
                  Next
                </button>
              </div>
              <button className={btnSecondary} onClick={handleSkip}>I&apos;ll set up manually →</button>
            </>
          )}

          {/* Step 4 — Diet Preferences */}
          {step === 4 && (
            <>
              <h2 className="text-lg font-semibold text-white">Step 4 — Diet Preferences</h2>

              <div>
                <label className={labelClass}>Diet type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'non_vegetarian', label: 'Non-vegetarian' },
                    { value: 'vegetarian', label: 'Vegetarian' },
                    { value: 'vegan', label: 'Vegan' },
                    { value: 'pescatarian', label: 'Pescatarian' },
                  ].map(({ value, label }) => (
                    <button key={value} onClick={() => set('diet_type', value)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        profile.diet_type === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Allergies / restrictions (optional)</label>
                <input type="text" value={profile.allergies} onChange={e => set('allergies', e.target.value)}
                  className={inputClass} placeholder="e.g. nuts, dairy, gluten" />
              </div>

              <div>
                <label className={labelClass}>Foods I prefer (optional)</label>
                <input type="text" value={profile.preferred_foods} onChange={e => set('preferred_foods', e.target.value)}
                  className={inputClass} placeholder="e.g. chicken, rice, spinach, eggs, oats, banana" />
              </div>

              <div>
                <label className={labelClass}>Favourite cuisines (optional, pick any)</label>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map(c => (
                    <button key={c} onClick={() => toggleCuisine(c)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        profile.cuisines.includes(c)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Calorie target</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => set('calorie_mode', 'ai_suggest')}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      profile.calorie_mode === 'ai_suggest'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}>
                    Let Claude decide
                  </button>
                  <button onClick={() => set('calorie_mode', 'self_set')}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      profile.calorie_mode === 'self_set'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}>
                    I&apos;ll set it myself
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                  {error} — please try again.
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(3)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg py-2.5 transition-colors">
                  Back
                </button>
                <button onClick={handleGenerate}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg py-2.5 transition-colors">
                  Generate My Plan ✨
                </button>
              </div>
              <button className={btnSecondary} onClick={handleSkip}>I&apos;ll set up manually →</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
