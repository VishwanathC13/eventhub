import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import ChatPanel from '../components/ChatPanel'

const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.m4v']

function getGoogleDriveId(url) {
  const pathParts = url.pathname.split('/').filter(Boolean)
  const dIndex = pathParts.indexOf('d')
  if (dIndex !== -1 && pathParts[dIndex + 1]) return pathParts[dIndex + 1]
  return url.searchParams.get('id') || ''
}

function toEmbedConfig(value) {
  if (!value) return { type: 'none', src: '', original: '' }
  const trimmed = value.trim()

  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    const pathname = url.pathname.toLowerCase()

    // Direct media files
    if (DIRECT_VIDEO_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
      return { type: 'video', src: trimmed, original: trimmed }
    }

    // HLS stream
    if (pathname.endsWith('.m3u8')) {
      return { type: 'hls', src: trimmed, original: trimmed }
    }

    // YouTube
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = url.searchParams.get('v')
      if (videoId) return { type: 'iframe', src: `https://www.youtube.com/embed/${videoId}`, original: trimmed }
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts[0] === 'live' && parts[1]) {
        return { type: 'iframe', src: `https://www.youtube.com/embed/${parts[1]}`, original: trimmed }
      }
      if (parts[0] === 'embed' && parts[1]) {
        return { type: 'iframe', src: trimmed, original: trimmed }
      }
    }
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      if (id) return { type: 'iframe', src: `https://www.youtube.com/embed/${id}`, original: trimmed }
    }

    // Vimeo
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean).find(Boolean)
      if (id && host !== 'player.vimeo.com') {
        return { type: 'iframe', src: `https://player.vimeo.com/video/${id}`, original: trimmed }
      }
      return { type: 'iframe', src: trimmed, original: trimmed }
    }

    // Dailymotion
    if (host.includes('dailymotion.com')) {
      const parts = url.pathname.split('/').filter(Boolean)
      const videoPart = parts.find(p => p.startsWith('video'))
      const videoId = videoPart ? videoPart.split('/').pop() : ''
      if (videoId) return { type: 'iframe', src: `https://www.dailymotion.com/embed/video/${videoId}`, original: trimmed }
      return { type: 'iframe', src: trimmed, original: trimmed }
    }
    if (host === 'dai.ly') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      if (id) return { type: 'iframe', src: `https://www.dailymotion.com/embed/video/${id}`, original: trimmed }
    }

    // Loom
    if (host === 'loom.com') {
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts[0] === 'share' && parts[1]) {
        return { type: 'iframe', src: `https://www.loom.com/embed/${parts[1]}`, original: trimmed }
      }
    }

    // Google Drive
    if (host === 'drive.google.com') {
      const id = getGoogleDriveId(url)
      if (id) return { type: 'iframe', src: `https://drive.google.com/file/d/${id}/preview`, original: trimmed }
    }

    // Twitch (requires parent)
    if (host === 'twitch.tv' || host === 'player.twitch.tv' || host === 'm.twitch.tv') {
      const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts[0] === 'videos' && parts[1]) {
        return { type: 'iframe', src: `https://player.twitch.tv/?video=v${parts[1]}&parent=${parent}`, original: trimmed }
      }
      if (parts[0]) {
        return { type: 'iframe', src: `https://player.twitch.tv/?channel=${parts[0]}&parent=${parent}`, original: trimmed }
      }
      return { type: 'iframe', src: trimmed, original: trimmed }
    }

    // Generic embeddable page
    return { type: 'iframe', src: trimmed, original: trimmed }
  } catch {
    // Not a fully-qualified URL. Let browser try via iframe.
    return { type: 'iframe', src: trimmed, original: trimmed }
  }
}

export default function EventLive() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
  )
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [sidePanelTab, setSidePanelTab] = useState('chat')
  const [error, setError] = useState('')

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`)
        setEvent(res.data)
        const isRegistered = res.data.isRegistered ?? res.data.registered
        if (!isRegistered) {
          navigate('/events')
          return
        }
        await api.post(`/events/${id}/join-stream`).catch(() => {})
      } catch (err) {
        console.error('Failed to load event:', err)
        setError('Unable to load this event right now. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
    return () => { api.post(`/events/${id}/leave-stream`).catch(() => {}) }
  }, [id])

  useEffect(() => {
    if (!event?.slidoUrl) return

    const preconnectMain = document.createElement('link')
    preconnectMain.rel = 'preconnect'
    preconnectMain.href = 'https://app.sli.do'

    const preconnectStatic = document.createElement('link')
    preconnectStatic.rel = 'preconnect'
    preconnectStatic.href = 'https://static.slido.com'

    document.head.appendChild(preconnectMain)
    document.head.appendChild(preconnectStatic)

    return () => {
      document.head.removeChild(preconnectMain)
      document.head.removeChild(preconnectStatic)
    }
  }, [event?.slidoUrl])

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'var(--text2)' }}>Loading event...</div>
  if (!event) {
    return (
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div className="card" style={{ maxWidth:'520px', width:'100%' }}>
          <h2 style={{ marginBottom:'10px', fontSize:'20px' }}>Event unavailable</h2>
          <p style={{ color:'var(--text2)', fontSize:'14px', marginBottom:'14px' }}>{error || 'This event could not be loaded.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/events')}>Back to events</button>
        </div>
      </div>
    )
  }

  const tabStyle = (t) => ({
    padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
    borderBottom: activeTab === t ? '2px solid var(--accent)' : '2px solid transparent',
    color: activeTab === t ? 'var(--text)' : 'var(--text2)',
    background: 'transparent', fontWeight: activeTab === t ? '500' : '400',
    transition: 'all 0.15s',
  })

  const sideTabStyle = (t) => ({
    flex: 1,
    padding: '10px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    borderBottom: sidePanelTab === t ? '2px solid var(--accent)' : '2px solid transparent',
    color: sidePanelTab === t ? 'var(--text)' : 'var(--text2)',
    background: 'transparent',
    fontWeight: sidePanelTab === t ? '500' : '400',
    transition: 'all 0.15s',
  })

  const toSlidoEmbedUrl = (value) => {
    if (!value) return ''
    const trimmed = value.trim()
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://app.sli.do/event/${trimmed}/live/questions`
  }

  const toStreamEmbedUrl = (value) => {
    if (!value) return ''
    const trimmed = value.trim()

    try {
      const url = new URL(trimmed)
      const host = url.hostname.replace(/^www\./, '')

      // YouTube watch/live links -> embeddable URL
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        const videoId = url.searchParams.get('v')
        if (videoId) return `https://www.youtube.com/embed/${videoId}`

        const parts = url.pathname.split('/').filter(Boolean)
        if (parts[0] === 'live' && parts[1]) {
          return `https://www.youtube.com/embed/${parts[1]}`
        }
      }

      // youtu.be short links
      if (host === 'youtu.be') {
        const videoId = url.pathname.split('/').filter(Boolean)[0]
        if (videoId) return `https://www.youtube.com/embed/${videoId}`
      }

      // Vimeo links -> player URL
      if (host === 'vimeo.com') {
        const videoId = url.pathname.split('/').filter(Boolean)[0]
        if (videoId) return `https://player.vimeo.com/video/${videoId}`
      }
    } catch {
      // Keep original value if it's not a full URL.
    }

    return trimmed
  }

  const slidoEmbedUrl = toSlidoEmbedUrl(event?.slidoUrl)
  const streamConfig = toEmbedConfig(event?.streamUrl)

  return (
    <div style={{ height: isMobile ? 'auto' : 'calc(100vh - 60px)', minHeight:'calc(100vh - 60px)', display:'flex', flexDirection:'column' }}>

      {/* Top bar */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding: isMobile ? '10px 12px' : '10px 24px', display:'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent:'space-between', flexShrink:0, gap:'10px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'15px', fontWeight:'600' }}>{event.title}</div>
          <div style={{ fontSize:'12px', color:'var(--text2)', marginTop:'1px' }}>
            {event.currentAttendees} attendees · {event.status}
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <span className={`badge ${event.status === 'LIVE' ? 'badge-live' : 'badge-upcoming'}`}>
            {event.status === 'LIVE' ? '● Live' : event.status}
          </span>
          <button className="btn btn-ghost" style={{ padding:'6px 12px', fontSize:'12px' }} onClick={() => navigate('/events')}>
            ← Back
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gridTemplateRows: isMobile ? 'auto auto' : '1fr', overflow: isMobile ? 'visible' : 'hidden' }}>

        {/* Stream area */}
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          <div style={{
            flex: isMobile ? 'none' : 1,
            width:'100%',
            background:'#000',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            position:'relative',
            aspectRatio: isMobile ? '16 / 9' : 'auto',
            minHeight: isMobile ? '240px' : '0'
          }}>
            {streamConfig.src ? (
              streamConfig.type === 'video' || streamConfig.type === 'hls' ? (
                <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', background:'#000' }}>
                  <video
                    src={streamConfig.src}
                    controls
                    style={{ width:'100%', height:'100%' }}
                  />
                  {streamConfig.type === 'hls' && (
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', padding:'6px 10px' }}>
                      If playback fails, open the stream link in a new tab.
                    </div>
                  )}
                </div>
              ) : (
                <iframe
                  src={streamConfig.src}
                  style={{ width:'100%', height:'100%', border:'none' }}
                  allow="camera; microphone; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : (
              <div style={{ textAlign:'center', color:'rgba(255,255,255,0.5)' }}>
                <div style={{ fontSize:'48px', marginBottom:'16px', opacity:0.3 }}>▶</div>
                <div style={{ fontSize:'15px', marginBottom:'6px' }}>Stream not yet started</div>
                <div style={{ fontSize:'13px', opacity:0.6 }}>The host will begin broadcasting shortly</div>
                {event.status === 'LIVE' && (
                  <div style={{ marginTop:'16px', display:'flex', alignItems:'center', gap:'8px', justifyContent:'center', color:'var(--danger)' }}>
                    <span className="pulse" style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--danger)', display:'inline-block' }} />
                    <span style={{ fontSize:'13px' }}>Live session in progress</span>
                  </div>
                )}
              </div>
            )}
            {streamConfig.src && (
              <a
                href={streamConfig.original}
                target="_blank"
                rel="noreferrer"
                style={{ position:'absolute', right:'12px', bottom:'12px', background:'rgba(0,0,0,0.5)', color:'#fff', fontSize:'12px', padding:'6px 10px', borderRadius:'8px', maxWidth:'80%' }}
              >
                Open stream in new tab
              </a>
            )}
          </div>

          {/* Tabs under stream */}
          <div style={{ background:'var(--bg2)', borderTop:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ display:'flex', padding: isMobile ? '0 8px' : '0 16px', borderBottom:'1px solid var(--border)' }}>
              <button style={tabStyle('info')} onClick={() => setActiveTab('info')}>Info</button>
              <button style={tabStyle('schedule')} onClick={() => setActiveTab('schedule')}>Schedule</button>
            </div>

            <div style={{ padding: isMobile ? '12px' : '16px', maxHeight: isMobile ? '220px' : '160px', overflowY:'auto' }}>
              {activeTab === 'info' && (
                <div className="fade-in">
                  <p style={{ fontSize:'13px', color:'var(--text2)', lineHeight:'1.7' }}>{event.description || 'No description provided.'}</p>
                  <div style={{ marginTop:'12px', display:'flex', gap:'16px', fontSize:'12px', color:'var(--text3)' }}>
                    <span>Capacity: {event.maxAttendees}</span>
                    <span>Registered: {event.currentAttendees}</span>
                    {event.streamId && <span>Room: {event.streamId.slice(0,8)}...</span>}
                  </div>
                </div>
              )}
              {activeTab === 'schedule' && (
                <div className="fade-in" style={{ fontSize:'13px', color:'var(--text2)' }}>
                  <div style={{ display:'flex', gap:'12px', marginBottom:'8px' }}>
                    <span style={{ color:'var(--text3)', minWidth:'80px' }}>Start</span>
                    <span>{new Date(event.startTime).toLocaleString()}</span>
                  </div>
                  {event.endTime && (
                    <div style={{ display:'flex', gap:'12px' }}>
                      <span style={{ color:'var(--text3)', minWidth:'80px' }}>End</span>
                      <span>{new Date(event.endTime).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        <div style={{ borderLeft: isMobile ? 'none' : '1px solid var(--border)', borderTop: isMobile ? '1px solid var(--border)' : 'none', background:'var(--bg2)', display:'flex', flexDirection:'column', overflow:'hidden', minHeight: isMobile ? '55vh' : '0' }}>
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <button style={sideTabStyle('chat')} onClick={() => setSidePanelTab('chat')}>Chat</button>
            <button style={sideTabStyle('slido')} onClick={() => setSidePanelTab('slido')}>Slido</button>
          </div>

          <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
            <div
              style={{
                position:'absolute',
                inset:0,
                display: sidePanelTab === 'chat' ? 'block' : 'none',
              }}
            >
              <ChatPanel eventId={parseInt(id)} />
            </div>

            {slidoEmbedUrl ? (
              <div
                style={{
                  position:'absolute',
                  inset:0,
                  opacity: sidePanelTab === 'slido' ? 1 : 0,
                  pointerEvents: sidePanelTab === 'slido' ? 'auto' : 'none',
                  transition:'opacity 0.15s ease',
                }}
              >
                <iframe
                  title="Slido"
                  src={slidoEmbedUrl}
                  loading="eager"
                  style={{ width:'100%', height:'100%', border:'none' }}
                  allow="clipboard-write"
                />
              </div>
            ) : (
              sidePanelTab === 'slido' && (
                <div style={{ padding:'24px', color:'var(--text2)', fontSize:'13px' }}>
                  Slido is not configured for this event.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}