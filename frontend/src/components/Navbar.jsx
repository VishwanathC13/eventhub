import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate('/login') }

  const navStyle = {
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  }

  const linkStyle = (path) => ({
    fontSize: '13px',
    color: location.pathname.startsWith(path) ? 'var(--text)' : 'var(--text2)',
    fontWeight: location.pathname.startsWith(path) ? '500' : '400',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    background: location.pathname.startsWith(path) ? 'rgba(108,99,255,0.12)' : 'transparent',
    transition: 'all 0.15s',
  })

  return (
    <nav style={navStyle}>
      <div style={{ display:'flex', alignItems:'center', gap:'32px' }}>
        <Link to="/events" style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:'700', color:'var(--text)' }}>
          Event<span style={{ color:'var(--accent)' }}>Hub</span>
        </Link>
        <div style={{ display:'flex', gap:'4px' }}>
          <Link to="/events" style={linkStyle('/events')}>Events</Link>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" style={linkStyle('/admin')}>Admin</Link>
          )}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'13px', fontWeight:'500' }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ fontSize:'11px', color:'var(--text3)' }}>{user?.role === 'ADMIN' ? '● Admin' : '● Attendee'}</div>
        </div>
        <button className="btn btn-ghost" style={{ padding:'7px 14px', fontSize:'13px' }} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  )
}
