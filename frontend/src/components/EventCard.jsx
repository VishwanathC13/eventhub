import { Link } from 'react-router-dom'
import { format } from 'date-fns'

const STATUS_MAP = {
  LIVE: { label: 'Live now', cls: 'badge-live', dot: '●' },
  UPCOMING: { label: 'Upcoming', cls: 'badge-upcoming', dot: '◎' },
  ENDED: { label: 'Ended', cls: 'badge-ended', dot: '○' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-ended', dot: '○' },
}

export default function EventCard({ event, onJoin }) {
  const s = STATUS_MAP[event.status] || STATUS_MAP.UPCOMING
  const fillPct = Math.round((event.currentAttendees / event.maxAttendees) * 100)
  const isRegistered = event.isRegistered ?? event.registered

  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:'14px', transition:'border-color 0.18s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px' }}>
        <div>
          <div style={{ fontSize:'16px', fontWeight:'600', fontFamily:'var(--font-display)', marginBottom:'4px' }}>
            {event.title}
          </div>
          <div style={{ fontSize:'12px', color:'var(--text2)' }}>
            {format(new Date(event.startTime), 'dd MMM yyyy · h:mm a')}
          </div>
        </div>
        <span className={`badge ${s.cls}`}>{s.dot} {s.label}</span>
      </div>

      {event.description && (
        <p style={{ fontSize:'13px', color:'var(--text2)', lineHeight:'1.6' }}>
          {event.description.length > 120 ? event.description.slice(0,120) + '...' : event.description}
        </p>
      )}

      <div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--text3)', marginBottom:'5px' }}>
          <span>Attendees</span>
          <span>{event.currentAttendees} / {event.maxAttendees}</span>
        </div>
        <div style={{ height:'4px', background:'var(--bg3)', borderRadius:'2px', overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${fillPct}%`, background: fillPct >= 90 ? 'var(--danger)' : 'var(--accent)', borderRadius:'2px', transition:'width 0.4s' }} />
        </div>
      </div>

      <div style={{ display:'flex', gap:'8px', marginTop:'4px', flexDirection:'column' }}>
        {isRegistered ? (
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <Link
              to={`/events/${event.id}/live`}
              className={`btn ${event.status === 'LIVE' ? 'btn-success' : 'btn-ghost'}`}
              style={{ flex:1, justifyContent:'center' }}
            >
              {event.status === 'LIVE' ? '● Join stream →' : '↗ Enter room'}
            </Link>
            {event.status !== 'LIVE' && (
              <span style={{ fontSize:'11px', color:'var(--text3)' }}>
                Goes live soon
              </span>
            )}
          </div>
        ) : (
          <button
            className="btn btn-primary"
            style={{ flex:1, justifyContent:'center' }}
            onClick={() => onJoin(event.id)}
            disabled={event.currentAttendees >= event.maxAttendees || event.status === 'ENDED'}
          >
            {event.currentAttendees >= event.maxAttendees
              ? 'Full'
              : event.status === 'ENDED'
              ? 'Event ended'
              : 'Register →'}
          </button>
        )}
      </div>
    </div>
  )
}