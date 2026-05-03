'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Workout = {
  id: string
  name: string
  started_at: string
  finished_at: string | null
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchWorkouts()
  }, [])

  async function fetchWorkouts() {
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false })
    setWorkouts(data || [])
    setLoading(false)
  }

  async function startWorkout(blank: boolean) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const name = workoutName.trim() || 'My Workout'
    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, name })
      .select()
      .single()

    if (error || !data) return
    router.push(`/dashboard/workouts/active?id=${data.id}`)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function formatDuration(start: string, end: string | null) {
    if (!end) return 'In progress'
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
    return `${mins} min`
  }

  return (
    <div style={{ padding: '40px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .workout-card:hover { border-color: rgba(255,255,255,0.15) !important; transform: translateY(-1px); }
        .workout-card { transition: all 0.2s; }
        input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 13px 16px; color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; }
        input:focus { border-color: rgba(99,255,180,0.4); }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Training</p>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>Workouts</h1>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background: 'linear-gradient(135deg,#63ffb4,#63b4ff)', border: 'none',
          borderRadius: 12, padding: '12px 24px', fontFamily: "'Syne',sans-serif",
          fontSize: 14, fontWeight: 700, color: '#080808', cursor: 'pointer'
        }}>+ New Workout</button>
      </div>

      {/* Workout List */}
      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading...</p>
      ) : workouts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 20
        }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🏋️</p>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No workouts yet</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Start your first session and begin tracking your progress</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {workouts.map(workout => (
            <div key={workout.id} className="workout-card" onClick={() => router.push(`/dashboard/workouts/${workout.id}`)} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '20px 24px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{workout.name}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{formatDate(workout.started_at)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{formatDuration(workout.started_at, workout.finished_at)}</p>
                {!workout.finished_at && (
                  <span style={{ fontSize: 11, background: 'rgba(99,255,180,0.1)', color: '#63ffb4', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(99,255,180,0.2)' }}>Active</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Workout Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#111', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: 36, width: 420
          }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Start Workout</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Name your session or leave blank</p>

            <input
              placeholder="e.g. Push Day, Leg Day..."
              value={workoutName}
              onChange={e => setWorkoutName(e.target.value)}
              style={{ marginBottom: 24 }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => startWorkout(true)} style={{
                background: 'linear-gradient(135deg,#63ffb4,#63b4ff)', border: 'none',
                borderRadius: 12, padding: '14px', fontFamily: "'Syne',sans-serif",
                fontSize: 14, fontWeight: 700, color: '#080808', cursor: 'pointer'
              }}>Blank Workout</button>
              <button onClick={() => startWorkout(false)} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '14px', fontFamily: "'Syne',sans-serif",
                fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer'
              }}>From Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}