import { useState, useEffect } from 'react'
import client from '../api/client'
import Spinner from '../components/Spinner'

const PARADIGM_STYLES = {
  rule_based:  { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: '⚙️',  badge: 'No AI'        },
  zero_shot:   { color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', icon: '🧠',  badge: '1 AI call'    },
  rag:         { color: '#0369a1', bg: '#eff6ff', border: '#bfdbfe', icon: '📚',  badge: '1 AI call'    },
  multi_agent: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '🤖',  badge: '3 AI calls'   },
}

const EXAMPLE_QUESTIONS = [
  'Can I return an opened shampoo?',
  'What healthy snacks do you have under Rs. 50?',
  'Do you accept UPI payments?',
  'What are your store timings on Sunday?',
  'How do I earn loyalty points?',
]

function MetricBar({ label, value, max, color }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function ParadigmCard({ result, rank }) {
  const style = PARADIGM_STYLES[result.paradigm] || PARADIGM_STYLES.rule_based
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col"
      style={{ borderColor: style.border }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: style.bg }}>
        <span className="text-2xl">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm" style={{ color: style.color }}>
              {result.display_name}
            </span>
            {rank === 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                🥇 Fastest
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: style.border, color: style.color }}
            >
              {style.badge}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{result.description.split('—')[0].trim()}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-4 pt-3 pb-2">
        <MetricBar
          label="Response Time"
          value={`${result.response_time_ms}ms`}
          max={15000}
          color={style.color}
        />
        <MetricBar
          label="AI Calls Made"
          value={result.ai_calls_made}
          max={3}
          color={style.color}
        />
      </div>

      {/* Sources */}
      {result.sources_used.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {result.sources_used.map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Answer */}
      <div className="px-4 pb-3 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Answer</p>
        <div
          className="rounded-xl p-3 text-sm text-gray-700 leading-relaxed"
          style={{ backgroundColor: style.bg, maxHeight: expanded ? 'none' : '120px', overflow: 'hidden' }}
        >
          <p className="whitespace-pre-line">{result.answer}</p>
        </div>
        {result.answer.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs mt-1 font-medium"
            style={{ color: style.color }}
          >
            {expanded ? '▲ Show less' : '▼ Show more'}
          </button>
        )}
      </div>

      {/* Pros / Cons */}
      <div className="border-t px-4 py-3 grid grid-cols-2 gap-3" style={{ borderColor: style.border }}>
        <div>
          <p className="text-xs font-bold text-green-600 mb-1">✓ Pros</p>
          {result.pros.map(p => (
            <p key={p} className="text-xs text-gray-500 mb-0.5">• {p}</p>
          ))}
        </div>
        <div>
          <p className="text-xs font-bold text-red-500 mb-1">✗ Cons</p>
          {result.cons.map(c => (
            <p key={c} className="text-xs text-gray-500 mb-0.5">• {c}</p>
          ))}
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
  const [paradigms, setParadigms] = useState([])

  useEffect(() => {
    client.get('/comparison/paradigms').then(r => setParadigms(r.data)).catch(() => {})
  }, [])

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
        setError('Claude API key not configured. Add ANTHROPIC_API_KEY to backend/.env')
      } else {
        setError('Comparison failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Find fastest result for badge
  const fastestIdx = result
    ? result.results.reduce((best, r, i, arr) =>
        r.response_time_ms < arr[best].response_time_ms ? i : best, 0)
    : -1

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{ color: '#14532d' }}>
          ⚡ AI Paradigm Comparison
        </h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Ask the same question using four different AI approaches — Rule-Based, Zero-Shot LLM, RAG,
          and Multi-Agent — and see how their answers, speed, and accuracy compare side-by-side.
        </p>
      </div>

      {/* Paradigm overview chips */}
      {paradigms.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {paradigms.map(p => {
            const style = PARADIGM_STYLES[p.id] || PARADIGM_STYLES.rule_based
            return (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: style.bg, borderColor: style.border }}
              >
                <span>{style.icon}</span>
                <span className="font-semibold" style={{ color: style.color }}>{p.display_name}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: style.border, color: style.color }}
                >
                  {style.badge}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border p-6 mb-8"
        style={{ borderColor: '#d1fae5' }}
      >
        <label className="block text-sm font-semibold mb-2" style={{ color: '#14532d' }}>
          Question to compare across all paradigms
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. Can I return an opened shampoo?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ borderColor: '#d1fae5' }}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            style={{ backgroundColor: '#16a34a' }}
          >
            {loading ? 'Running…' : '⚡ Compare'}
          </button>
        </div>

        {/* Example questions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLE_QUESTIONS.map(q => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestion(q)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all hover:border-green-400"
              style={{ borderColor: '#d1fae5', color: '#16a34a' }}
            >
              {q}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
            {error}
          </div>
        )}
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Spinner />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Running all 4 paradigms…</p>
            <p className="text-xs text-gray-400 mt-1">Making ~6 Claude API calls. This takes 20-40 seconds.</p>
          </div>
          {/* Progress indicator */}
          <div className="flex gap-3 mt-2">
            {['⚙️ Rule-Based', '🧠 Zero-Shot', '📚 RAG', '🤖 Multi-Agent'].map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-xl animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>
                  {label.split(' ')[0]}
                </span>
                <span className="text-xs text-gray-400">{label.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div>
          {/* Question display */}
          <div
            className="rounded-2xl border px-5 py-4 mb-6 flex items-center gap-3"
            style={{ backgroundColor: '#fefce8', borderColor: '#fde68a' }}
          >
            <span className="text-xl">❓</span>
            <div>
              <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Question compared</p>
              <p className="text-sm font-medium text-gray-800">"{result.question}"</p>
            </div>
          </div>

          {/* 4-column card grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {result.results.map((r, i) => (
              <ParadigmCard key={r.paradigm} result={r} rank={i === fastestIdx ? 0 : i + 1} />
            ))}
          </div>

          {/* Speed comparison bar */}
          <div
            className="bg-white rounded-2xl border p-5 mb-6 shadow-sm"
            style={{ borderColor: '#d1fae5' }}
          >
            <p className="text-sm font-bold mb-4" style={{ color: '#14532d' }}>
              ⏱️ Speed Comparison
            </p>
            <div className="space-y-3">
              {[...result.results]
                .sort((a, b) => a.response_time_ms - b.response_time_ms)
                .map(r => {
                  const style = PARADIGM_STYLES[r.paradigm]
                  const maxMs = Math.max(...result.results.map(x => x.response_time_ms))
                  const pct   = (r.response_time_ms / maxMs) * 100
                  return (
                    <div key={r.paradigm} className="flex items-center gap-3">
                      <span className="w-36 text-xs font-medium text-gray-600 flex-shrink-0">
                        {style.icon} {r.display_name}
                      </span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: style.color }}
                        />
                      </div>
                      <span className="text-xs font-bold w-16 text-right" style={{ color: style.color }}>
                        {r.response_time_ms}ms
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* AI Verdict */}
          <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏆</span>
              <p className="font-bold" style={{ color: '#14532d' }}>Claude's Verdict</p>
              <span className="text-xs text-gray-400">(1 extra AI call)</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{result.verdict}</p>
          </div>
        </div>
      )}
    </div>
  )
}
