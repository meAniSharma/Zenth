'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, streak: 0, volume: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, started_at, finished_at')
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false })

    if (!workouts) { setLoading(false); return }

    // Total workouts
    const total = workouts.length

    // This week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const thisWeek = workouts.filter(w => new Date(w.started_at) >= weekStart).length

    // Streak — consecutive days with a workout
    const days = new Set(workouts.map(w => new Date(w.started_at).toDateString()))
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      if (days.has(d.toDateString())) streak++
      else if (i > 0) break
    }

    // Total volume
    let totalVolume = 0
    for (const w of workouts) {
      const { data: sets } = await supabase
        .from('sets')
        .select('weight, reps, workout_exercises!inner(workout_id)')
        .eq('workout_exercises.workout_id', w.id)
      totalVolume += (sets || []).reduce((sum, s) => sum + (s.weight * s.reps), 0)
    }

    setStats({ total, thisWeek, streak, volume: totalVolume })
    setLoading(false)
  }

  const statCards = [
    { label: 'Total Workouts', value: stats.total.toString(), unit: 'sessions' },
    { label: 'This Week', value: stats.thisWeek.toString(), unit: 'sessions' },
    { label: 'Current Streak', value: stats.streak.toString(), unit: 'days' },
    { label: 'Total Volume', value: stats.volume >= 1000 ? `${(stats.volume / 1000).toFixed(1)}k` : stats.volume.toString(), unit: 'kg' },
  ]

  return (
    <div style={{ padding: '40px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Welcome back</p>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>Your Dashboard</h1>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
        {statCards.map((stat) => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '24px 28px'
          }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>{stat.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 40, fontWeight: 800, color: loading ? 'rgba(255,255,255,0.1)' : '#fff' }}>
                {loading ? '—' : stat.value}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Start */}
      <div style={{
        background: 'rgba(99,255,180,0.04)', border: '1px solid rgba(99,255,180,0.12)',
        borderRadius: 16, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <p style={{ fontSize: 12, color: 'rgba(99,255,180,0.6)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Ready to train?</p>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Start a Workout</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Log your session and track your progress</p>
        </div>
        <button onClick={() => router.push('/dashboard/workouts')} style={{
          background: 'linear-gradient(135deg,#63ffb4,#63b4ff)', border: 'none',
          borderRadius: 12, padding: '14px 28px', fontFamily: "'Syne',sans-serif",
          fontSize: 14, fontWeight: 700, color: '#080808', cursor: 'pointer', whiteSpace: 'nowrap'
        }}>
          + New Workout
        </button>
      </div>
    </div>
  )
}