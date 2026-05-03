export default function Dashboard() {
    const stats = [
      { label: 'Total Workouts', value: '0', unit: 'sessions' },
      { label: 'This Week', value: '0', unit: 'sessions' },
      { label: 'Current Streak', value: '0', unit: 'days' },
      { label: 'Total Volume', value: '0', unit: 'kg' },
    ]
  
    return (
      <div style={{ padding: '40px 32px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Welcome back</p>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>Your Dashboard</h1>
        </div>
  
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '24px 28px'
            }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>{stat.label}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 40, fontWeight: 800, color: '#fff' }}>{stat.value}</span>
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
          <button style={{
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