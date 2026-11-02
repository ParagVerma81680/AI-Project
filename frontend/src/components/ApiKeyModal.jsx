import { useState, useEffect } from 'react'

export default function ApiKeyModal({ isOpen, onClose }) {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('smartmart_groq_api_key') || ''
      setKey(existing)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartmart_groq_api_key', key.trim())
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 1000)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h3 className="font-black text-base text-white">Groq AI API Key Configuration</h3>
            <p className="text-[11px] text-slate-400">Power your SmartMart AI brain with direct Groq inference</p>
          </div>
        </div>

        <div className="space-y-4 my-4">
          <div>
            <label className="block text-xs font-mono font-bold text-green-400 uppercase tracking-wider mb-1.5">
              Groq API Key (gsk_...)
            </label>
            <input
              type="password"
              placeholder="gsk_..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-green-300 font-mono outline-none focus:ring-2 focus:ring-green-400"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Key is stored securely in your browser's local session. Used directly for real-time live LLM inference.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>ACTIVE MODEL:</span>
              <span className="text-green-400 font-bold">qwen/qwen3.8-27b</span>
            </div>
            <div className="flex justify-between">
              <span>LATENCY:</span>
              <span className="text-amber-400 font-bold">~400 ms (Ultra-Fast)</span>
            </div>
          </div>

          {saved && (
            <div className="p-2.5 rounded-xl bg-green-950 text-green-300 text-xs font-bold text-center border border-green-800">
              ✓ API Key Saved! Live AI Brain Activated.
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xs transition-colors shadow-sm"
            >
              Save & Activate AI Key
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
