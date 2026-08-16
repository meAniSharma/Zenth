'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

type Message = { role: 'user' | 'assistant'; content: string }

export default function Coach() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey, I'm your Zenth Coach. I have access to your training data — ask me anything about your workouts, progress, programming, or recovery." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => { buildContext() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function buildContext() {
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, name, started_at, finished_at')
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(10)

    if (!workouts?.length) {
      setContext('User has no workout history yet.')
      return
    }

    let ctx = `User's recent workouts (last ${workouts.length}):\n`
    for (const w of workouts) {
      const duration = w.finished_at
        ? Math.round((new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 60000)
        : 0

      const { data: sets } = await supabase
        .from('sets')
        .select('weight, reps, workout_exercises!inner(workout_id, exercise:exercises(name))')
        .eq('workout_exercises.workout_id', w.id)
        .eq('completed', true)

      const volume = (sets || []).reduce((s, set) => s + set.weight * set.reps, 0)
      const exerciseNames = [...new Set((sets || []).map((s: any) => s.workout_exercises?.exercise?.name).filter(Boolean))]

      ctx += `\n- ${w.name} on ${new Date(w.started_at).toDateString()}: ${duration} mins, ${volume}kg total volume, exercises: ${exerciseNames.join(', ')}`
    }

    const { data: prs } = await supabase
      .from('sets')
      .select('weight, reps, workout_exercises(exercise:exercises(name))')
      .eq('completed', true)
      .order('weight', { ascending: false })
      .limit(50)

    const prMap: Record<string, number> = {}
    for (const s of (prs || []) as any[]) {
      const name = s.workout_exercises?.exercise?.name
      if (name && (!prMap[name] || s.weight > prMap[name])) prMap[name] = s.weight
    }

    ctx += `\n\nPersonal Records:\n`
    Object.entries(prMap).forEach(([ex, weight]) => { ctx += `- ${ex}: ${weight}kg\n` })

    setContext(ctx)
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    }

    setLoading(false)
  }

  function formatMessage(text: string) {
    return text.split('\n').map((line, i) => (
      <span key={i}>{line}<br /></span>
    ))
  }

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea { resize: none; outline: none; border: none; background: transparent; color: #fff; font-family: 'DM Sans',sans-serif; font-size: 14px; width: 100%; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 14
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg,#63ffb4,#63b4ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18
        }}>⚡</div>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: '#fff' }}>Zenth Coach</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>AI powered by your training data</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#63ffb4', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg,#63ffb4,#63b4ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, marginRight: 10, marginTop: 2
              }}>⚡</div>
            )}
            <div style={{
              maxWidth: '70%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg,rgba(99,255,180,0.15),rgba(99,180,255,0.15))' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(99,255,180,0.2)' : 'rgba(255,255,255,0.08)'}`,
              fontSize: 14, color: '#fff', lineHeight: 1.6
            }}>
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg,#63ffb4,#63b4ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
            }}>⚡</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#63ffb4',
                  animation: `bounce 1s infinite ${i * 0.2}s`
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 32px 24px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '14px 16px',
          display: 'flex', alignItems: 'flex-end', gap: 12
        }}>
          <textarea
            rows={1}
            placeholder="Ask your coach anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            style={{ maxHeight: 120 }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: input.trim() ? 'linear-gradient(135deg,#63ffb4,#63b4ff)' : 'rgba(255,255,255,0.06)',
            border: 'none', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, transition: 'all 0.2s'
          }}>→</button>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 8 }}>Press Enter to send · Shift+Enter for new line</p>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}