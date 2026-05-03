'use client'
import { useRouter ,usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const links = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Workouts', href: '/dashboard/workouts' },
    { label: 'Progress', href: '/dashboard/progress' },
    { label: 'Programs', href: '/dashboard/programs' },
    { label: 'AI Coach', href: '/dashboard/coach' },
  ]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-link { color: rgba(255,255,255,0.4); text-decoration: none; font-size: 14px; font-weight: 500; padding: 8px 14px; border-radius: 8px; transition: all 0.2s; cursor: pointer; background: none; border: none; }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .nav-link.active { color: #fff; background: rgba(255,255,255,0.08); }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 60, borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8,8,8,0.8)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', padding: '0 32px', gap: 8
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 32 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#63ffb4,#63b4ff)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 2L3 7v6l7 5 7-5V7L10 2z" stroke="#080808" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 8v4M8 10h4" stroke="#080808" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: '#fff' }}>Zenth</span>
        </div>

        {/* Nav Links */}
        {links.map(link => (
          <Link key={link.href} href={link.href} style={{
            color: pathname === link.href ? '#fff' : 'rgba(255,255,255,0.4)',
            background: pathname === link.href ? 'rgba(255,255,255,0.08)' : 'transparent',
            textDecoration: 'none', fontSize: 14, fontWeight: 500,
            padding: '8px 14px', borderRadius: 8, transition: 'all 0.2s'
          }}>
            {link.label}
          </Link>
        ))}

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleSignOut} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '7px 14px', color: 'rgba(255,255,255,0.5)',
            fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif"
          }}>Sign out</button>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#63ffb4,#63b4ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#080808'
          }}>Z</div>
        </div>
      </nav>

      {/* Content */}
      <main style={{ paddingTop: 60 }}>
        {children}
      </main>
    </div>
  )
}