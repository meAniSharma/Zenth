'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type Exercise = { id: string; name: string; muscle_group: string; equipment: string }
type Set = { id?: string; set_number: number; weight: string; reps: string; completed: boolean }
type WorkoutExercise = { id: string; exercise: Exercise; sets: Set[] }

function ActiveWorkout() {
  const [workoutName, setWorkoutName] = useState('My Workout')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('All')
  const [elapsed, setElapsed] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const startTime = useRef(Date.now())
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const workoutId = searchParams.get('id')

  useEffect(() => {
    fetchExercises()
    fetchWorkout()
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  async function fetchWorkout() {
    if (!workoutId) return
    const { data } = await supabase.from('workouts').select('name').eq('id', workoutId).single()
    if (data) setWorkoutName(data.name)
  }

  async function fetchExercises() {
    const { data } = await supabase.from('exercises').select('*').order('muscle_group')
    setAllExercises(data || [])
  }

  async function addExercise(exercise: Exercise) {
    if (!workoutId) return
    const { data } = await supabase.from('workout_exercises').insert({
      workout_id: workoutId,
      exercise_id: exercise.id,
      order_index: exercises.length
    }).select().single()

    if (data) {
      setExercises(prev => [...prev, { id: data.id, exercise, sets: [{ set_number: 1, weight: '', reps: '', completed: false }] }])
    }
    setShowExercisePicker(false)
    setSearch('')
  }

  async function addSet(weIdx: number) {
    const we = exercises[weIdx]
    const newSet: Set = { set_number: we.sets.length + 1, weight: '', reps: '', completed: false }
    setExercises(prev => prev.map((e, i) => i === weIdx ? { ...e, sets: [...e.sets, newSet] } : e))
  }

  function updateSet(weIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) {
    setExercises(prev => prev.map((e, i) => i === weIdx ? {
      ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s)
    } : e))
  }

  function toggleSet(weIdx: number, setIdx: number) {
    setExercises(prev => prev.map((e, i) => i === weIdx ? {
      ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, completed: !s.completed } : s)
    } : e))
  }

  async function finishWorkout() {
    if (!workoutId) return
    setFinishing(true)

    for (const we of exercises) {
      for (const set of we.sets) {
        if (set.weight || set.reps) {
          await supabase.from('sets').insert({
            workout_exercise_id: we.id,
            set_number: set.set_number,
            weight: parseFloat(set.weight) || 0,
            reps: parseInt(set.reps) || 0,
            completed: set.completed
          })
        }
      }
    }

    await supabase.from('workouts').update({ finished_at: new Date().toISOString() }).eq('id', workoutId)
    router.push('/dashboard/workouts')
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const muscleGroups = ['All', ...Array.from(new Set(allExercises.map(e => e.muscle_group)))]
  const filtered = allExercises.filter(e =>
    (selectedGroup === 'All' || e.muscle_group === selectedGroup) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 14px; color: #fff; font-size: 14px; font-family: 'DM Sans',sans-serif; outline: none; width: 100%; }
        input:focus { border-color: rgba(99,255,180,0.4); }
        input::placeholder { color: rgba(255,255,255,0.2); }
        .ex-row:hover { background: rgba(255,255,255,0.05) !important; }
      `}</style>

      {/* Top Bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60,
        background: 'rgba(8,8,8,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center',
        padding: '0 32px', justifyContent: 'space-between'
      }}>
        <div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: '#fff' }}>{workoutName}</span>
          <span style={{ fontSize: 13, color: '#63ffb4', marginLeft: 16, fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/dashboard/workouts')} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '8px 16px', color: 'rgba(255,255,255,0.5)',
            fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif"
          }}>Cancel</button>
          <button onClick={finishWorkout} disabled={finishing} style={{
            background: 'linear-gradient(135deg,#63ffb4,#63b4ff)', border: 'none',
            borderRadius: 8, padding: '8px 20px', fontFamily: "'Syne',sans-serif",
            fontSize: 13, fontWeight: 700, color: '#080808', cursor: 'pointer'
          }}>{finishing ? 'Saving...' : 'Finish'}</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: 80, padding: '80px 32px 120px', maxWidth: 800, margin: '0 auto' }}>

        {exercises.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 40px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 20, marginBottom: 24 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>💪</p>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No exercises yet</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Add your first exercise to get started</p>
          </div>
        )}

        {/* Exercises */}
        {exercises.map((we, weIdx) => (
          <div key={we.id} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 24, marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{we.exercise.name}</h3>
                <span style={{ fontSize: 11, color: 'rgba(99,255,180,0.7)', background: 'rgba(99,255,180,0.08)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(99,255,180,0.15)' }}>
                  {we.exercise.muscle_group}
                </span>
              </div>
            </div>

            {/* Set Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 40px', gap: 8, marginBottom: 8, padding: '0 4px' }}>
              {['Set', 'Weight (kg)', 'Reps', ''].map(h => (
                <span key={h} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</span>
              ))}
            </div>

            {/* Sets */}
            {we.sets.map((set, setIdx) => (
              <div key={setIdx} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 1fr 40px',
                gap: 8, marginBottom: 8, alignItems: 'center',
                opacity: set.completed ? 0.5 : 1, transition: 'opacity 0.2s'
              }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{set.set_number}</span>
                <input placeholder="0" value={set.weight} onChange={e => updateSet(weIdx, setIdx, 'weight', e.target.value)} style={{ textAlign: 'center' }} />
                <input placeholder="0" value={set.reps} onChange={e => updateSet(weIdx, setIdx, 'reps', e.target.value)} style={{ textAlign: 'center' }} />
                <button onClick={() => toggleSet(weIdx, setIdx)} style={{
                  width: 32, height: 32, borderRadius: 8, border: `1px solid ${set.completed ? '#63ffb4' : 'rgba(255,255,255,0.1)'}`,
                  background: set.completed ? 'rgba(99,255,180,0.15)' : 'transparent',
                  color: set.completed ? '#63ffb4' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>✓</button>
              </div>
            ))}

            <button onClick={() => addSet(weIdx)} style={{
              marginTop: 8, width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8,
              color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif"
            }}>+ Add Set</button>
          </div>
        ))}

        {/* Add Exercise Button */}
        <button onClick={() => setShowExercisePicker(true)} style={{
          width: '100%', padding: '16px', background: 'rgba(99,255,180,0.04)',
          border: '1px dashed rgba(99,255,180,0.2)', borderRadius: 16,
          color: '#63ffb4', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          fontFamily: "'DM Sans',sans-serif"
        }}>+ Add Exercise</button>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={() => setShowExercisePicker(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#111', borderRadius: '20px 20px 0 0',
            border: '1px solid rgba(255,255,255,0.1)',
            width: '100%', maxWidth: 600, maxHeight: '80vh',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '24px 24px 16px' }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Add Exercise</h2>
              <input placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} />

              {/* Muscle Group Filter */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {muscleGroups.map(g => (
                  <button key={g} onClick={() => setSelectedGroup(g)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: `1px solid ${selectedGroup === g ? 'rgba(99,255,180,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedGroup === g ? 'rgba(99,255,180,0.1)' : 'transparent',
                    color: selectedGroup === g ? '#63ffb4' : 'rgba(255,255,255,0.4)',
                    fontFamily: "'DM Sans',sans-serif"
                  }}>{g}</button>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div style={{ overflowY: 'auto', padding: '0 24px 24px' }}>
              {filtered.map(ex => (
                <div key={ex.id} className="ex-row" onClick={() => addExercise(ex)} style={{
                  padding: '14px 12px', borderRadius: 10, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'transparent', transition: 'background 0.15s'
                }}>
                  <div>
                    <p style={{ fontSize: 14, color: '#fff', fontWeight: 500, marginBottom: 2 }}>{ex.name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{ex.equipment}</p>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(99,255,180,0.7)', background: 'rgba(99,255,180,0.08)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(99,255,180,0.15)' }}>
                    {ex.muscle_group}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense>
      <ActiveWorkout />
    </Suspense>
  )
}