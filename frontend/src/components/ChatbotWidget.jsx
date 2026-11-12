import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from '../api/client'
import { useCart } from '../context/CartContext'

// Pre-seeded quick prompt suggestions for SmartBot
const QUICK_PROMPTS = [
  { icon: '🍽️', label: 'Dinner for 2 under ₹300', query: 'Suggest dinner for two under 300 with store items and aisle locations.' },
  { icon: '🗺️', label: 'Navigate to Milk & Bread', query: 'Plan an in-store 3D route for milk and bread.' },
  { icon: '📜', label: 'Return Policy', query: 'Can I return an opened or damaged product?' },
  { icon: '📦', label: 'Staff Stock Check', query: 'Which products are low on stock and need restocking?' },
]

/**
 * Lightweight custom Markdown & formatting renderer
 */
function FormattedMessage({ content }) {
  if (!content) return null

  // Split into code blocks and normal text blocks
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.substring(lastIndex, match.index) })
    }
    parts.push({ type: 'code', lang: match[1] || 'text', code: match[2].trimEnd() })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.substring(lastIndex) })
  }

  const renderInline = (str) => {
    const lines = str.split('\n')
    return lines.map((line, lIdx) => {
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ')
      const isNum = /^\d+\.\s/.test(line.trim())
      const cleanLine = isBullet
        ? line.trim().substring(2)
        : isNum
        ? line.trim().replace(/^\d+\.\s/, '')
        : line

      const inlineRegex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g
      const inlineParts = []
      let iLast = 0
      let iMatch

      while ((iMatch = inlineRegex.exec(cleanLine)) !== null) {
        if (iMatch.index > iLast) {
          inlineParts.push(cleanLine.substring(iLast, iMatch.index))
        }
        const token = iMatch[0]
        if (token.startsWith('**') && token.endsWith('**')) {
          inlineParts.push(<strong key={iMatch.index} className="text-white font-semibold">{token.slice(2, -2)}</strong>)
        } else if (token.startsWith('`') && token.endsWith('`')) {
          inlineParts.push(
            <code key={iMatch.index} className="bg-slate-950/80 text-emerald-300 px-1 py-0.5 rounded text-[11px] font-mono border border-slate-700/60">
              {token.slice(1, -1)}
            </code>
          )
        } else if (token.startsWith('[') && token.includes('](')) {
          const title = token.substring(1, token.indexOf(']('))
          const url = token.substring(token.indexOf('](') + 2, token.length - 1)
          inlineParts.push(
            <a key={iMatch.index} href={url} target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300">
              {title}
            </a>
          )
        }
        iLast = iMatch.index + token.length
      }
      if (iLast < cleanLine.length) {
        inlineParts.push(cleanLine.substring(iLast))
      }

      if (isBullet) {
        return (
          <li key={lIdx} className="ml-4 list-disc text-slate-200 my-0.5">
            {inlineParts}
          </li>
        )
      }
      if (isNum) {
        return (
          <li key={lIdx} className="ml-4 list-decimal text-slate-200 my-0.5">
            {inlineParts}
          </li>
        )
      }
      return (
        <span key={lIdx} className="block min-h-[1.2em]">
          {inlineParts}
        </span>
      )
    })
  }

  return (
    <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed break-words font-sans">
      {parts.map((p, idx) => {
        if (p.type === 'code') {
          return (
            <div key={idx} className="my-2 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
              <div className="px-3 py-1 bg-slate-800 text-[10px] font-mono text-slate-400 uppercase border-b border-slate-700 flex justify-between items-center">
                <span>{p.lang}</span>
                <span>SmartBot Code</span>
              </div>
              <pre className="p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                <code>{p.code}</code>
              </pre>
            </div>
          )
        }
        return <div key={idx}>{renderInline(p.value)}</div>
      })}
    </div>
  )
}

export default function ChatbotWidget() {
  const { addToCart } = useCart()
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [conversationsList, setConversationsList] = useState([])
  const [activeModel, setActiveModel] = useState('Meta Llama • Unified SmartBot')
  const [activeRole, setActiveRole] = useState('customer') // 'customer' | 'staff' | 'admin'
  const [copiedId, setCopiedId] = useState(null)

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Hello! I am **SmartBot**, the central autonomous AI brain of **SmartMart Supermarket**.\n\nI control and connect our entire platform: answering general knowledge, recommending meal plans within your budget, checking live stock, planning 3D supermarket walking routes, and assisting staff. How can I help you today?",
      model: 'Meta Llama 3.3',
      sourceBadge: 'SmartBot Central Agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [streamingSource, setStreamingSource] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const messagesEndRef = useRef(null)

  // Fetch products snapshot for frontend highlighting
  useEffect(() => {
    client.get('/products')
      .then(res => setAllProducts(res.data?.products || res.data || []))
      .catch(() => {})
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingText, isOpen])

  // Load conversation list when history is toggled
  const loadConversations = async () => {
    try {
      const res = await client.get('/smartbot/conversations')
      if (res.data && Array.isArray(res.data)) {
        setConversationsList(res.data)
      }
    } catch {
      try {
        const local = JSON.parse(localStorage.getItem('smartmart_conversations') || '[]')
        setConversationsList(local)
      } catch {}
    }
  }

  useEffect(() => {
    if (showHistory) {
      loadConversations()
    }
  }, [showHistory])

  // Start fresh conversation
  const handleStartNewChat = () => {
    setConversationId(null)
    setShowHistory(false)
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: "Started a fresh SmartBot conversation. What would you like to explore in SmartMart today?",
        model: activeModel,
        sourceBadge: 'SmartBot Central Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  // Switch to a previous conversation
  const handleSelectConversation = async (conv) => {
    try {
      setConversationId(conv.id)
      setShowHistory(false)
      const res = await client.get(`/smartbot/conversations/${conv.id}`)
      if (res.data && res.data.messages) {
        const mapped = res.data.messages.map((m, idx) => ({
          id: m.id || idx,
          sender: m.role === 'user' ? 'user' : 'bot',
          text: m.message_content,
          model: m.model_used || activeModel,
          timestamp: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }))
        setMessages(mapped.length ? mapped : [{
          id: Date.now(),
          sender: 'bot',
          text: `Loaded conversation: "${conv.title}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }])
      }
    } catch {
      setShowHistory(false)
    }
  }

  // Delete a conversation
  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation()
    try {
      await client.delete(`/smartbot/conversations/${convId}`)
      setConversationsList(prev => prev.filter(c => c.id !== convId))
      if (conversationId === convId) {
        handleStartNewChat()
      }
    } catch {
      setConversationsList(prev => prev.filter(c => c.id !== convId))
    }
  }

  // Copy message text
  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Send message to SmartBot
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
    setStreamingText('')
    setStreamingSource(null)

    try {
      // 1. Try unified SmartBot endpoint first
      const response = await client.post('/smartbot/chat', {
        message: query,
        conversation_id: conversationId,
        role: activeRole,
        admin_key: activeRole === 'admin' ? 'CSE276' : undefined
      })

      const data = response.data || {}
      if (data.conversation_id) setConversationId(data.conversation_id)
      if (data.model_used) setActiveModel(data.model_used)

      let sourceBadge = 'General Reasoning'
      if (data.tool_called) sourceBadge = `⚡ Tool: ${data.tool_called}`
      else if (data.sources && data.sources.length) sourceBadge = '📜 RAG Policy DB'

      const botReply = data.response || data.message || "SmartBot processed your request."

      // Extract product mentions
      const matchedProducts = (allProducts || []).filter(p =>
        query.toLowerCase().includes((p.name || '').toLowerCase()) ||
        botReply.toLowerCase().includes((p.name || '').toLowerCase())
      ).slice(0, 3)

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botReply,
          model: data.model_used || activeModel,
          sourceBadge,
          toolData: data.tool_data,
          matchedProducts,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch (err) {
      console.warn('SmartBot chat fallback:', err)
      // Fallback response with navigation suggestions
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `SmartBot processed your request. You can browse live items in the [Supermarket Catalog](#/products), test shortest paths in the [3D Route Planner](#/planner), or drop items into your SmartCart!`,
          sourceBadge: 'SmartBot Operational Fallback',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsLoading(false)
      setStreamingText('')
    }
  }

  // Listen for global open-smartbot events from anywhere on the site
  useEffect(() => {
    const handleOpen = (e) => {
      setIsOpen(true)
      if (e?.detail?.query) {
        setTimeout(() => {
          handleSendMessage(e.detail.query)
        }, 150)
      }
    }
    window.addEventListener('open-smartbot', handleOpen)
    return () => window.removeEventListener('open-smartbot', handleOpen)
  }, [allProducts, activeRole, conversationId])

  return (
    <aside aria-label="SmartBot Central AI Assistant" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ── SmartBot Chat Window ─────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`${
            isFullScreen
              ? 'fixed inset-4 sm:inset-10 z-[100] w-auto h-auto max-h-none rounded-3xl'
              : 'w-[94vw] sm:w-[460px] h-[600px] max-h-[85vh] rounded-3xl mb-3'
          } bg-slate-900/95 backdrop-blur-2xl border-2 border-slate-700/80 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6`}
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(244,63,94,0.15)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-emerald-500 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-lg">
                  🤖
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-white text-sm">SmartBot</h3>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Central Supermarket Agent" />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-rose-400 border border-slate-700 font-bold font-mono">
                    Central Agent
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[210px]">
                  {activeModel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowHistory(prev => !prev)}
                className={`p-1.5 rounded-xl text-xs transition-colors ${showHistory ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Conversation History"
              >
                💬
              </button>
              <button
                type="button"
                onClick={handleStartNewChat}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 text-xs transition-colors"
                title="New Chat Session"
              >
                ➕
              </button>
              <button
                type="button"
                onClick={() => setIsFullScreen(prev => !prev)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 text-xs transition-colors"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullScreen ? '🗗' : '⛶'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 text-sm font-bold transition-colors"
                title="Minimize"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Role Switcher Toolbar */}
          <div className="bg-slate-950/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Active Persona:</span>
            <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-xs">
              {[
                { id: 'customer', label: '👤 Customer' },
                { id: 'staff', label: '🧑‍💼 Staff' },
                { id: 'admin', label: '👑 Admin' }
              ].map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveRole(r.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeRole === r.id
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation History Drawer Overlay */}
          {showHistory && (
            <div className="bg-slate-950/95 border-b border-slate-800 p-3 max-h-[220px] overflow-y-auto z-10 transition-all">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Past Sessions
                </span>
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="text-[10px] bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded-lg font-bold transition-colors"
                >
                  + New
                </button>
              </div>

              {conversationsList.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic py-2 text-center">
                  No previous conversations found.
                </p>
              ) : (
                <div className="space-y-1">
                  {conversationsList.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConversation(c)}
                      className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer text-xs transition-colors ${conversationId === c.id ? 'bg-rose-950/60 border border-rose-600 text-rose-200' : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'}`}
                    >
                      <div className="truncate max-w-[280px]">
                        <span className="font-medium">{c.title || 'Conversation'}</span>
                        <span className="text-[9px] text-slate-500 block">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Session'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-1 text-[11px] transition-colors"
                        title="Delete Chat"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm relative group ${
                    m.sender === 'user'
                      ? 'bg-rose-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  {/* Source / Model Badge for Bot responses */}
                  {m.sender === 'bot' && (
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-700/50 text-[10px]">
                      <span className="font-mono text-rose-400 flex items-center gap-1 font-bold">
                        <span>🤖</span> {m.sourceBadge || 'SmartBot Central Brain'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="opacity-70 group-hover:opacity-100 text-slate-400 hover:text-rose-300 text-[10px] transition-all flex items-center gap-1 bg-slate-900/60 px-1.5 py-0.5 rounded"
                        title="Copy message"
                      >
                        {copiedId === m.id ? '✓' : '📋'}
                      </button>
                    </div>
                  )}

                  <FormattedMessage content={m.text} />

                  {/* Render matched product preview cards with Add-to-Cart */}
                  {m.matchedProducts && m.matchedProducts.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                        📍 Inventory Items Mentioned:
                      </span>
                      {m.matchedProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-slate-900/90 border border-slate-700 rounded-xl p-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-white block truncate">{prod.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Aisle {prod.aisle || '—'} · ₹{prod.price}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => addToCart(prod, 1)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shrink-0"
                          >
                            <span>🛒</span>
                            <span>+ Cart</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-slate-400 mt-1 block text-right font-mono">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs w-max animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="font-mono text-rose-400 font-semibold">SmartBot is reasoning over store records…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(qp.query)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>{qp.icon}</span>
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
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
              placeholder="Ask SmartBot: dinner recipes, route navigation, inventory, prices..."
              disabled={isLoading}
              className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-bold p-2.5 px-3.5 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Launcher Button ──────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-rose-600 via-pink-600 to-emerald-600 hover:from-rose-500 hover:to-emerald-500 text-white px-4 py-3 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 border border-white/20"
        style={{ boxShadow: '0 10px 35px rgba(244,63,94,0.45)' }}
        aria-label="Open SmartBot Central Supermarket AI"
      >
        <span className="text-xl">🤖</span>
        <span className="font-black text-xs tracking-wide">SmartBot</span>
        <span className="w-2.5 h-2.5 rounded-full bg-rose-300 animate-ping absolute -top-0.5 -right-0.5" />
      </button>
    </aside>
  )
}
