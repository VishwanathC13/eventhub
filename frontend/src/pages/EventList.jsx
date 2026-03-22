import { useState, useEffect } from 'react'
import api from '../services/api'
import EventCard from '../components/EventCard'

export default function EventList() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [toast, setToast] = useState('')
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events')
      setEvents(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const handleJoin = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/join`)
      setToast('Registered! Click "Enter room" to join.')
      await fetchEvents()
      setTimeout(() => setToast(''), 4000)
    } catch (err) {
      setToast(err.response?.data?.message || 'Registration failed.')
      setTimeout(() => setToast(''), 4000)
    }
  }

  const filtered = filter === 'ALL' ? events : events.filter(e => e.status === filter)
  const counts = { ALL: events.length, LIVE: events.filter(e=>e.status==='LIVE').length, UPCOMING: events.filter(e=>e.status==='UPCOMING').length, ENDED: events.filter(e=>e.status==='ENDED').length }

  const tabStyle = (val) => ({
    padding: isMobile ? '7px 12px' : '7px 16px',
    borderRadius: 'var(--radius-sm)',
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: filter === val ? '500' : '400',
    background: filter === val ? 'rgba(108,99,255,0.15)' : 'transparent',
    color: filter === val ? 'var(--accent)' : 'var(--text2)',
    border: filter === val ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
    cursor: 'pointer',
  })

  return (
    <div style={{ maxWidth:'980px', margin:'0 auto', padding: isMobile ? '18px 12px' : '32px 24px' }}>

      {toast && (
        <div style={{ position:'fixed', top: isMobile ? '12px' : '76px', right: isMobile ? '12px' : '24px', left: isMobile ? '12px' : 'auto', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'12px 18px', fontSize:'13px', zIndex:200, boxShadow:'0 4px 20px rgba(0,0,0,0.4)' }} className="fade-in">
          {toast}
        </div>
      )}

      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'26px', marginBottom:'6px' }}>Events</h1>
        <p style={{ color:'var(--text2)', fontSize:'14px' }}>Register and join live virtual events</p>
      </div>

      <div style={{ display:'flex', gap:'6px', marginBottom:'18px', flexWrap:'wrap' }}>
        {['ALL','LIVE','UPCOMING','ENDED'].map(f => (
          <button key={f} style={tabStyle(f)} onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'All' : f.charAt(0)+f.slice(1).toLowerCase()} {counts[f] > 0 && `(${counts[f]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color:'var(--text3)' }}>Loading events...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px', color:'var(--text3)' }}>
          No {filter !== 'ALL' ? filter.toLowerCase() : ''} events found.
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap:'12px' }}>
          {filtered.map(event => (
            <EventCard key={event.id} event={event} onJoin={handleJoin} />
          ))}
        </div>
      )}
    </div>
  )
}