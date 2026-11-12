import { useState, useRef, useEffect } from 'react'
import client from '../api/client'
import Spinner from '../components/Spinner'

const AGENT_COLORS = {
  system:          { bg: '#f1f5f9', text: '#475569', icon: '⚙️',  label: 'Store Dispatch Center' },
  customer_agent:  { bg: '#eff6ff', text: '#1d4ed8', icon: '🧑‍💼', label: 'Customer Concierge Agent' },
  store_agent:     { bg: '#f0fdf4', text: '#166534', icon: '🏪',  label: 'Floor Inventory Associate' },
}

const EXAMPLE_REQUESTS = [
  'I need healthy breakfast items for a family of 4 under Rs. 300.',
  'What snacks can I get for a movie night under Rs. 150?',
  'I want to bake a cake — what ingredients do you have in stock?',
  'Can I return milk I bought yesterday? It was spoiled when opened.',
]

export default function Agents() {
  const [request, setRequest]   = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState(null)
  const [radioChannel, setRadioChannel] = useState('CH-01 · STORE OPS')
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
        setError('AI service error. Ensure backend is running with GROQ_API_KEY set.')
      } else {
        setError('Agent radio dialogue interrupted. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-cyan-400 font-mono font-bold text-xs uppercase tracking-widest border border-cyan-500/30 shadow-lg mb-2">
          <span>📻</span>
          <span>SmartBot Capability · Staff Operations Intercom</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          SmartMart <span style={{ color: '#16a34a' }}>Staff Intercom Radio</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Store Operations Frequency 446.0 MHz · Customer Concierge ⇄ Floor Associate · Controlled via SmartBot
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Staff Radios & Floor CCTV Feeds */}
        <div className="space-y-6">
          {/* Physical Walkie-Talkie Radio Enclosure */}
          <div className="bg-slate-900 rounded-3xl p-5 border-4 border-slate-700 shadow-2xl relative text-slate-200">
            {/* Rubber Antenna Top */}
            <div className="absolute -top-6 left-8 w-4 h-8 bg-slate-800 rounded-t-full border border-slate-600 shadow-sm" />
            <div className="absolute -top-3 right-8 w-6 h-4 bg-slate-700 rounded-sm border border-slate-600" />

            {/* LCD Frequency Display */}
            <div className="bg-emerald-950 border-2 border-emerald-700 rounded-xl p-3 mb-4 text-emerald-300 font-mono text-center shadow-inner">
              <div className="flex justify-between text-[10px] text-emerald-500 border-b border-emerald-800 pb-1 mb-1">
                <span>TX / RX READY</span>
                <span>VOL: 85%</span>
              </div>
              <div className="text-sm font-black tracking-widest text-emerald-300">
                {radioChannel}
              </div>
              <p className="text-[9px] text-emerald-400 mt-0.5">VOICE RECOGNITION ONLINE</p>
            </div>

            {/* Speaker Mesh Grille */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2 mb-4">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>SPEAKER GRILLE</span>
                <span className={loading ? 'text-green-400 animate-pulse' : 'text-slate-500'}>
                  {loading ? '● TRANSMITTING DIALOGUE' : 'STANDBY'}
                </span>
              </div>

              {/* Sound wave bars */}
              <div className="flex items-center justify-center gap-1.5 h-8 py-1">
                {[12, 24, 32, 16, 28, 36, 20, 14, 30, 22, 18].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all ${
                      loading ? 'bg-green-400 animate-pulse' : 'bg-slate-700'
                    }`}
                    style={{
                      height: loading ? `${Math.max(8, (h + (i % 3) * 6))}px` : '6px',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Physical Staff ID Badges */}
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800 flex items-center gap-3">
                <span className="text-2xl p-1.5 rounded-lg bg-blue-900 border border-blue-700">🧑‍💼</span>
                <div>
                  <h4 className="text-xs font-bold text-blue-200">Customer Concierge</h4>
                  <p className="text-[10px] text-blue-300/80">Analyzes shopper intent & restrictions</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-green-950/60 border border-green-800 flex items-center gap-3">
                <span className="text-2xl p-1.5 rounded-lg bg-green-900 border border-green-700">🏪</span>
                <div>
                  <h4 className="text-xs font-bold text-green-200">Floor Inventory Associate</h4>
                  <p className="text-[10px] text-green-300/80">Checks live stock & aisle bay coordinates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Simulated In-Store CCTV Monitor */}
          <div className="bg-black rounded-2xl p-4 border-2 border-slate-800 text-slate-400 shadow-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] font-mono">
              <div className="flex items-center gap-1.5 text-red-500 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>CCTV CAM #03 · AISLE B2</span>
              </div>
              <span>25 FPS · REC</span>
            </div>

            <div className="h-32 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800">
              {/* Scanline effect */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)', backgroundSize: '100% 4px' }}
              />

              <div className="text-center z-10">
                <span className="text-3xl block mb-1">📹</span>
                <p className="text-[10px] font-mono text-slate-300">SUPERSTORE FLOOR OVERVIEW</p>
                <p className="text-[9px] font-mono text-green-400">PATROL DETECTED · ZERO BOTTLENECK</p>
              </div>

              <span className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-500">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Intercom Dialogue & User Prompt */}
        <div className="lg:col-span-2 space-y-6">
          {/* Radio Input Box */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-sm border p-6"
            style={{ borderColor: '#d1fae5' }}
          >
            <label className="block text-xs font-black uppercase tracking-wider text-green-950 mb-2">
              Broadcast Shopper Request over Radio Channel:
            </label>
            <textarea
              rows={3}
              placeholder="e.g. I need ingredients for a birthday cake under Rs. 200, or healthy lunchbox items..."
              value={request}
              onChange={e => setRequest(e.target.value)}
              className="w-full border rounded-2xl p-4 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-green-400 mb-3"
              style={{ borderColor: '#d1fae5' }}
            />

            {/* Quick Radio Preset Requests */}
            <div className="mb-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Quick Radio Transmissions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_REQUESTS.map(ex => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setRequest(ex)}
                    className="text-xs px-2.5 py-1 rounded-xl border bg-white hover:bg-green-50 text-green-800 font-medium transition-all shadow-2xs"
                    style={{ borderColor: '#d1fae5' }}
                  >
                    {ex.length > 40 ? ex.slice(0, 40) + '…' : ex}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !request.trim()}
              className="w-full py-3.5 rounded-2xl font-black text-white text-sm shadow-md transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: '#16a34a' }}
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Agents Communicating via Intercom…</span>
                </>
              ) : (
                <>
                  <span>🎙️</span>
                  <span>Transmit to Both Store Agents</span>
                </>
              )}
            </button>
          </form>

          {/* Transcript Dialogue Box */}
          {result && !loading && (
            <div className="space-y-6 animate-fadeIn">
              {/* Final Answer Banner */}
              <div className="rounded-3xl p-6 bg-gradient-to-br from-green-900 to-emerald-950 text-white shadow-xl border-2 border-green-500">
                <div className="flex items-center gap-2 mb-2 text-green-400 font-mono text-xs uppercase tracking-wider font-bold">
                  <span>📢</span>
                  <span>Consolidated Shopping Advisory</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line font-medium text-green-50">
                  {result.final_answer}
                </p>
              </div>

              {/* Step-by-Step Radio Dialogue */}
              <div className="bg-white rounded-3xl border shadow-sm p-6" style={{ borderColor: '#d1fae5' }}>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📻</span>
                    <h3 className="font-black text-sm text-gray-900">Live Intercom Transcript</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-green-100 text-green-800">
                    {(result.transcript || []).length} Transmissions Recorded
                  </span>
                </div>

                <div ref={transcriptRef} className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                  {(result.transcript || []).map((msg, i) => {
                    const style = AGENT_COLORS[msg.agent] || AGENT_COLORS.system
                    return (
                      <div key={i} className="flex gap-3 items-start">
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm flex-shrink-0 shadow-2xs border mt-0.5"
                          style={{ backgroundColor: style.bg, borderColor: `${style.text}30` }}
                        >
                          {style.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black uppercase tracking-wider" style={{ color: style.text }}>
                              {style.label}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">TURN #{i + 1}</span>
                          </div>
                          <div
                            className="p-3.5 rounded-2xl rounded-tl-none text-xs leading-relaxed whitespace-pre-line text-gray-800 shadow-2xs"
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
