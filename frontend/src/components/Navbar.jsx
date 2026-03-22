import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false
  )

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth <= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const navStyle = {
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
    padding: isCompact ? '10px 14px' : '0 32px',
    display: 'flex',
    alignItems: isCompact ? 'stretch' : 'center',
    justifyContent: 'space-between',
    height: isCompact ? 'auto' : '60px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    gap: isCompact ? '10px' : '0',
    flexDirection: isCompact ? 'column' : 'row',
  }

  const linkStyle = (path) => ({
    fontSize: isCompact ? '12px' : '13px',
    color: location.pathname.startsWith(path) ? 'var(--text)' : 'var(--text2)',
    fontWeight: location.pathname.startsWith(path) ? '500' : '400',
    padding: isCompact ? '6px 10px' : '6px 12px',
    borderRadius: 'var(--radius-sm)',
    background: location.pathname.startsWith(path) ? 'rgba(108,99,255,0.12)' : 'transparent',
    transition: 'all 0.15s',
  })

  return (
    <nav style={navStyle}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:isCompact ? '10px' : '32px', width: isCompact ? '100%' : 'auto' }}>
        <Link to="/events" style={{ fontFamily:'var(--font-display)', fontSize:isCompact ? '17px' : '18px', fontWeight:'700', color:'var(--text)', whiteSpace:'nowrap' }}>
          Event<span style={{ color:'var(--accent)' }}>Hub</span>
        </Link>
        <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', justifyContent:isCompact ? 'flex-end' : 'flex-start' }}>
          <Link to="/events" style={linkStyle('/events')}>Events</Link>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" style={linkStyle('/admin')}>Admin</Link>
          )}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px', width: isCompact ? '100%' : 'auto' }}>
        <div style={{ textAlign:'left' }}>
          <div style={{ fontSize:'13px', fontWeight:'500' }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ fontSize:'11px', color:'var(--text3)' }}>{user?.role === 'ADMIN' ? '● Admin' : '● Attendee'}</div>
        </div>
        <button className="btn btn-ghost" style={{ padding:isCompact ? '6px 10px' : '7px 14px', fontSize:'12px', width: isCompact ? 'auto' : 'auto' }} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  )
}
