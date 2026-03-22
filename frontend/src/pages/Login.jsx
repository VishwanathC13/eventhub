import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'ADMIN' ? '/admin' : '/events')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'420px' }} className="fade-in">

        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'32px', fontWeight:'700', marginBottom:'8px' }}>
            Event<span style={{ color:'var(--accent)' }}>Hub</span>
          </div>
          <div style={{ color:'var(--text2)', fontSize:'14px' }}>Sign in to access your events</div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email" required placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password" required placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>

            {error && (
              <div style={{ background:'var(--danger-dim)', color:'var(--danger)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'13px', marginBottom:'14px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <div className="divider" />

          <div style={{ textAlign:'center', fontSize:'13px', color:'var(--text2)' }}>
            No account?{' '}
            <Link to="/register" style={{ color:'var(--accent)', fontWeight:'500' }}>Register here</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
