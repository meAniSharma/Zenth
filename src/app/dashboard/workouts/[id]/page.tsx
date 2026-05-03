'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

type Set = { id: string; set_number: number; weight: number; reps: number; completed: boolean }
type WorkoutExercise = { id: string; order_index: number; exercise: { name: string; muscle_group: string }; sets: Set[] }
type Workout = { id: string; name: string; started_at: string; finished_at: string | null; notes: string | null }

export default function WorkoutDetail() {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => { fetchWorkout() }, [])

  async function fetchWorkout() {
    const { data: workoutData } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single()

    const { data: exercisesData } = await supabase
      .from('workout_exercises')
      .select(`id, order_index, exercise:exercises(name, muscle_group), sets(id, set_number, weight, reps, completed)`)
      .eq('workout_id', id)
      .order('order_index')

    setWorkout(workoutData)
    setExercises((exercisesData as any) || [])
    setLoading(false)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  function formatDuration(start: string, end: string | null) {
    if (!end) return 'In progress'
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
    return `${mins} min`
  }

  function totalVolume() {
    return exercises.reduce((total, we) =>
      total + we.sets.reduce((s, set) => s + (set.weight * set.reps), 0), 0
    )
  }

  if (loading) return <div style={{ color: '#fff', padding: 40 }}>Loading...</div>
  if (!workout) return <div style={{ color: '#fff', padding: 40 }}>Workout not found</div>

  return (
    <div style={{ padding: '40px 32px', maxWidth: 800, margin: '0 auto', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');`}</style>

      {/* Back */}
      <button onClick={() => router.push('/dashboard/workouts')} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
        fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0, fontFamily: "'DM Sans',sans-serif"
      }}>← Back to Workouts</button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 8 }}>{workout.name}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{formatDate(workout.started_at)}</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Duration', value: formatDuration(workout.started_at, workout.finished_at) },
          { label: 'Exercises', value: `${exercises.length}` },
          { label: 'Total Volume', value: `${totalVolume().toLocaleString()} kg` },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '20px'
          }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{stat.label}</p>
            <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Exercises */}
      <div style={{ display: 'grid', gap: 16 }}>
        {exercises.map(we => (
          <div key={we.id} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>{we.exercise.name}</h3>
              <span style={{ fontSize: 11, color: 'rgba(99,255,180,0.7)', background: 'rgba(99,255,180,0.08)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(99,255,180,0.15)' }}>
                {we.exercise.muscle_group}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
              {['Set', 'Weight', 'Reps', 'Volume'].map(h => (
                <span key={h} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</span>
              ))}
            </div>

            {we.sets.sort((a, b) => a.set_number - b.set_number).map(set => (
              <div key={set.id} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr',
                gap: 8, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.04)',
                opacity: set.completed ? 1 : 0.5
              }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{set.set_number}</span>
                <span style={{ fontSize: 13, color: '#fff' }}>{set.weight} kg</span>
                <span style={{ fontSize: 13, color: '#fff' }}>{set.reps} reps</span>
                <span style={{ fontSize: 13, color: 'rgba(99,255,180,0.7)' }}>{(set.weight * set.reps).toLocaleString()} kg</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}