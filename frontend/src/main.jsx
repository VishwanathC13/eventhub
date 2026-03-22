import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' }
  }

  componentDidCatch(error, info) {
    console.error('Root render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', background:'var(--bg)', color:'var(--text)' }}>
          <div style={{ maxWidth:'680px', width:'100%', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'20px' }}>
            <h2 style={{ marginBottom:'10px' }}>Frontend Runtime Error</h2>
            <p style={{ color:'var(--text2)', marginBottom:'8px' }}>The app hit an unexpected error while rendering.</p>
            <pre style={{ whiteSpace:'pre-wrap', wordBreak:'break-word', color:'var(--danger)', fontSize:'12px', margin:0 }}>{this.state.errorMessage}</pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
)
