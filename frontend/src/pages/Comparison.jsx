import { useState, useEffect } from 'react'
import client from '../api/client'
import Spinner from '../components/Spinner'

const PARADIGM_STYLES = {
  rule_based:  { color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: '⚙️',  badge: 'Deterministic · 0 AI Calls', rackLed: '#10b981' },
  zero_shot:   { color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', icon: '🧠',  badge: 'Un-grounded LLM · 1 Call', rackLed: '#a855f7' },
  rag:         { color: '#0369a1', bg: '#eff6ff', border: '#bfdbfe', icon: '📚',  badge: 'Policy RAG DB · 1 Call', rackLed: '#0ea5e9' },
  multi_agent: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '🤖',  badge: 'Two-Agent Dialogue · 3 Calls', rackLed: '#f59e0b' },
}

const EXAMPLE_QUESTIONS = [
  'Can I return an opened shampoo?',
  'What healthy snacks do you have under Rs. 50?',
  'Do you accept UPI payments?',
  'What are your store timings on Sunday?',
  'How do I earn loyalty points on groceries?',
]

function ParadigmCard({ result, rank }) {
  const style = PARADIGM_STYLES[result.paradigm] || PARADIGM_STYLES.rule_based

  return (
    <div
      className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between"
      style={{ borderColor: style.border }}
    >
      <div>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b" style={{ backgroundColor: style.bg, borderColor: style.border }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{style.icon}</span>
            <div>
              <span className="font-extrabold text-xs block" style={{ color: style.color }}>
                {result.display_name}
              </span>
              <span className="text-[10px] font-mono text-gray-500">{style.badge}</span>
            </div>
          </div>
          {rank === 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black">
              ⚡ FASTEST
            </span>
          )}
        </div>

        {/* Answer Output Window */}
        <div className="p-4">
          <span className="text-[10px] font-mono font-bold text-gray-400 block mb-1">
            PARADIGM OUTPUT:
          </span>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-gray-800 leading-relaxed font-mono whitespace-pre-line max-h-48 overflow-y-auto">
            {result.answer}
          </div>

          {/* Sources used */}
          {result.sources_used && result.sources_used.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.sources_used.map((s, idx) => (
                <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                  📎 {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latency & Pros/Cons Metric Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Response Latency</span>
          <span className="text-xs font-black font-mono" style={{ color: style.color }}>
            {result.response_time_ms} ms
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>AI Inference Calls:</span>
          <span className="font-bold text-gray-800">{result.ai_calls_made}</span>
        </div>
      </div>
    </div>
  )
}

export default function Comparison() {
  const [question, setQuestion] = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const r = await client.post('/comparison/run', { question: question.trim() })
      setResult(r.data)
    } catch (err) {
      const msg = err.response?.data?.detail
      if (typeof msg === 'string' && msg.includes('API key')) {
        setError('AI service error. Ensure backend is running with GROQ_API_KEY set.')
      } else {
        setError('Paradigm benchmark failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fastestIdx = (result?.results && result.results.length > 0)
    ? result.results.reduce((best, r, i, arr) =>
        r.response_time_ms < arr[best].response_time_ms ? i : best, 0)
    : -1

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs uppercase tracking-widest border border-emerald-300 shadow-xs mb-2">
          <span>🔬</span>
          <span>Store AI Architecture Benchmark</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          AI Systems <span style={{ color: '#16a34a' }}>Control Console</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Benchmarking 4 Core Paradigms: Rule-Based · Zero-Shot LLM · Policy RAG · Multi-Agent System
        </p>
      </div>

      {/* ── Physical Server Rack Control Enclosure ───────────────── */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-8 border-4 border-slate-700 shadow-2xl relative text-slate-200">
        {/* Rack Mount Screws */}
        <div className="flex justify-between items-center mb-4 text-slate-600 font-mono text-xs">
          <span>⚙️ RACK-BAY // UNIT-01</span>
          <span>COOLING: ACTIVE 22°C</span>
          <span>STATUS: ONLINE</span>
        </div>

        {/* Console LEDs Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
          {Object.entries(PARADIGM_STYLES).map(([id, style]) => (
            <div key={id} className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: style.rackLed }} />
              <span className="text-slate-300 truncate">{id.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* Benchmark Inquiry Form */}
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-green-400">
            Enter Store Inquiry to Benchmark Across All 4 Paradigms:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. Can I return an opened shampoo? What are store hours on Sunday?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-green-400 font-mono"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-6 py-3 rounded-2xl font-black text-white text-xs shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 whitespace-nowrap"
              style={{ backgroundColor: '#16a34a' }}
            >
              <span>⚡ Execute 4-Way Benchmark</span>
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {EXAMPLE_QUESTIONS.map(q => (
              <button
                key={q}
                type="button"
                onClick={() => setQuestion(q)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-bold">
              ⚠️ {error}
            </div>
          )}
        </form>

        {/* Loading Spinner with Oscilloscope Wave */}
        {loading && (
          <div className="py-16 text-center space-y-3 bg-slate-950 rounded-2xl border border-slate-800">
            <Spinner />
            <p className="text-xs font-mono text-green-400 tracking-widest">
              DISPATCHING SIMULTANEOUS QUERIES TO 4 AI PARADIGMS…
            </p>
            <p className="text-[10px] text-slate-500">Measuring deterministic latency and generative grounding</p>
          </div>
        )}

        {/* Results Showcase */}
        {result && !loading && (
          <div className="space-y-6 animate-fadeIn">
            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {(result.results || []).map((r, i) => (
                <ParadigmCard key={r.paradigm} result={r} rank={i === fastestIdx ? 0 : i + 1} />
              ))}
            </div>

            {/* Speed Comparison Telemetry Bar */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-mono text-green-400 font-bold block uppercase tracking-wider">
                📊 LATENCY OSCILLOSCOPE COMPARISON
              </span>
              <div className="space-y-2.5">
                {[...(result.results || [])]
                  .sort((a, b) => a.response_time_ms - b.response_time_ms)
                  .map(r => {
                    const style = PARADIGM_STYLES[r.paradigm] || PARADIGM_STYLES.rule_based
                    const maxMs = Math.max(...(result.results || []).map(x => x.response_time_ms || 1), 1)
                    const pct = Math.min(100, Math.max(8, ((r.response_time_ms || 1) / maxMs) * 100))
                    return (
                      <div key={r.paradigm} className="flex items-center gap-3 text-xs font-mono">
                        <span className="w-36 text-slate-300 truncate">{r.display_name}</span>
                        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: style.rackLed }}
                          />
                        </div>
                        <span className="w-16 text-right font-bold" style={{ color: style.rackLed }}>
                          {r.response_time_ms} ms
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Official AI Systems Evaluator Verdict */}
            {result.verdict && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-950 border border-emerald-700 text-emerald-100">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <span>🏆</span>
                  <span>Evaluator Scientific Verdict</span>
                </div>
                <p className="text-xs leading-relaxed font-sans">{result.verdict}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
