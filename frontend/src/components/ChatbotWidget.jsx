import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'

// Pre-seeded quick prompt suggestions
const QUICK_PROMPTS = [
  { icon: '📍', label: 'Where is Almond Milk?', query: 'Where can I find organic almond milk and what shelf is it on?' },
  { icon: '📜', label: 'Return Policy', query: 'What is the return and refund policy for groceries and electronics?' },
  { icon: '🥗', label: 'Dinner under $20', query: 'Suggest a quick healthy dinner under $20 with items and aisle locations.' },
  { icon: '🕒', label: 'Store Hours', query: 'What are the store hours, location, and customer service contact?' },
]

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Hello! I'm **SmartMart AI**, your personal in-store shopping assistant. How can I help you today? You can ask me for product locations, prices, dietary recommendations, or store policies!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [allProducts, setAllProducts] = useState([])
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  // Fetch products snapshot for grounding
  useEffect(() => {
    client.get('/products')
      .then(res => setAllProducts(res.data || []))
      .catch(() => {})
  }, [])

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim()
    if (!query || isLoading) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      // Send query to the AI policy/chat endpoint
      const response = await client.post('/policies/ask', {
        question: query,
        top_k: 4,
      })

      const botReply = response.data?.answer || response.data?.reply || "I've checked our store records, but couldn't locate specific information for that query. Please visit the Customer Service Desk in Aisle 1 for assistance!"

      // Find any mentioned products to display rich interactive chips
      const matchedProducts = (allProducts || []).filter(p => 
        query.toLowerCase().includes(p.name.toLowerCase()) || 
        botReply.toLowerCase().includes(p.name.toLowerCase())
      ).slice(0, 2)

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botReply,
          matchedProducts,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "I'm having trouble reaching the store server right now. In the meantime, you can explore Aisles 1–4 on the [Store Map](#/planner) or check our [Helpdesk Kiosk](#/policy-chat)!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside aria-label="SmartMart AI Retail Chatbot" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ── Chat Window ────────────────────────────────────────────── */}
      {isOpen && (
        <div 
          className="w-[92vw] sm:w-[400px] h-[540px] max-h-[80vh] bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 transition-all animate-in fade-in slide-in-from-bottom-6 duration-200"
          style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 25px rgba(16,185,129,0.15)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 font-bold text-sm shadow-inner">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-sm">SmartMart AI Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-emerald-400/80 font-mono">Store Neural Engine • Qwen 27B</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([{
                  id: Date.now(),
                  sender: 'bot',
                  text: "Chat cleared! What else can I help you find in SmartMart today?",
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }])}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-slate-800 text-xs transition-colors"
                title="Clear Conversation"
              >
                🧹
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-slate-800 text-sm font-bold transition-colors"
                title="Minimize Chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Render matched product preview cards */}
                  {m.matchedProducts && m.matchedProducts.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        📍 Matching Store Items:
                      </span>
                      {m.matchedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="bg-slate-900/80 border border-slate-700 rounded-lg p-2 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{p.name}</div>
                            <div className="text-[10px] text-emerald-300 font-mono">
                              Aisle {p.aisle} • ${p.price?.toFixed(2)} • {p.stock} in stock
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false)
                              navigate(`/planner?highlight=${p.aisle}`)
                            }}
                            className="text-[10px] bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-600 px-2 py-1 rounded transition-colors"
                          >
                            Map ➔
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-gray-500 mt-1 px-1 font-mono">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 w-max">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-[11px]">Thinking & searching store database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleSendMessage(qp.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-600 transition-all flex items-center gap-1"
              >
                <span>{qp.icon}</span>
                <span>{qp.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, aisles, policies..."
              disabled={isLoading}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold p-2 px-3 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Launcher Button ──────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          boxShadow: '0 10px 25px -3px rgba(16, 185, 129, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        }}
      >
        <span className="text-xl group-hover:rotate-12 transition-transform duration-200">
          {isOpen ? '✕' : '💬'}
        </span>
        <span className="text-sm font-extrabold tracking-wide hidden sm:inline">
          {isOpen ? 'Close Assistant' : 'SmartMart AI Chat'}
        </span>
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200" />
        </span>
      </button>
    </aside>
  )
}
