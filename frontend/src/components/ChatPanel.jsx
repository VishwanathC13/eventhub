import { useState, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import api from '../services/api'

export default function ChatPanel({ eventId }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [sending, setSending] = useState(false)
  const clientRef = useRef(null)
  const listRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)

  const mergeMessages = (incoming) => {
    setMessages((prev) => {
      const byId = new Map()
      prev.forEach((m) => {
        byId.set(m.id ?? `${m.senderEmail}-${m.sentAt}-${m.content}`, m)
      })
      incoming.forEach((m) => {
        byId.set(m.id ?? `${m.senderEmail}-${m.sentAt}-${m.content}`, m)
      })
      return Array.from(byId.values())
        .sort((a, b) => new Date(a.sentAt || 0) - new Date(b.sentAt || 0))
    })
  }

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/events/${eventId}/messages`)
      mergeMessages(res.data)
    } catch (err) {
      console.error('Failed to load chat history:', err)
    }
  }

  useEffect(() => {
    fetchHistory()
    const intervalId = setInterval(fetchHistory, 3000)
    return () => clearInterval(intervalId)
  }, [eventId])

  useEffect(() => {
    const token = localStorage.getItem('eventhub_token')
    const client = new Client({
      webSocketFactory: () => new SockJS(`/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/chat/${eventId}`, (msg) => {
          const parsed = JSON.parse(msg.body)
          mergeMessages([parsed])
        })
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame?.headers?.message, frame?.body)
        setConnected(false)
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event)
        setConnected(false)
      },
      onDisconnect: () => setConnected(false),
      reconnectDelay: 3000,
    })
    client.activate()
    clientRef.current = client
    return () => client.deactivate()
  }, [eventId])

  useEffect(() => {
    const list = listRef.current
    if (!list || !shouldStickToBottomRef.current) return
    list.scrollTop = list.scrollHeight
  }, [messages])

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const onScroll = () => {
      const threshold = 24
      const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < threshold
      shouldStickToBottomRef.current = nearBottom
    }

    list.addEventListener('scroll', onScroll)
    return () => list.removeEventListener('scroll', onScroll)
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const payload = { content: input.trim(), eventId, type: 'CHAT' }
    setSending(true)
    setInput('')

    try {
      // REST-first send guarantees authentication and persistence.
      const res = await api.post(`/events/${eventId}/messages`, payload)
      mergeMessages([res.data])
    } catch (err) {
      console.error('Send failed:', err)
      try {
        const res = await api.post(`/events/${eventId}/messages`, payload)
        mergeMessages([res.data])
      } catch (fallbackErr) {
        console.error('Fallback send failed:', fallbackErr)
      }
    } finally {
      setSending(false)
      fetchHistory()
    }
  }

  const isMe = (msg) => msg.senderEmail === user?.email

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:'400px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:'13px', fontWeight:'500' }}>Live chat</div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color: connected ? 'var(--success)' : 'var(--text3)' }}>
          <span className={connected ? 'pulse' : ''} style={{ width:'6px', height:'6px', borderRadius:'50%', background: connected ? 'var(--success)' : 'var(--text3)', display:'inline-block' }} />
          {connected ? 'Connected' : 'Reconnecting...'}
        </div>
      </div>

      <div ref={listRef} style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
        {messages.map((msg, i) => (
          <div key={msg.id || i} style={{ display:'flex', flexDirection:'column', alignItems: isMe(msg) ? 'flex-end' : 'flex-start' }}>
            {!isMe(msg) && (
              <div style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'3px', paddingLeft:'2px' }}>
                {msg.senderName}
              </div>
            )}
            <div style={{
              maxWidth:'82%',
              background: isMe(msg) ? 'rgba(108,99,255,0.2)' : 'var(--bg3)',
              border: `1px solid ${isMe(msg) ? 'rgba(108,99,255,0.3)' : 'var(--border)'}`,
              borderRadius: isMe(msg) ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              padding:'8px 12px',
              fontSize:'13px',
              color:'var(--text)',
              lineHeight:'1.5',
            }}>
              {msg.content}
            </div>
            <div style={{ fontSize:'10px', color:'var(--text3)', marginTop:'2px', paddingLeft:'2px' }}>
              {msg.sentAt ? format(new Date(msg.sentAt), 'h:mm a') : ''}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:'8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Send a message..."
          style={{ flex:1, fontSize:'13px', padding:'8px 12px', height:'36px' }}
          disabled={sending}
        />
        <button className="btn btn-primary" style={{ padding:'0 14px', height:'36px', width:'auto', fontSize:'13px', flexShrink:0 }} onClick={sendMessage} disabled={sending || !input.trim()}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
