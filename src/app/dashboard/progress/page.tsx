'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

type VolumeData = { date: string; volume: number }
type FrequencyData = { week: string; workouts: number }
type PR = { exercise: string; weight: number; reps: number; date: string }

export default function Progress() {
  const [tab, setTab] = useState<'volume' | 'prs'>('volume')
  const [volumeData, setVolumeData] = useState<VolumeData[]>([])
  const [frequencyData, setFrequencyData] = useState<FrequencyData[]>([])
  const [prs, setPRs] = useState<PR[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, started_at, finished_at')
      .not('finished_at', 'is', null)
      .order('started_at')

    if (!workouts) { setLoading(false); return }

    // Volume per workout
    const volumeByWorkout: VolumeData[] = []
    
    for (const w of workouts) {
      const { data: sets } = await supabase
        .from('sets')
        .select('weight, reps, workout_exercise_id, workout_exercises!inner(workout_id)')
        .eq('workout_exercises.workout_id', w.id)

      const total = (sets || []).reduce((sum, s) => sum + (s.weight * s.reps), 0)
      volumeByWorkout.push({
        date: new Date(w.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: total
      })
    }
    setVolumeData(volumeByWorkout)

    // Frequency per week
    const weekMap: Record<string, number> = {}
    for (const w of workouts) {
      const date = new Date(w.started_at)
      const week = `W${getWeekNumber(date)}`
      weekMap[week] = (weekMap[week] || 0) + 1
    }
    setFrequencyData(Object.entries(weekMap).map(([week, workouts]) => ({ week, workouts })))

    // PRs — best set per exercise
    const { data: allSets } = await supabase
      .from('sets')
      .select(`weight, reps, created_at, workout_exercises(exercise:exercises(name))`)
      .eq('completed', true)
      .order('weight', { ascending: false })

    const prMap: Record<string, PR> = {}
    for (const s of (allSets || []) as any[]) {
      const name = s.workout_exercises?.exercise?.name
      if (!name) continue
      if (!prMap[name] || s.weight > prMap[name].weight) {
        prMap[name] = { exercise: name, weight: s.weight, reps: s.reps, date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
      }
    }
    setPRs(Object.values(prMap).sort((a, b) => b.weight - a.weight))
    setLoading(false)
  }

  function getWeekNumber(date: Date) {
    const start = new Date(date.getFullYear(), 0, 1)
    const diff = date.getTime() - start.getTime()
    const oneWeek = 1000 * 60 * 60 * 24 * 7
    return Math.floor(diff / oneWeek) + 1
  }

//   const CustomTooltip = ({ active, payload, label }: any) => {
//     if (!active || !payload?.length) return null
//     return (
//       <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
//         <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</p>
//         <p style={{ fontSize: 14, fontWeight: 600, color: '#63ffb4' }}>{payload[0].value.toLocaleString()} {tab === 'volume' ? 'kg' : 'sessions'}</p>
//       </div>
//     )
//   }

const VolumeTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#63ffb4' }}>{payload[0].value.toLocaleString()} kg</p>
      </div>
    )
  }
  
  const FrequencyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#63b4ff' }}>{payload[0].value} sessions</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Analytics</p>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>Progress</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 32 }}>
        {[{ key: 'volume', label: 'Volume & Frequency' }, { key: 'prs', label: 'Personal Records' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 500,
            border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.2s'
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading your data...</p>
      ) : tab === 'volume' ? (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Volume Chart */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Volume Per Workout</h2>
            {volumeData.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No workout data yet — complete some workouts first</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<VolumeTooltip />} />
                  <Line type="monotone" dataKey="volume" stroke="#63ffb4" strokeWidth={2} dot={{ fill: '#63ffb4', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Frequency Chart */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Workout Frequency</h2>
            {frequencyData.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No workout data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={frequencyData} >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<FrequencyTooltip />} cursor={{ fill: 'rgba(99,180,255,0.08)' }} />
                  <Bar dataKey="workouts" fill="#63b4ff" radius={[6, 6, 0, 0]} cursor="pointer" activeBar={{ fill: '#63b4ff', opacity: 0.8 }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gap: 12 }}>
            {prs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 40px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 20 }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>🏆</p>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No PRs yet</h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Complete workouts with marked sets to track your records</p>
              </div>
            ) : prs.map((pr, i) => (
              <div key={pr.exercise} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '20px 24px',
                display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 16, alignItems: 'center'
              }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.2)' }}>
                  #{i + 1}
                </span>
                <div>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{pr.exercise}</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{pr.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: '#63ffb4' }}>{pr.weight} kg</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{pr.reps} reps</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}