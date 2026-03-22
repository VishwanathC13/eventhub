import { useState, useEffect } from 'react'
import api from '../services/api'
import { format } from 'date-fns'

const TABS = ['Overview', 'Events', 'Attendees', 'Analytics']

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview')
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [platformStats, setPlatformStats] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventAttendees, setEventAttendees] = useState([])
  const [eventAnalytics, setEventAnalytics] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title:'', description:'', startTime:'', endTime:'', maxAttendees:350, streamUrl:'', slidoUrl:'' })
  const [editForm, setEditForm] = useState({ title:'', description:'', startTime:'', endTime:'', maxAttendees:350, streamUrl:'', slidoUrl:'' })
  const [showEdit, setShowEdit] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState('')
  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
  )
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 700 : false
  )

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    const onResize = () => {
      setIsTablet(window.innerWidth <= 1024)
      setIsMobile(window.innerWidth <= 700)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const fetchAll = async () => {
    try {
      const [evRes, usRes, statRes] = await Promise.all([
        api.get('/events'),
        api.get('/admin/users'),
        api.get('/admin/analytics'),
      ])
      setEvents(evRes.data)
      setUsers(usRes.data)
      setPlatformStats(statRes.data)
    } catch (err) { console.error(err) }
  }

  const handleStatusChange = async (eventId, status) => {
    try {
      await api.put(`/events/${eventId}/status`, { status })
      showToast(`Event status updated to ${status}`)
      fetchAll()
    } catch (err) { showToast('Failed to update status') }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/events', createForm)
      showToast('Event created successfully')
      setShowCreate(false)
      setCreateForm({ title:'', description:'', startTime:'', endTime:'', maxAttendees:350, streamUrl:'', slidoUrl:'' })
      fetchAll()
    } catch (err) { showToast(err.response?.data?.message || 'Failed to create event') }
  }

  const handleDeleteEvent = async (event) => {
    const confirmed = window.confirm(`Delete event "${event.title}"? This cannot be undone.`)
    if (!confirmed) return
    try {
      await api.delete(`/events/${event.id}`)
      showToast('Event deleted')
      if (selectedEvent?.id === event.id) {
        setSelectedEvent(null)
        setEventAttendees([])
        setEventAnalytics(null)
        setShowEdit(false)
      }
      fetchAll()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete event')
    }
  }

  const toDateTimeInput = (value) => {
    if (!value) return ''
    return String(value).slice(0, 16)
  }

  const openEditForm = (event) => {
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      startTime: toDateTimeInput(event.startTime),
      endTime: toDateTimeInput(event.endTime),
      maxAttendees: event.maxAttendees || 350,
      streamUrl: event.streamUrl || '',
      slidoUrl: event.slidoUrl || '',
    })
    setShowEdit(true)
  }

  const handleUpdateEvent = async (e) => {
    e.preventDefault()
    if (!selectedEvent) return
    setUpdating(true)
    try {
      const payload = {
        ...editForm,
        maxAttendees: Number(editForm.maxAttendees),
      }
      const { data } = await api.put(`/events/${selectedEvent.id}`, payload)
      showToast('Event updated successfully')
      setSelectedEvent(data)
      setShowEdit(false)
      await fetchAll()
      await loadEventDetail(data)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update event')
    } finally {
      setUpdating(false)
    }
  }

  const loadEventDetail = async (event) => {
    setSelectedEvent(event)
    try {
      const [attRes, anaRes] = await Promise.all([
        api.get(`/admin/events/${event.id}/attendees`),
        api.get(`/admin/analytics/${event.id}`),
      ])
      setEventAttendees(attRes.data)
      setEventAnalytics(anaRes.data)
    } catch (err) { console.error(err) }
  }

  const setField = (k) => (e) => setCreateForm(f => ({ ...f, [k]: e.target.value }))

  const tabStyle = (t) => ({
    padding: isMobile ? '8px 12px' : '9px 18px', fontSize: isMobile ? '12px' : '13px', cursor:'pointer',
    borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
    color: tab === t ? 'var(--text)' : 'var(--text2)',
    background:'transparent', fontWeight: tab === t ? '500' : '400', transition:'all 0.15s',
  })

  const statusColor = { LIVE:'var(--danger)', UPCOMING:'var(--warn)', ENDED:'var(--text3)', CANCELLED:'var(--text3)' }

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', padding: isMobile ? '16px 12px' : '28px 24px' }}>

      {toast && (
        <div style={{ position:'fixed', top: isMobile ? '10px' : '76px', right: isMobile ? '10px' : '24px', left: isMobile ? '10px' : 'auto', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'12px 18px', fontSize:'13px', zIndex:200 }} className="fade-in">
          {toast}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom:'18px', gap:'10px', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'24px', marginBottom:'4px' }}>Admin dashboard</h1>
          <p style={{ color:'var(--text2)', fontSize:'13px' }}>Manage events, attendees and analytics</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Cancel' : '+ Create event'}
        </button>
      </div>

      {/* Create event form */}
      {showCreate && (
        <div className="card fade-in" style={{ marginBottom:'24px', borderColor:'rgba(108,99,255,0.3)' }}>
          <div className="card-title">New event</div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input required placeholder="Product Launch 2026" value={createForm.title} onChange={setField('title')} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea rows={2} style={{ resize:'none' }} placeholder="Event details..." value={createForm.description} onChange={setField('description')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start time</label>
                <input type="datetime-local" required value={createForm.startTime} onChange={setField('startTime')} />
              </div>
              <div className="form-group">
                <label className="form-label">End time</label>
                <input type="datetime-local" value={createForm.endTime} onChange={setField('endTime')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Max attendees (≤350)</label>
                <input type="number" min="1" max="350" value={createForm.maxAttendees} onChange={setField('maxAttendees')} />
              </div>
              <div className="form-group">
                <label className="form-label">Stream URL (optional)</label>
                <input placeholder="https://..." value={createForm.streamUrl} onChange={setField('streamUrl')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Slido URL or Event Code (optional)</label>
              <input placeholder="https://app.sli.do/event/... or 123abc" value={createForm.slidoUrl} onChange={setField('slidoUrl')} />
            </div>
            <button type="submit" className="btn btn-primary">Create event →</button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom:'1px solid var(--border)', marginBottom:'18px', display:'flex', flexWrap:'wrap' }}>
        {TABS.map(t => <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {/* OVERVIEW */}
      {tab === 'Overview' && (
        <div className="fade-in">
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap:'12px', marginBottom:'18px' }}>
            <div className="stat-card"><div className="stat-label">Total events</div><div className="stat-value">{platformStats?.totalEvents ?? '—'}</div></div>
            <div className="stat-card"><div className="stat-label">Live now</div><div className="stat-value" style={{ color:'var(--danger)' }}>{platformStats?.liveEvents ?? '—'}</div></div>
            <div className="stat-card"><div className="stat-label">Registrations</div><div className="stat-value">{platformStats?.totalRegistrations ?? '—'}</div></div>
            <div className="stat-card"><div className="stat-label">Chat messages</div><div className="stat-value">{platformStats?.totalMessages ?? '—'}</div></div>
          </div>
          <div className="card">
            <div className="card-title">Recent events</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', minWidth:'760px', borderCollapse:'collapse', fontSize:'13px' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['Title','Start time','Attendees','Status','Actions'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:'11px', color:'var(--text3)', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0,6).map(ev => (
                    <tr key={ev.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'10px' }}>{ev.title}</td>
                      <td style={{ padding:'10px', color:'var(--text2)' }}>{format(new Date(ev.startTime), 'dd MMM · h:mm a')}</td>
                      <td style={{ padding:'10px', color:'var(--text2)' }}>{ev.currentAttendees} / {ev.maxAttendees}</td>
                      <td style={{ padding:'10px' }}>
                        <span style={{ color: statusColor[ev.status], fontSize:'12px' }}>● {ev.status}</span>
                      </td>
                      <td style={{ padding:'10px' }}>
                        <select
                          value={ev.status}
                          onChange={e => handleStatusChange(ev.id, e.target.value)}
                          style={{ width:'auto', padding:'4px 8px', fontSize:'12px' }}
                        >
                          <option value="UPCOMING">UPCOMING</option>
                          <option value="LIVE">LIVE</option>
                          <option value="ENDED">ENDED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EVENTS */}
      {tab === 'Events' && (
        <div className="fade-in" style={{ display:'grid', gridTemplateColumns: selectedEvent && !isTablet ? '1fr 1fr' : '1fr', gap:'20px' }}>
          <div>
            <div className="card">
              <div className="card-title">All events ({events.length})</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {events.map(ev => (
                  <div key={ev.id}
                    onClick={() => loadEventDetail(ev)}
                    style={{ padding:'12px 14px', background: selectedEvent?.id === ev.id ? 'var(--accent-dim)' : 'var(--bg3)', borderRadius:'var(--radius-sm)', cursor:'pointer', border:`1px solid ${selectedEvent?.id === ev.id ? 'rgba(108,99,255,0.3)' : 'transparent'}`, transition:'all 0.15s' }}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontSize:'13px', fontWeight:'500' }}>{ev.title}</div>
                      <span style={{ fontSize:'11px', color: statusColor[ev.status] }}>● {ev.status}</span>
                    </div>
                    <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'3px' }}>
                      {ev.currentAttendees} / {ev.maxAttendees} attendees · {format(new Date(ev.startTime), 'dd MMM yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedEvent && (
            <div className="fade-in">
              <div className="card" style={{ marginBottom:'14px' }}>
                <div className="card-title">Event control — {selectedEvent.title}</div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'14px' }}>
                  <button className="btn btn-success" style={{ fontSize:'12px', padding:'7px 12px' }} onClick={() => handleStatusChange(selectedEvent.id, 'LIVE')}>● Go Live</button>
                  <button className="btn btn-ghost" style={{ fontSize:'12px', padding:'7px 12px' }} onClick={() => handleStatusChange(selectedEvent.id, 'UPCOMING')}>Set Upcoming</button>
                  <button className="btn btn-danger" style={{ fontSize:'12px', padding:'7px 12px' }} onClick={() => handleStatusChange(selectedEvent.id, 'ENDED')}>End event</button>
                  <button className="btn btn-ghost" style={{ fontSize:'12px', padding:'7px 12px' }} onClick={() => openEditForm(selectedEvent)}>Edit details</button>
                  <button className="btn btn-danger" style={{ fontSize:'12px', padding:'7px 12px' }} onClick={() => handleDeleteEvent(selectedEvent)}>Delete event</button>
                </div>

                {showEdit && (
                  <form onSubmit={handleUpdateEvent} className="fade-in" style={{ marginBottom:'14px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'12px' }}>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input required value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea rows={2} style={{ resize:'none' }} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Start time</label>
                        <input type="datetime-local" required value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End time</label>
                        <input type="datetime-local" value={editForm.endTime} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Max attendees</label>
                        <input type="number" min="1" max="350" value={editForm.maxAttendees} onChange={e => setEditForm(f => ({ ...f, maxAttendees: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Stream URL</label>
                        <input value={editForm.streamUrl} onChange={e => setEditForm(f => ({ ...f, streamUrl: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Slido URL / Event Code</label>
                      <input value={editForm.slidoUrl} onChange={e => setEditForm(f => ({ ...f, slidoUrl: e.target.value }))} />
                    </div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button type="submit" className="btn btn-primary" style={{ fontSize:'12px', padding:'7px 12px' }} disabled={updating}>{updating ? 'Saving...' : 'Save changes'}</button>
                      <button type="button" className="btn btn-ghost" style={{ fontSize:'12px', padding:'7px 12px' }} onClick={() => setShowEdit(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                {eventAnalytics && (
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'8px' }}>
                    <div className="stat-card"><div className="stat-label">Registered</div><div className="stat-value" style={{ fontSize:'20px' }}>{eventAnalytics.totalRegistered}</div></div>
                    <div className="stat-card"><div className="stat-label">Online now</div><div className="stat-value" style={{ fontSize:'20px' }}>{eventAnalytics.currentOnline}</div></div>
                    <div className="stat-card"><div className="stat-label">Messages</div><div className="stat-value" style={{ fontSize:'20px' }}>{eventAnalytics.totalMessages}</div></div>
                    <div className="stat-card"><div className="stat-label">Fill rate</div><div className="stat-value" style={{ fontSize:'20px' }}>{eventAnalytics.fillRate}%</div></div>
                  </div>
                )}
              </div>
              <div className="card">
                <div className="card-title">Attendees ({eventAttendees.length})</div>
                <div style={{ maxHeight:'280px', overflowY:'auto' }}>
                  {eventAttendees.map(a => (
                    <div key={a.userId} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'600', color:'var(--accent)', flexShrink:0 }}>
                        {a.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'13px', fontWeight:'500' }}>{a.name}</div>
                        <div style={{ fontSize:'11px', color:'var(--text3)' }}>{a.company}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color: a.online ? 'var(--success)' : 'var(--text3)' }}>
                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: a.online ? 'var(--success)' : 'var(--text3)', display:'inline-block' }} />
                        {a.online ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ATTENDEES */}
      {tab === 'Attendees' && (
        <div className="fade-in card">
          <div className="card-title">All registered users ({users.length})</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', minWidth:'760px', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Name','Email','Company','Role','Joined'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:'11px', color:'var(--text3)', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px', fontWeight:'500' }}>{u.name}</td>
                    <td style={{ padding:'10px', color:'var(--text2)' }}>{u.email}</td>
                    <td style={{ padding:'10px', color:'var(--text2)' }}>{u.company || '—'}</td>
                    <td style={{ padding:'10px' }}>
                      <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'20px', background: u.role === 'ADMIN' ? 'rgba(108,99,255,0.15)' : 'var(--bg3)', color: u.role === 'ADMIN' ? 'var(--accent)' : 'var(--text2)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding:'10px', color:'var(--text3)', fontSize:'12px' }}>{u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {tab === 'Analytics' && (
        <div className="fade-in">
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'12px', marginBottom:'20px' }}>
            <div className="stat-card"><div className="stat-label">Total events</div><div className="stat-value">{platformStats?.totalEvents ?? '—'}</div></div>
            <div className="stat-card"><div className="stat-label">Live events</div><div className="stat-value" style={{ color:'var(--danger)' }}>{platformStats?.liveEvents ?? '—'}</div></div>
            <div className="stat-card"><div className="stat-label">Registrations</div><div className="stat-value">{platformStats?.totalRegistrations ?? '—'}</div></div>
            <div className="stat-card"><div className="stat-label">Messages</div><div className="stat-value">{platformStats?.totalMessages ?? '—'}</div></div>
          </div>
          <div className="card">
            <div className="card-title">Per-event analytics — click an event to load</div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' }}>
              {events.map(ev => (
                <button key={ev.id} className="btn btn-ghost" style={{ fontSize:'12px', padding:'6px 12px' }}
                  onClick={() => api.get(`/admin/analytics/${ev.id}`).then(r => setEventAnalytics(r.data))}>
                  {ev.title}
                </button>
              ))}
            </div>
            {eventAnalytics && (
              <div className="fade-in" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap:'10px' }}>
                <div className="stat-card"><div className="stat-label">Registered</div><div className="stat-value">{eventAnalytics.totalRegistered}</div><div className="stat-sub">of {eventAnalytics.maxCapacity} capacity</div></div>
                <div className="stat-card"><div className="stat-label">Online now</div><div className="stat-value">{eventAnalytics.currentOnline}</div></div>
                <div className="stat-card"><div className="stat-label">Fill rate</div><div className="stat-value">{eventAnalytics.fillRate}%</div></div>
                <div className="stat-card"><div className="stat-label">Messages</div><div className="stat-value">{eventAnalytics.totalMessages}</div></div>
                <div className="stat-card"><div className="stat-label">Avg watch time</div><div className="stat-value">{eventAnalytics.avgWatchTimeMinutes}m</div></div>
                <div className="stat-card"><div className="stat-label">Status</div><div className="stat-value" style={{ fontSize:'16px', color: statusColor[eventAnalytics.status] }}>{eventAnalytics.status}</div></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
