import { useState, useEffect, useRef } from 'react'
import client from '../api/client'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: '#16a34a', color: '#fff' }}
      >
        AI
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1"
        style={{ backgroundColor: '#dcfce7' }}
      >
        <span
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: '#16a34a', animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: '#16a34a', animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: '#16a34a', animationDelay: '300ms' }}
        />
      </div>
    </div>
  )
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={
          isUser
            ? { backgroundColor: '#14532d', color: '#86efac' }
            : { backgroundColor: '#16a34a', color: '#fff' }
        }
      >
        {isUser ? 'Me' : 'AI'}
      </div>

      <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'rounded-2xl rounded-br-none text-white'
              : 'rounded-2xl rounded-bl-none text-gray-800'
          }`}
          style={isUser ? { backgroundColor: '#16a34a' } : { backgroundColor: '#dcfce7' }}
        >
          {msg.content}
        </div>

        {/* Sources */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.sources.map((src, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
                title={typeof src === 'string' ? src : src.source || src.file || ''}
              >
                📎 {typeof src === 'string' ? src : src.source || src.file || `Source ${i + 1}`}
              </span>
            ))}
          </div>
        )}

        <span className="text-xs text-gray-400 mt-1 px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

const SUGGESTED = [
  'What is the return policy?',
  'Do you offer price matching?',
  'What are your store hours?',
  'Is there a loyalty program?',
]

export default function PolicyChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m SmartMart\'s AI policy assistant. Ask me anything about store policies, returns, hours, or loyalty programs.',
      sources: [],
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState(null)
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
      const history = messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
      const res = await client.post('/chat/policy', {
        question: content,
        history,
      })

      const data = res.data
      const aiMsg = {
        role: 'assistant',
        content: data.answer || data.response || data.content || 'No response received.',
        sources: data.sources || data.references || [],
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get a response. Is the backend running?')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Sorry, I couldn\'t connect to the AI backend. Please try again.',
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <h1 className="text-3xl font-black mb-1" style={{ color: '#14532d' }}>
        Policy Chat
      </h1>
      <p className="text-gray-500 mb-4">
        Ask any question about SmartMart store policies.
      </p>

      {/* Suggested questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGESTED.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={typing}
            className="text-xs px-3 py-1.5 rounded-full font-medium border transition-colors hover:bg-green-50 disabled:opacity-50"
            style={{ borderColor: '#86efac', color: '#15803d' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl border p-4 mb-4"
        style={{ backgroundColor: '#f9fafb', borderColor: '#d1fae5', minHeight: 0 }}
      >
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-3 px-4 py-2 rounded-xl text-sm border"
          style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}
        >
          {error}
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex items-end gap-2 bg-white rounded-2xl border p-3 shadow-sm"
        style={{ borderColor: '#d1fae5' }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about store policies, returns, hours…"
          className="flex-1 resize-none text-sm outline-none bg-transparent leading-relaxed max-h-32"
          style={{ color: '#1f2937' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || typing}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-all disabled:opacity-40 hover:opacity-90"
          style={{ backgroundColor: '#16a34a' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-center text-gray-400 mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
