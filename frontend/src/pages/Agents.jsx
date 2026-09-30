import { useState, useRef, useEffect } from 'react'
import client from '../api/client'
import Spinner from '../components/Spinner'

const AGENT_COLORS = {
  system:          { bg: '#f1f5f9', text: '#475569', icon: '⚙️',  label: 'System' },
  customer_agent:  { bg: '#eff6ff', text: '#1d4ed8', icon: '🧑',  label: 'Customer Agent' },
  store_agent:     { bg: '#f0fdf4', text: '#166534', icon: '🏪',  label: 'Store Agent' },
}

const EXAMPLE_REQUESTS = [
  'I need healthy breakfast items for a family of 4 under Rs. 300.',
  'What snacks can I get for a movie night under Rs. 150?',
  'I want to bake a cake — what ingredients do you have?',
  'Can I return milk I bought yesterday? It tastes off.',
]

export default function Agents() {
  const [request, setRequest]   = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState(null)
  const transcriptRef = useRef(null)

  useEffect(() => {
    client.get('/agents/info').then(r => setInfo(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [result])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!request.trim()) return
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const r = await client.post('/agents/chat', { request: request.trim() })
      setResult(r.data)
    } catch (err) {
      const msg = err.response?.data?.detail
      if (typeof msg === 'string' && msg.includes('API key')) {
        setError('Claude API key not configured. Add ANTHROPIC_API_KEY to backend/.env')
      } else {
        setError('Agent dialogue failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{ color: '#14532d' }}>
          🤖 Multi-Agent Assistant
        </h1>
        <p className="text-gray-500 mt-1">
          Two AI agents collaborate — Customer Agent understands your need, Store Agent
          answers with real store data. Watch their dialogue unfold.
        </p>
      </div>

      {/* Architecture banner */}
      {info && (
        <div
          className="rounded-2xl border p-5 mb-8"
          style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Agent Architecture — {info.architecture}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {info.agents.map((agent, i) => (
              <div key={agent.name} className="flex items-center gap-3">
                <div
                  className="rounded-xl p-3 text-sm flex-1"
                  style={{
                    backgroundColor: i === 0 ? '#eff6ff' : '#f0fdf4',
                    borderLeft: `3px solid ${i === 0 ? '#3b82f6' : '#16a34a'}`,
                  }}
                >
                  <p className="font-bold text-xs" style={{ color: i === 0 ? '#1d4ed8' : '#166534' }}>
                    {i === 0 ? '🧑' : '🏪'} {agent.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{agent.role}</p>
                </div>
                {i < info.agents.length - 1 && (
                  <span className="text-gray-300 font-bold text-xl hidden sm:block">⇄</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {info.pipeline.map((step, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-full"
                style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border p-6 mb-6"
        style={{ borderColor: '#d1fae5' }}
      >
        <label className="block text-sm font-semibold mb-2" style={{ color: '#14532d' }}>
          What do you need help with?
        </label>
        <textarea
          rows={3}
          placeholder="e.g. I need healthy snacks for my kids under Rs. 100..."
          value={request}
          onChange={e => setRequest(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
          style={{ borderColor: '#d1fae5' }}
        />

        {/* Example chips */}
        <p className="text-xs text-gray-400 mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {EXAMPLE_REQUESTS.map(ex => (
            <button
              key={ex}
              type="button"
              onClick={() => setRequest(ex)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all hover:border-green-400"
              style={{ borderColor: '#d1fae5', color: '#16a34a' }}
            >
              {ex.length > 48 ? ex.slice(0, 48) + '…' : ex}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !request.trim()}
          className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#16a34a' }}
        >
          {loading ? 'Agents are collaborating…' : '🚀 Start Agent Dialogue'}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-12 gap-4">
          <Spinner />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Agent dialogue in progress…</p>
            <p className="text-xs text-gray-400 mt-1">3 AI calls: analyse → query → synthesise</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div>
          {/* Final Answer */}
          <div
            className="rounded-2xl border p-5 mb-6"
            style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#16a34a' }}>
              ✅ Final Answer for You
            </p>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
              {result.final_answer}
            </p>
          </div>

          {/* Agent Transcript */}
          <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: '#d1fae5' }}>
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: '#d1fae5' }}>
              <span className="text-sm font-bold" style={{ color: '#14532d' }}>
                Agent Dialogue Transcript
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
              >
                {result.transcript.length} messages
              </span>
            </div>

            <div
              ref={transcriptRef}
              className="p-5 space-y-4 max-h-[480px] overflow-y-auto"
            >
              {result.transcript.map((msg, i) => {
                const style = AGENT_COLORS[msg.agent] || AGENT_COLORS.system
                return (
                  <div key={i} className="flex gap-3">
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: style.bg, border: `2px solid ${style.text}20` }}
                    >
                      {style.icon}
                    </div>
                    {/* Bubble */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold mb-1" style={{ color: style.text }}>
                        {style.label}
                      </p>
                      <div
                        className="rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                        style={{ backgroundColor: style.bg }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agents involved badges */}
          <div className="flex gap-2 mt-4">
            <span className="text-xs text-gray-400">Agents used:</span>
            {result.agents_involved.map(a => (
              <span
                key={a}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
              >
                {a.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
