'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleSignIn() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  async function handleSignUp() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    if (error) setError(error.message)
    else setError('Check your email to confirm your account!')
    setLoading(false)
  }

  return (
    <main style={{
      minHeight: '100vh', background: '#080808', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .glow { position: fixed; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(99,255,180,0.06) 0%, transparent 70%); top: -100px; left: -100px; pointer-events: none; }
        .glow2 { position: fixed; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(99,180,255,0.04) 0%, transparent 70%); bottom: 0; right: 0; pointer-events: none; }
        .grid { position: fixed; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 60px 60px; }
        input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 13px 16px; color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
        input:focus { border-color: rgba(99,255,180,0.4); }
        input::placeholder { color: rgba(255,255,255,0.2); }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #63ffb4; animation: pulse 2s infinite; display: inline-block; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div className="glow" />
      <div className="glow2" />
      <div className="grid" />

      <div style={{ position: 'relative', zIndex: 10, width: 420, padding: 20 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#63ffb4,#63b4ff)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L3 7v6l7 5 7-5V7L10 2z" stroke="#080808" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 8v4M8 10h4" stroke="#080808" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Zenth</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(99,255,180,0.08)', border: '1px solid rgba(99,255,180,0.15)', borderRadius: 20, padding: '4px 12px', width: 'fit-content', margin: '0 auto 8px' }}>
            <span className="dot" /><span style={{ fontSize: 11, color: 'rgba(99,255,180,0.7)' }}>Your performance OS</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 }}>Peak is a direction, not a destination</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 36, backdropFilter: 'blur(20px)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 32 }}>
            {(['signin', 'signup'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: 9, textAlign: 'center', fontSize: 13, fontWeight: 500,
                borderRadius: 7, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)'
              }}>{t === 'signin' ? 'Sign In' : 'Create Account'}</button>
            ))}
          </div>

          {/* Fields */}
          {tab === 'signup' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Full Name</label>
              <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {error && <p style={{ fontSize: 13, color: error.includes('Check') ? '#63ffb4' : '#ff6363', marginBottom: 12 }}>{error}</p>}

          <button onClick={tab === 'signin' ? handleSignIn : handleSignUp} disabled={loading} style={{
            width: '100%', padding: 14, background: 'linear-gradient(135deg,#63ffb4,#63b4ff)',
            border: 'none', borderRadius: 10, fontFamily: "'Syne',sans-serif", fontSize: 14,
            fontWeight: 700, color: '#080808', cursor: 'pointer', letterSpacing: 0.3, marginTop: 8, opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Loading...' : tab === 'signin' ? 'Enter Zenth →' : 'Start Your Journey →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
          Peak is a direction, not a destination.
        </p>
      </div>
    </main>
  )
}