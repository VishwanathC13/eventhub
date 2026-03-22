import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', company:'', designation:'', phone:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/events')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'480px' }} className="fade-in">

        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'32px', fontWeight:'700', marginBottom:'8px' }}>
            Event<span style={{ color:'var(--accent)' }}>Hub</span>
          </div>
          <div style={{ color:'var(--text2)', fontSize:'14px' }}>Create your attendee account</div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First name</label>
                <input required placeholder="Rahul" value={form.firstName} onChange={set('firstName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Last name</label>
                <input required placeholder="Mehta" value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Work email</label>
              <input type="email" required placeholder="rahul@company.com" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" required placeholder="Min 6 characters" value={form.password} onChange={set('password')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Company</label>
                <input placeholder="Acme Corp" value={form.company} onChange={set('company')} />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input placeholder="Product Manager" value={form.designation} onChange={set('designation')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input placeholder="+91 98..." value={form.phone} onChange={set('phone')} />
            </div>

            {error && (
              <div style={{ background:'var(--danger-dim)', color:'var(--danger)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'13px', marginBottom:'14px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <div className="divider" />
          <div style={{ textAlign:'center', fontSize:'13px', color:'var(--text2)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color:'var(--accent)', fontWeight:'500' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
