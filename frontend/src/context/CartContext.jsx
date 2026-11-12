import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import client from '../api/client'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState({
    id: 0,
    session_id: '',
    items: [],
    item_count: 0,
    subtotal: 0,
    delivery_fee: 0,
    tax: 0,
    grand_total: 0,
    free_delivery_eligible: false,
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [liveInventory, setLiveInventory] = useState({})
  const [recentOrder, setRecentOrder] = useState(null)
  const [notification, setNotification] = useState(null)

  // Stable session identifier per browser instance
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('smartmart_session_id')
    if (!sid) {
      sid = 'cust_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
      localStorage.setItem('smartmart_session_id', sid)
    }
    return sid
  })

  // Show transient toast notification
  const showToast = useCallback((msg, type = 'success') => {
    setNotification({ msg, type, id: Date.now() })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // ── Fetch Cart from Backend ───────────────────────────────────────
  const fetchCart = useCallback(async () => {
    try {
      const res = await client.get('/cart', {
        headers: { 'X-Session-ID': sessionId },
        params: { session_id: sessionId }
      })
      if (res.data) {
        setCart(res.data)
      }
    } catch (err) {
      console.warn('Could not fetch cart from server:', err.message)
    }
  }, [sessionId])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // ── Real-Time WebSockets for Shared Inventory Consistency ─────────
  const wsRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    let reconnectTimer = null

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        // When running in Vite dev with proxy on port 5173, backend is on localhost:8000
        const host = window.location.port === '5173' ? 'localhost:8000' : window.location.host
        const wsUrl = `${protocol}//${host}/api/ws/inventory`

        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          // Connected
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'inventory_update' && data.product_id) {
              setLiveInventory((prev) => ({
                ...prev,
                [data.product_id]: data.stock,
              }))
            }
          } catch {}
        }

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimer = setTimeout(connectWebSocket, 4000)
          }
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch (err) {
        if (isMounted) {
          reconnectTimer = setTimeout(connectWebSocket, 5000)
        }
      }
    }

    connectWebSocket()

    return () => {
      isMounted = false
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  // ── Cart Operations ───────────────────────────────────────────────
  const addToCart = async (product, quantity = 1) => {
    setIsLoading(true)
    try {
      const res = await client.post(
        '/cart/items',
        {
          product_id: product.id,
          quantity,
          session_id: sessionId,
        },
        {
          headers: { 'X-Session-ID': sessionId }
        }
      )
      if (res.data) {
        setCart(res.data)
        showToast(`Added ${quantity}x ${product.name || product.product_name} to cart!`)
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to add item to cart'
      showToast(detail, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (itemId, newQuantity) => {
    setIsLoading(true)
    try {
      const res = await client.put(
        `/cart/items/${itemId}`,
        {
          quantity: newQuantity,
          session_id: sessionId,
        },
        {
          headers: { 'X-Session-ID': sessionId }
        }
      )
      if (res.data) {
        setCart(res.data)
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to update quantity'
      showToast(detail, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromCart = async (itemId) => {
    setIsLoading(true)
    try {
      const res = await client.delete(`/cart/items/${itemId}`, {
        headers: { 'X-Session-ID': sessionId },
        params: { session_id: sessionId }
      })
      if (res.data) {
        setCart(res.data)
        showToast('Item removed from cart', 'info')
      }
    } catch (err) {
      showToast('Could not remove item', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async () => {
    setIsLoading(true)
    try {
      const res = await client.delete('/cart', {
        headers: { 'X-Session-ID': sessionId },
        params: { session_id: sessionId }
      })
      if (res.data) {
        setCart(res.data)
      }
    } catch (err) {
      console.warn('Clear cart error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)
  const toggleCart = () => setIsCartOpen((prev) => !prev)

  // Helper to get effective live stock count
  const getProductStock = (product) => {
    if (!product) return 0
    if (liveInventory[product.id] !== undefined) {
      return liveInventory[product.id]
    }
    return product.stock ?? product.stock_quantity ?? 0
  }

  // Helper to get in-cart quantity of a product
  const getItemQuantity = (productId) => {
    const it = (cart.items || []).find((i) => i.product_id === productId)
    return it ? it.quantity : 0
  }

  const getItemId = (productId) => {
    const it = (cart.items || []).find((i) => i.product_id === productId)
    return it ? it.id : null
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        sessionId,
        isCartOpen,
        isLoading,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
        liveInventory,
        getProductStock,
        getItemQuantity,
        getItemId,
        recentOrder,
        setRecentOrder,
        showToast
      }}
    >
      {children}

      {/* Floating Global Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-600 text-white shadow-rose-900/30'
              : notification.type === 'info'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'bg-emerald-600 text-white shadow-emerald-900/30'
          }`}
        >
          <span>{notification.type === 'error' ? '⚠️' : notification.type === 'info' ? 'ℹ️' : '✓'}</span>
          <span>{notification.msg}</span>
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartContext
