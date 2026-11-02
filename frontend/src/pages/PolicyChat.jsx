import { useState, useEffect, useRef } from 'react'
import client from '../api/client'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 bg-green-600 text-white shadow-sm"
      >
        AI
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 shadow-xs"
        style={{ backgroundColor: '#dcfce7' }}
      >
        <span className="w-2 h-2 rounded-full animate-bounce bg-green-600" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full animate-bounce bg-green-600" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full animate-bounce bg-green-600" style={{ animationDelay: '300ms' }} />
        <span className="text-[11px] font-bold text-green-800 ml-1">Kiosk RAG Engine querying policies…</span>
      </div>
    </div>
  )
}

function ChatBubble({ msg, onPrintReceipt }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex items-end gap-2.5 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 shadow-xs border"
        style={
          isUser
            ? { backgroundColor: '#14532d', color: '#86efac', borderColor: '#166534' }
            : { backgroundColor: '#16a34a', color: '#fff', borderColor: '#15803d' }
        }
      >
        {isUser ? '👤' : '🏪'}
      </div>

      <div className={`max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Physical Sender Tag */}
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">
          {isUser ? 'Shopper Voice Input' : 'SmartMart Helpdesk Station #04'}
        </span>

        {/* Bubble */}
        <div
          className={`px-4 py-3 text-sm leading-relaxed shadow-xs ${
            isUser
              ? 'rounded-2xl rounded-br-none text-white'
              : 'rounded-2xl rounded-bl-none text-gray-800 bg-white border border-green-200'
          }`}
          style={isUser ? { backgroundColor: '#16a34a' } : {}}
        >
          <div className="whitespace-pre-line font-medium">{msg.content}</div>

          {/* Action button: Print policy receipt */}
          {!isUser && msg.content && (
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-400">Grounded in RAG DB</span>
              <button
                type="button"
                onClick={() => onPrintReceipt && onPrintReceipt(msg)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs"
              >
                <span>🖨️</span>
                <span>Print Policy Receipt</span>
              </button>
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.sources.map((src, i) => (
              <span
                key={i}
                className="text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-2xs"
                style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
              >
                <span>📜</span>
                <span>{typeof src === 'string' ? src : src.source || src.file || `Policy ${i + 1}`}</span>
              </span>
            ))}
          </div>
        )}

        <span className="text-[10px] text-gray-400 mt-1 px-1 font-mono">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Terminal Station verified
        </span>
      </div>
    </div>
  )
}

const SUGGESTED = [
  'What is the return policy for opened items?',
  'What are your store hours on Sundays?',
  'Do you accept UPI and credit cards?',
  'How does the customer loyalty points program work?',
  'What is the home delivery policy and minimum spend?',
]

export default function PolicyChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to the SmartMart Customer Helpdesk Kiosk!\n\nI am grounded in our store policy documents. Ask me about returns, refunds, store hours, payment methods, or member discounts.',
      sources: ['Store Operations Manual', 'Return & Refund Policy'],
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState(null)
  const [printedReceipt, setPrintedReceipt] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = async (text) => {
    const content = (text || input).trim()
    if (!content) return

    setInput('')
    setError(null)

    const userMsg = { role: 'user', content, timestamp: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setTyping(true)

    try {
      const res = await client.post('/policies/ask', {
        question: content,
      })

      const data = res.data || {}
      const aiMsg = {
        role: 'assistant',
        content: data.answer || data.response || data.content || 'No response received.',
        sources: data.sources_used || data.sources || data.references || [],
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect to store policy service.')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Terminal unable to fetch policy database. Please consult the store customer desk in Aisle A1.',
          sources: [],
          timestamp: Date.now(),
        },
      ])
    } finally {
      setTyping(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ── Overhead Physical Store Sign ───────────────────────── */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs uppercase tracking-widest border border-emerald-300 shadow-xs mb-2">
          <span>🔔</span>
          <span>In-Store Customer Assistance Desk</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          SmartMart <span style={{ color: '#16a34a' }}>Digital Kiosk</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Touchscreen Terminal Station #04 · Near Entrance Turnstiles & Customer Service
        </p>
      </div>

      {/* ── Physical Kiosk Bezel Enclosure ──────────────────────── */}
      <div className="rounded-3xl p-3 sm:p-5 shadow-2xl border-4" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        {/* Kiosk Bezel Header Bar */}
        <div className="flex items-center justify-between pb-3 px-3 border-b border-slate-700 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-green-500 shadow-xs" />
            <span className="text-xs font-mono font-bold text-slate-400 ml-2">
              STATION-04 // ONLINE
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-green-400">● RAG KNOWLEDGE BASE READY</span>
            <span className="text-slate-400">BRANCH: SEC-14</span>
          </div>
        </div>

        {/* Kiosk Glass Screen */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 mt-3 border border-slate-300 shadow-inner flex flex-col" style={{ minHeight: '520px' }}>
          {/* Quick Touch Suggestions */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              <span>👆</span>
              <span>Touch Quick Inquiries:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={typing}
                  className="text-xs px-3 py-1.5 rounded-xl font-bold border transition-all hover:bg-green-100 hover:scale-[1.02] disabled:opacity-50 text-left bg-white shadow-2xs"
                  style={{ borderColor: '#86efac', color: '#15803d' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div
            className="flex-1 overflow-y-auto rounded-2xl border p-4 mb-4 bg-white/80 shadow-xs"
            style={{ borderColor: '#d1fae5', maxHeight: '380px' }}
          >
            {messages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} onPrintReceipt={setPrintedReceipt} />
            ))}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200">
              ⚠️ {error}
            </div>
          )}

          {/* Touch Terminal Virtual Keyboard & Mic Input */}
          <div className="flex items-center gap-2 bg-white rounded-2xl border p-2 shadow-sm" style={{ borderColor: '#d1fae5' }}>
            <span className="pl-3 text-gray-400 text-lg">💬</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your policy question or touch a suggestion above…"
              className="flex-1 px-2 py-2 text-sm outline-none bg-transparent font-medium"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
              className="px-5 py-2.5 rounded-xl font-black text-white text-xs shadow-md transition-all disabled:opacity-40 hover:opacity-90 flex items-center gap-1.5"
              style={{ backgroundColor: '#16a34a' }}
            >
              <span>Ask Kiosk</span>
              <span>➔</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 px-1">
            <span>Kiosk Terminal Powered by Groq AI + TF-IDF RAG</span>
            <span>Receipt slot active 🖨️</span>
          </div>
        </div>

        {/* Physical Kiosk Base Slot (Receipt Dispenser) */}
        <div className="mt-4 pt-3 border-t border-slate-700 flex flex-wrap items-center justify-between text-xs text-slate-400 px-2">
          <div className="flex items-center gap-2">
            <span className="w-16 h-2 bg-slate-900 rounded-full border border-slate-600 block shadow-inner" />
            <span className="font-mono text-[11px]">THERMAL RECEIPT SLOT</span>
          </div>
          <span className="text-[11px]">SmartMart Superstore · Customer Service Division</span>
        </div>
      </div>

      {/* ── Physical Printed Thermal Receipt Modal ───────────────── */}
      {printedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPrintedReceipt(null)}
        >
          <div
            className="bg-amber-50/95 text-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border-2 border-amber-200 font-mono text-xs relative transform rotate-[-0.5deg]"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundImage: 'radial-gradient(#fed7aa 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}
          >
            {/* Serrated top edge styling */}
            <div className="text-center pb-3 border-b-2 border-dashed border-gray-400">
              <h2 className="text-base font-black tracking-widest uppercase">SMARTMART SUPERSTORE</h2>
              <p className="text-[10px] text-gray-500">SECTOR 14, GURUGRAM · TEL: 1800-SMART-AI</p>
              <p className="text-[10px] text-gray-500">GSTIN: 07AAAAA0000A1Z5</p>
              <div className="mt-2 text-[10px] font-bold bg-amber-200/80 px-2 py-0.5 rounded-sm inline-block">
                OFFICIAL POLICY ADVISORY SLIP
              </div>
            </div>

            {/* Receipt body */}
            <div className="py-4 space-y-2 leading-relaxed">
              <div className="flex justify-between text-[10px] text-gray-500 border-b border-gray-200 pb-1">
                <span>DATE: {new Date().toLocaleDateString()}</span>
                <span>TIME: {new Date().toLocaleTimeString()}</span>
              </div>

              <div className="text-[11px] font-bold text-gray-800">
                SUBJECT: STORE POLICY INQUIRY
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-amber-200 text-[11px] leading-normal whitespace-pre-line text-gray-800">
                {printedReceipt.content}
              </div>

              {printedReceipt.sources && printedReceipt.sources.length > 0 && (
                <div className="text-[10px] text-gray-600 pt-1">
                  <strong>REFERENCED CLAUSES:</strong>
                  <ul className="list-disc list-inside">
                    {printedReceipt.sources.map((s, idx) => (
                      <li key={idx}>{typeof s === 'string' ? s : s.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Receipt Footer with fake barcode */}
            <div className="pt-3 border-t-2 border-dashed border-gray-400 text-center space-y-2">
              <p className="text-[9px] text-gray-500 uppercase">
                Present this receipt at desk for exchanges or grievance review
              </p>
              <div className="flex justify-center items-center gap-[2px] h-6 py-1">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1].map((w, i) => (
                  <span key={i} className="h-full bg-gray-800 block" style={{ width: `${w}px` }} />
                ))}
              </div>
              <p className="text-[9px] font-mono tracking-widest text-gray-600">
                *SM-POLICY-2026-X99*
              </p>
            </div>

            <button
              onClick={() => setPrintedReceipt(null)}
              className="w-full mt-4 py-2 rounded-xl bg-gray-900 text-white font-black text-xs hover:bg-black transition-colors"
            >
              ✕ Close Receipt Slip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
