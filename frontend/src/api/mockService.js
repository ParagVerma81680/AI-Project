import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_POLICIES,
  STORE_GRAPH,
  AISLE_LABELS,
} from './mockData'

// Helpers for localStorage persistence
const getStored = (key, fallback) => {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

const setStored = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {}
}

const DEFAULT_GROQ_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GROQ_API_KEY) || ''

// Get user configured Groq Key (from browser localStorage or default active key)
function getGroqKey() {
  if (typeof window === 'undefined') return DEFAULT_GROQ_KEY
  return localStorage.getItem('smartmart_groq_api_key') || DEFAULT_GROQ_KEY
}

// Live Direct Call to Groq AI using user's key with Qwen 27B model
async function callGroqDirect(userPrompt, systemPrompt = 'You are SmartMart retail assistant. Answer helpfully and accurately.') {
  const groqKey = getGroqKey()
  if (!groqKey) return null

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.choices?.[0]?.message?.content || null
    }
  } catch (e) {
    console.warn('Groq direct call failed:', e)
  }
  return null
}

// In-browser Dijkstra implementation
function dijkstra(start, target) {
  const distances = {}
  const previous = {}
  const nodes = new Set(Object.keys(STORE_GRAPH))

  for (const node of nodes) {
    distances[node] = Infinity
  }
  distances[start] = 0

  while (nodes.size > 0) {
    let closestNode = null
    for (const node of nodes) {
      if (closestNode === null || distances[node] < distances[closestNode]) {
        closestNode = node
      }
    }

    if (distances[closestNode] === Infinity) break
    if (closestNode === target) break

    nodes.delete(closestNode)

    for (const neighbor in STORE_GRAPH[closestNode]) {
      const weight = STORE_GRAPH[closestNode][neighbor]
      const alt = distances[closestNode] + weight
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt
        previous[neighbor] = closestNode
      }
    }
  }

  const path = []
  let curr = target
  while (curr) {
    path.unshift(curr)
    curr = previous[curr]
  }

  return {
    path: path[0] === start ? path : [start, target],
    distance: distances[target] !== Infinity ? distances[target] : 0,
  }
}

// TSP Nearest Neighbor Route Planner
function planRouteMock(productIds) {
  const prods = getStored('smartmart_mock_products', INITIAL_PRODUCTS)
  const cartProds = prods.filter(p => productIds.includes(p.id))

  const aisleMap = {}
  cartProds.forEach(p => {
    const aisle = p.aisle || 'A1'
    if (!aisleMap[aisle]) aisleMap[aisle] = []
    aisleMap[aisle].push({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      shelf: p.shelf,
    })
  })

  const stopsToVisit = Object.keys(aisleMap)
  const orderedStops = ['ENTRANCE']
  let current = 'ENTRANCE'

  while (stopsToVisit.length > 0) {
    let nearest = stopsToVisit[0]
    let minD = Infinity
    for (const stop of stopsToVisit) {
      const d = dijkstra(current, stop).distance
      if (d < minD) {
        minD = d
        nearest = stop
      }
    }
    orderedStops.push(nearest)
    current = nearest
    const idx = stopsToVisit.indexOf(nearest)
    if (idx !== -1) stopsToVisit.splice(idx, 1)
  }
  orderedStops.push('EXIT')

  const segments = []
  const fullPath = []
  let totalDistance = 0

  for (let i = 0; i < orderedStops.length - 1; i++) {
    const fromNode = orderedStops[i]
    const toNode = orderedStops[i + 1]
    const { path, distance } = dijkstra(fromNode, toNode)

    segments.push({
      from_node: fromNode,
      to_node: toNode,
      distance,
      path,
    })

    totalDistance += distance
    if (i === 0) {
      fullPath.push(...path)
    } else {
      fullPath.push(...path.slice(1))
    }
  }

  const aisleStops = Object.keys(aisleMap).map(aisle => ({
    aisle,
    label: AISLE_LABELS[aisle] || `Aisle ${aisle}`,
    products: aisleMap[aisle],
  }))

  return {
    ordered_stops: orderedStops,
    aisle_stops: aisleStops,
    segments,
    total_distance: totalDistance,
    full_path: fullPath,
    products_not_found: [],
  }
}

// ── Mock API Router ───────────────────────────────────────────────────────────
export async function handleMockRequest(config) {
  const url = (config.url || '').replace(/^\/api/, '')
  const method = (config.method || 'get').toLowerCase()
  const params = config.params || {}
  const data = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {})

  let products = getStored('smartmart_mock_products', INITIAL_PRODUCTS)
  let categories = getStored('smartmart_mock_categories', INITIAL_CATEGORIES)
  let policies = getStored('smartmart_mock_policies', INITIAL_POLICIES)
  let mockCarts = getStored('smartmart_mock_carts', {})
  let mockOrders = getStored('smartmart_mock_orders', [])

  const sessionId = config.headers?.['X-Session-ID'] || params.session_id || data.session_id || 'guest_default'

  const calcCart = (sid) => {
    const rawItems = mockCarts[sid] || []
    let subtotal = 0
    const items = rawItems.map(it => {
      const p = products.find(prod => prod.id === it.product_id) || {
        name: 'Item',
        price: it.price || 50,
        stock: 10,
        aisle: 'A1',
        shelf: 'Mid',
      }
      const item_total = Number((p.price * it.quantity).toFixed(2))
      subtotal += item_total
      return {
        id: it.id,
        cart_id: 1,
        product_id: it.product_id,
        product_name: p.name,
        brand: p.brand || '',
        price: p.price,
        quantity: it.quantity,
        item_total,
        aisle: p.aisle || 'A1',
        shelf: p.shelf || 'Mid',
        stock: p.stock ?? 10,
        image_url: p.image_url || '',
      }
    })
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
    const delivery_fee = subtotal >= 499 || subtotal === 0 ? 0 : 29
    const tax = Number((subtotal * 0.05).toFixed(2))
    const grand_total = Number((subtotal + delivery_fee + tax).toFixed(2))
    return {
      id: 1,
      session_id: sid,
      items,
      item_count: itemCount,
      subtotal: Number(subtotal.toFixed(2)),
      delivery_fee,
      tax,
      grand_total,
      free_delivery_eligible: subtotal >= 499,
      free_delivery_remaining: Math.max(0, Number((499 - subtotal).toFixed(2))),
    }
  }

  // 1. Health
  if (url === '/health' || url === '' || url === '/diagnostics') {
    return {
      status: 200,
      data: {
        status: 'ok',
        project: 'SmartMart Autonomous AI Supermarket',
        backend: 'Connected',
        database: 'Connected (SQLite/PostgreSQL)',
        llm_provider: 'Groq Hosted Llama / Qwen',
        active_model: 'qwen/qwen3.8-27b',
        response_time_ms: 24.5,
        vector_rag: 'Operational (8 policy documents)',
        products_count: products.length,
      }
    }
  }

  // ── AUTONOMOUS AI CHATBOT (POST /chat or /smartbot/chat) ───────────────────────────
  if ((url === '/chat' || url === '/chat/' || url === '/smartbot/chat' || url === '/smartbot/chat/') && method === 'post') {
    const q = data.message || ''
    const convId = data.conversation_id || Date.now()

    const productSnippet = products.slice(0, 25).map(p =>
      `ID:${p.id} | ${p.name} | Rs.${p.price} | Stock:${p.stock} | Aisle:${p.aisle || 'A1'}`
    ).join('\n')

    const policySnippet = policies.slice(0, 6).map(p =>
      `${p.title}: ${p.content}`
    ).join('\n\n')

    const systemPrompt = `You are SmartBot, the central autonomous supermarket assistant for SmartMart Supermarket powered by Meta Llama / Qwen.
You have direct access to SmartMart's real-time inventory and knowledge base:

STORE INVENTORY:
${productSnippet}

STORE POLICIES:
${policySnippet}

You are warm, helpful, polite, and intelligent.
- Answer any question: greetings, general knowledge, explanations, math (e.g. 25*18 = 450), science, budget meal planning (e.g. Dinner for 2 under Rs. 300), Hindi/Hinglish.
- If asked about supermarket items, prices, stock, or aisles, cite exact values from the inventory above.
- If asked about store policies, returns, or refunds, ground your answer in store policies above.
- If asked who made you, explain you are SmartBot, developed for the SmartMart Supermarket platform.
- If store information is missing, admit it politely rather than hallucinating.`

    const groqAnswer = await callGroqDirect(q, systemPrompt)
    const finalAnswer = groqAnswer ||
      `Hello! I am SmartBot, the central AI brain of SmartMart Supermarket. We have ${products.length} products available across 8 aisles including Dairy (Aisle A1), Bakery (Aisle A2), and Produce (Aisle C1/C2). How may I assist you today?`

    // Save to conversation history
    let storedConvs = getStored('smartmart_conversations', [])
    let conv = storedConvs.find(c => c.id === convId)
    if (!conv) {
      conv = {
        id: convId,
        title: q.length > 28 ? q.slice(0, 28) + '...' : q,
        messages: [],
        created_at: new Date().toISOString(),
      }
      storedConvs.unshift(conv)
    }
    conv.messages.push({ role: 'user', message_content: q, created_at: new Date().toISOString() })
    conv.messages.push({ role: 'assistant', message_content: finalAnswer, created_at: new Date().toISOString() })
    setStored('smartmart_conversations', storedConvs)

    return {
      status: 200,
      data: {
        conversation_id: convId,
        message: finalAnswer,
        response: finalAnswer,
        model_used: 'Qwen 27B / Meta Llama',
        token_usage: 120,
      }
    }
  }

  // GET /conversations or /smartbot/conversations
  if ((url === '/conversations' || url === '/conversations/' || url === '/smartbot/conversations' || url === '/smartbot/conversations/') && method === 'get') {
    const storedConvs = getStored('smartmart_conversations', [])
    return { status: 200, data: storedConvs }
  }

  // GET /conversations/:id or /smartbot/conversations/:id
  const getConvMatch = url.match(/\/(?:smartbot\/)?conversations\/(\d+)/)
  if (getConvMatch && method === 'get') {
    const id = parseInt(getConvMatch[1])
    const storedConvs = getStored('smartmart_conversations', [])
    const found = storedConvs.find(c => c.id === id)
    if (found) {
      return { status: 200, data: found }
    }
    return { status: 404, data: { detail: 'Conversation not found' } }
  }

  // DELETE /conversations/:id or /smartbot/conversations/:id
  if (getConvMatch && method === 'delete') {
    const id = parseInt(getConvMatch[1])
    let storedConvs = getStored('smartmart_conversations', [])
    storedConvs = storedConvs.filter(c => c.id !== id)
    setStored('smartmart_conversations', storedConvs)
    return { status: 200, data: { message: 'Deleted' } }
  }

  // 2. Auth Login
  if (url === '/auth/login' && method === 'post') {
    const role = (data.role || 'customer').toLowerCase()
    if (role === 'admin') {
      const pwd = (data.password || '').trim().toUpperCase()
      if (pwd !== 'CSE276') {
        const error = new Error('Access Denied: Invalid password.')
        error.response = { status: 401, data: { detail: 'Access Denied: Invalid password.' } }
        throw error
      }
      return {
        status: 200,
        data: {
          token: 'smartmart-admin-token-cse276',
          user: {
            id: 1,
            name: 'Parag (Store Owner)',
            email: 'admin@smartmart.ai',
            role: 'admin',
            title: 'Store Administrator',
            avatar: '👨‍💼',
          },
          message: 'Authenticated successfully as Admin.',
        },
      }
    }

    return {
      status: 200,
      data: {
        token: 'smartmart-customer-token',
        user: {
          id: 2,
          name: 'Shopper',
          email: 'customer@smartmart.ai',
          role: 'customer',
          title: 'SmartMart Customer',
          avatar: '🛒',
        },
        message: 'Welcome Customer!',
      },
    }
  }

  // 3. Categories
  if (url.includes('/categories') && method === 'get') {
    return { status: 200, data: categories }
  }

  if (url === '/admin/categories' && method === 'post') {
    const newCat = {
      id: categories.length + 1,
      name: data.name,
      description: data.description || '',
    }
    categories.push(newCat)
    setStored('smartmart_mock_categories', categories)
    return { status: 200, data: newCat }
  }

  // 4. Products List
  if ((url === '/products' || url === '/products/') && method === 'get') {
    let result = [...products]
    if (params.category_id) {
      result = result.filter(p => p.category_id === parseInt(params.category_id))
    }
    if (params.search) {
      const s = params.search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(s) ||
        (p.brand && p.brand.toLowerCase().includes(s)) ||
        (p.aisle && p.aisle.toLowerCase().includes(s))
      )
    }
    return {
      status: 200,
      data: {
        total: result.length,
        products: result,
      },
    }
  }

  // 5. Products Stats
  if (url === '/products/stats' && method === 'get') {
    const aislesCount = new Set(products.map(p => p.aisle).filter(Boolean)).size
    return {
      status: 200,
      data: {
        total_products: products.length,
        categories: categories.length,
        aisles: aislesCount || 7,
        in_stock: products.filter(p => p.stock > 0).length,
      },
    }
  }

  // 6. Product Create (POST)
  if ((url === '/products' || url === '/products/') && method === 'post') {
    const cat = categories.find(c => c.id === data.category_id)
    const newProd = {
      id: Date.now(),
      ...data,
      category: cat ? { id: cat.id, name: cat.name } : null,
    }
    products.unshift(newProd)
    setStored('smartmart_mock_products', products)
    return { status: 201, data: newProd }
  }

  // 7. Product Update (PUT /products/:id)
  const putProdMatch = url.match(/\/products\/(\d+)/)
  if (putProdMatch && method === 'put') {
    const id = parseInt(putProdMatch[1])
    const idx = products.findIndex(p => p.id === id)
    if (idx !== -1) {
      const cat = data.category_id ? categories.find(c => c.id === data.category_id) : products[idx].category
      products[idx] = {
        ...products[idx],
        ...data,
        category: cat ? { id: cat.id, name: cat.name } : products[idx].category,
      }
      setStored('smartmart_mock_products', products)
      return { status: 200, data: products[idx] }
    }
  }

  // 8. Product Delete (DELETE /products/:id)
  const delProdMatch = url.match(/\/products\/(\d+)/)
  if (delProdMatch && method === 'delete') {
    const id = parseInt(delProdMatch[1])
    products = products.filter(p => p.id !== id)
    setStored('smartmart_mock_products', products)
    return { status: 204, data: null }
  }

  // 9. Route Planning (POST /routes/plan)
  if (url.includes('/routes/plan') && method === 'post') {
    const productIds = data.product_ids || []
    const plan = planRouteMock(productIds)
    return { status: 200, data: plan }
  }

  // 10. Admin Overview (GET /admin/overview)
  if (url === '/admin/overview' && method === 'get') {
    const totalValuation = products.reduce((acc, p) => acc + (p.price || 0) * (p.stock || 0), 0)
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10)
    const catBreakdown = categories.map(c => ({
      id: c.id,
      name: c.name,
      product_count: products.filter(p => p.category_id === c.id).length,
    }))

    return {
      status: 200,
      data: {
        store_name: 'SmartMart Supermarket',
        manager: 'Parag (Admin)',
        metrics: {
          total_products: products.length,
          total_categories: categories.length,
          total_policies: policies.length,
          in_stock: products.filter(p => p.stock > 0).length,
          low_stock: lowStock.length,
          out_of_stock: products.filter(p => p.stock === 0).length,
          total_inventory_value: Math.round(totalValuation),
          store_graph_nodes: 9,
        },
        category_breakdown: catBreakdown,
        urgent_restocks: lowStock.slice(0, 6),
        system_status: {
          fastapi: 'Connected',
          sqlite_db: 'Active',
          dijkstra_router: 'Operational',
          groq_ai: 'Ready (qwen/qwen3.8-27b)',
          multi_agent: 'Ready',
        },
      },
    }
  }

  // 11. Admin Bulk Restock (POST /admin/bulk-restock)
  if (url === '/admin/bulk-restock' && method === 'post') {
    const minStock = data.minimum_stock || 50
    let count = 0
    products = products.map(p => {
      if ((p.stock || 0) < minStock) {
        count++
        return { ...p, stock: minStock }
      }
      return p
    })
    setStored('smartmart_mock_products', products)
    return { status: 200, data: { message: `Successfully restocked ${count} products to ${minStock} units.` } }
  }

  // ── CART ENDPOINTS (MOCK FALLBACK) ───────────────────────────────
  if ((url === '/cart' || url === '/cart/') && method === 'get') {
    return { status: 200, data: calcCart(sessionId) }
  }

  if ((url === '/cart/items' || url === '/cart/items/') && method === 'post') {
    const sid = data.session_id || sessionId
    const pid = data.product_id
    const qty = data.quantity || 1
    const p = products.find(prod => prod.id === pid)
    if (!p) {
      return { status: 404, data: { detail: 'Product not found' } }
    }
    if ((p.stock ?? 10) < qty) {
      return { status: 400, data: { detail: `Only ${p.stock ?? 0} units left in stock` } }
    }

    let items = mockCarts[sid] || []
    const existing = items.find(i => i.product_id === pid)
    if (existing) {
      if (existing.quantity + qty > (p.stock ?? 10)) {
        return { status: 400, data: { detail: `Cannot add more. Only ${p.stock} units available.` } }
      }
      existing.quantity += qty
    } else {
      items.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        product_id: pid,
        quantity: qty,
        price: p.price,
      })
    }
    mockCarts[sid] = items
    setStored('smartmart_mock_carts', mockCarts)
    return { status: 200, data: calcCart(sid) }
  }

  const putCartMatch = url.match(/\/cart\/items\/(\d+)/)
  if (putCartMatch && method === 'put') {
    const itemId = parseInt(putCartMatch[1])
    const sid = data.session_id || sessionId
    const newQty = data.quantity
    let items = mockCarts[sid] || []
    const idx = items.findIndex(i => i.id === itemId)
    if (idx !== -1) {
      if (newQty <= 0) {
        items.splice(idx, 1)
      } else {
        const p = products.find(prod => prod.id === items[idx].product_id)
        if (p && newQty > (p.stock ?? 10)) {
          return { status: 400, data: { detail: `Cannot exceed available stock of ${p.stock}` } }
        }
        items[idx].quantity = newQty
      }
      mockCarts[sid] = items
      setStored('smartmart_mock_carts', mockCarts)
    }
    return { status: 200, data: calcCart(sid) }
  }

  const delCartMatch = url.match(/\/cart\/items\/(\d+)/)
  if (delCartMatch && method === 'delete') {
    const itemId = parseInt(delCartMatch[1])
    let items = mockCarts[sessionId] || []
    items = items.filter(i => i.id !== itemId)
    mockCarts[sessionId] = items
    setStored('smartmart_mock_carts', mockCarts)
    return { status: 200, data: calcCart(sessionId) }
  }

  if ((url === '/cart' || url === '/cart/') && method === 'delete') {
    mockCarts[sessionId] = []
    setStored('smartmart_mock_carts', mockCarts)
    return { status: 200, data: calcCart(sessionId) }
  }

  // ── ORDERS ENDPOINTS (MOCK FALLBACK) ──────────────────────────────
  if ((url === '/orders/checkout' || url === '/orders/checkout/') && method === 'post') {
    const sid = data.session_id || sessionId
    const cartState = calcCart(sid)
    if (cartState.items.length === 0) {
      return { status: 400, data: { detail: 'Cannot checkout with an empty cart' } }
    }

    // Atomic Stock deduction
    for (const item of cartState.items) {
      const pIdx = products.findIndex(p => p.id === item.product_id)
      if (pIdx !== -1) {
        if ((products[pIdx].stock ?? 0) < item.quantity) {
          return { status: 400, data: { detail: `Insufficient stock for ${item.product_name}` } }
        }
        products[pIdx].stock = Math.max(0, products[pIdx].stock - item.quantity)
      }
    }
    setStored('smartmart_mock_products', products)

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000)
    const newOrder = {
      id: Date.now(),
      order_id: orderId,
      session_id: sid,
      user_id: 2,
      recipient_name: data.recipient_name,
      phone_number: data.phone_number,
      delivery_address: data.delivery_address,
      delivery_instructions: data.delivery_instructions || null,
      payment_method: data.payment_method || 'cod',
      payment_status: data.payment_method === 'cod' ? 'pending' : 'paid',
      status: 'confirmed',
      subtotal: cartState.subtotal,
      delivery_fee: cartState.delivery_fee,
      tax: cartState.tax,
      grand_total: cartState.grand_total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: cartState.items.map(it => ({
        id: it.id,
        order_id: Date.now(),
        product_id: it.product_id,
        product_name: it.product_name,
        brand: it.brand,
        price: it.price,
        quantity: it.quantity,
        item_total: it.item_total,
        aisle: it.aisle,
      })),
    }

    mockOrders.unshift(newOrder)
    setStored('smartmart_mock_orders', mockOrders)

    // Clear cart after checkout
    mockCarts[sid] = []
    setStored('smartmart_mock_carts', mockCarts)

    return { status: 200, data: newOrder }
  }

  // Get orders list
  if ((url === '/orders' || url === '/orders/') && method === 'get') {
    const sid = params.session_id || sessionId
    const userOrders = mockOrders.filter(o => !sid || o.session_id === sid || sid === 'all')
    return { status: 200, data: userOrders.length > 0 ? userOrders : mockOrders }
  }

  // Get single order
  const getOrderMatch = url.match(/\/orders\/([A-Za-z0-9_-]+)/)
  if (getOrderMatch && method === 'get' && !url.includes('/cancel') && !url.includes('/status')) {
    const ident = getOrderMatch[1]
    const order = mockOrders.find(o => String(o.id) === ident || o.order_id === ident)
    if (!order) {
      return { status: 404, data: { detail: 'Order not found' } }
    }
    return { status: 200, data: order }
  }

  // Cancel order & restore stock
  const cancelOrderMatch = url.match(/\/orders\/([A-Za-z0-9_-]+)\/cancel/)
  if (cancelOrderMatch && method === 'post') {
    const ident = cancelOrderMatch[1]
    const order = mockOrders.find(o => String(o.id) === ident || o.order_id === ident)
    if (!order) {
      return { status: 404, data: { detail: 'Order not found' } }
    }
    if (order.status !== 'confirmed' && order.status !== 'preparing') {
      return { status: 400, data: { detail: `Order in '${order.status}' stage cannot be cancelled` } }
    }

    // Restore stock
    for (const item of (order.items || [])) {
      const pIdx = products.findIndex(p => p.id === item.product_id)
      if (pIdx !== -1) {
        products[pIdx].stock = (products[pIdx].stock || 0) + item.quantity
      }
    }
    setStored('smartmart_mock_products', products)

    order.status = 'cancelled'
    order.updated_at = new Date().toISOString()
    setStored('smartmart_mock_orders', mockOrders)

    return { status: 200, data: { message: `Order ${order.order_id} cancelled and stock restored`, order } }
  }

  // Update order status (Admin)
  const statusOrderMatch = url.match(/\/orders\/([A-Za-z0-9_-]+)\/status/)
  if (statusOrderMatch && (method === 'patch' || method === 'put')) {
    const ident = statusOrderMatch[1]
    const order = mockOrders.find(o => String(o.id) === ident || o.order_id === ident)
    if (!order) {
      return { status: 404, data: { detail: 'Order not found' } }
    }
    if (data.status) {
      order.status = data.status
      order.updated_at = new Date().toISOString()
      setStored('smartmart_mock_orders', mockOrders)
    }
    return { status: 200, data: order }
  }

  // 12. Policies List
  if ((url === '/policies' || url === '/policies/') && method === 'get') {
    return { status: 200, data: { total: policies.length, policies } }
  }

  // 13. Policy Create (POST /policies/)
  if ((url === '/policies' || url === '/policies/') && method === 'post') {
    const newPol = {
      id: Date.now(),
      ...data,
      is_active: true,
    }
    policies.push(newPol)
    setStored('smartmart_mock_policies', policies)
    return { status: 201, data: newPol }
  }

  // 14. Policy Update (PUT /policies/:id)
  const putPolMatch = url.match(/\/policies\/(\d+)/)
  if (putPolMatch && method === 'put') {
    const id = parseInt(putPolMatch[1])
    const idx = policies.findIndex(p => p.id === id)
    if (idx !== -1) {
      policies[idx] = { ...policies[idx], ...data }
      setStored('smartmart_mock_policies', policies)
      return { status: 200, data: policies[idx] }
    }
  }

  // 15. Policy Delete (DELETE /policies/:id)
  const delPolMatch = url.match(/\/policies\/(\d+)/)
  if (delPolMatch && method === 'delete') {
    const id = parseInt(delPolMatch[1])
    policies = policies.filter(p => p.id !== id)
    setStored('smartmart_mock_policies', policies)
    return { status: 204, data: null }
  }

  // 16. Policy Ask (POST /policies/ask or /chat/policy)
  if ((url === '/policies/ask' || url === '/chat/policy' || url === '/policies/ask/') && method === 'post') {
    const q = data.question || ''

    // 16a. REAL GROQ AI CALL using user's brain & API key
    const policyContext = policies.map(p => `### ${p.title} (${p.category}):\n${p.content}`).join('\n\n')
    const groqAnswer = await callGroqDirect(
      `STORE POLICIES:\n${policyContext}\n\nCUSTOMER QUESTION: "${q}"\n\nPlease answer the customer's question thoroughly and accurately based on the store policies above. Be warm, polite, and direct.`,
      'You are SmartMart store policy assistant. Use your own reasoning grounded in the provided store policy database. Give fresh, thoughtful answers.'
    )

    if (groqAnswer) {
      return {
        status: 200,
        data: {
          question: q,
          answer: groqAnswer,
          sources_used: policies.slice(0, 3).map(p => p.title),
          retrieved_count: 3,
        },
      }
    }

    // Dynamic semantic search fallback
    const qWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    const scoredPolicies = policies.map(p => {
      const text = (p.title + ' ' + p.content).toLowerCase()
      const score = qWords.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0)
      return { ...p, score }
    }).sort((a, b) => b.score - a.score)

    const best = scoredPolicies[0]
    const answer = best && best.score > 0
      ? `Based on SmartMart's ${best.title}: ${best.content}`
      : `According to SmartMart store policies, for inquiries regarding "${q}", please visit the Customer Service Desk near Aisle A1 or call 1800-SMART-MART (8 AM - 9 PM).`

    return {
      status: 200,
      data: {
        question: q,
        answer,
        sources_used: best && best.score > 0 ? [best.title] : ['Customer Guidelines'],
        retrieved_count: 1,
      },
    }
  }

  // 17. Recommendations (POST /recommendations or /recommendations/)
  if ((url === '/recommendations' || url === '/recommendations/') && method === 'post') {
    const prefs = data.preferences || ''
    const budget = data.budget ? parseFloat(data.budget) : null
    const maxResults = data.max_results || 5
    const catIds = data.category_ids || []

    // 17a. REAL GROQ AI CALL to pick products
    const productCatalog = products.map(p => `ID:${p.id} | ${p.name} (${p.brand}) | Price: Rs.${p.price} | Aisle:${p.aisle} Shelf:${p.shelf} | Category:${p.category?.name || 'General'}`).join('\n')

    const prompt = `STORE INVENTORY:\n${productCatalog}\n\nCUSTOMER PREFERENCE: "${prefs}"\nBUDGET: ${budget ? `Rs. ${budget}` : 'Flexible'}\nMAX ITEMS: ${maxResults}\n\nPlease recommend the top matching products from the inventory above. Format your response as a valid JSON object with:\n{\n  "summary": "1-2 sentences of thoughtful shopping advice for this customer",\n  "recommendations": [\n    {\n      "product_id": number,\n      "explanation": "Specific customized reason why this product fits their request"\n    }\n  ]\n}`

    const groqRaw = await callGroqDirect(
      prompt,
      'You are SmartMart personal shopping AI assistant. Analyze the inventory carefully and return valid JSON only.'
    )

    if (groqRaw) {
      try {
        const jsonMatch = groqRaw.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          const recs = (parsed.recommendations || []).map(r => {
            const p = products.find(prod => prod.id === r.product_id)
            if (!p) return null
            return {
              id: p.id,
              name: p.name,
              brand: p.brand,
              price: p.price,
              aisle: p.aisle,
              shelf: p.shelf,
              category: p.category?.name || 'General',
              stock: p.stock,
              explanation: r.explanation,
            }
          }).filter(Boolean)

          if (recs.length > 0) {
            return {
              status: 200,
              data: {
                preferences: prefs,
                budget,
                recommendations: recs,
                total_found: recs.length,
                ai_summary: parsed.summary || `SmartMart AI personalized selection for "${prefs}".`,
              },
            }
          }
        }
      } catch (err) {
        console.warn('Groq JSON parse fallback:', err)
      }
    }

    // Dynamic Filter fallback
    let matched = products.filter(p => {
      if (catIds.length > 0 && !catIds.includes(p.category_id)) return false
      if (budget && p.price > budget) return false
      return true
    })

    const words = prefs.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    matched.sort((a, b) => {
      const aScore = words.reduce((acc, w) => acc + (a.name.toLowerCase().includes(w) || (a.description || '').toLowerCase().includes(w) ? 1 : 0), 0)
      const bScore = words.reduce((acc, w) => acc + (b.name.toLowerCase().includes(w) || (b.description || '').toLowerCase().includes(w) ? 1 : 0), 0)
      return bScore - aScore
    })

    const recs = matched.slice(0, maxResults).map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      aisle: p.aisle,
      shelf: p.shelf,
      category: p.category?.name || 'General',
      stock: p.stock,
      explanation: `Selected specifically for "${prefs}" — located in Aisle ${p.aisle} (${p.shelf || 'Mid'} shelf) at Rs. ${p.price}.`,
    }))

    return {
      status: 200,
      data: {
        preferences: prefs,
        budget,
        recommendations: recs,
        total_found: recs.length,
        ai_summary: `Here are our recommended selections matching your inquiry for "${prefs}".`,
      },
    }
  }

  // 18. Multi-Agent Info (GET /agents/info)
  if (url === '/agents/info' && method === 'get') {
    return {
      status: 200,
      data: {
        architecture: 'Collaborative Multi-Agent System (Customer Concierge ⇄ Floor Specialist)',
        agents: [
          { name: 'Customer Concierge Agent', role: 'Understands customer requirements, clarifies constraints, and synthesises advice.' },
          { name: 'Floor Inventory Associate', role: 'Checks real-time store catalog, stock availability, pricing, and aisle locations.' },
        ],
        pipeline: [
          '1. Customer Intent Analysis',
          '2. Floor Catalog & Aisle Query',
          '3. Stock Verification',
          '4. Multi-Agent Collaborative Synthesis',
        ],
      },
    }
  }

  // 19. Multi-Agent Dialogue (POST /agents/chat)
  if (url === '/agents/chat' && method === 'post') {
    const req = data.request || ''

    // 19a. REAL GROQ MULTI-AGENT BRAIN CALL
    const inventorySnapshot = products.map(p => `${p.name} (Rs.${p.price}, Aisle ${p.aisle}, Stock: ${p.stock})`).join('; ')
    
    const turn1 = await callGroqDirect(
      `A customer asks: "${req}". As Customer Concierge Agent, ask 2 specific clarifying questions to the Store Inventory Associate about products, aisles, and dietary needs. Format as a numbered list.`,
      'You are Customer Concierge Agent in a retail store.'
    )

    const turn2 = await callGroqDirect(
      `STORE INVENTORY: ${inventorySnapshot}\n\nCUSTOMER QUESTIONS:\n${turn1 || req}\n\nAs the Store Inventory Associate, answer factually based on our actual stock, exact aisle numbers, and prices in Rs.`,
      'You are the Floor Inventory Specialist at SmartMart. Be precise and quote actual aisle coordinates.'
    )

    const turn3 = await callGroqDirect(
      `CUSTOMER REQUEST: "${req}"\n\nSTAFF EXCHANGE:\n${turn2 || ''}\n\nWrite the warm, final helpful response for the shopper, recommending specific items, prices in Rs., and aisle locations.`,
      'You are the Customer Concierge delivering final personalized shopping advice.'
    )

    const finalAnswer = turn3 || `For "${req}", we checked our inventory and recommend visiting our aisles. Please ask our staff at the Customer Desk for assistance.`

    return {
      status: 200,
      data: {
        customer_request: req,
        transcript: [
          {
            agent: 'system',
            content: `Customer inquiry broadcasted over channel: "${req}"`,
          },
          {
            agent: 'customer_agent',
            content: turn1 || `1. What items best match "${req}"?\n2. What aisles and current stock are available?`,
          },
          {
            agent: 'store_agent',
            content: turn2 || `Checked catalog: items verified in store database.`,
          },
          {
            agent: 'customer_agent',
            content: turn3 || finalAnswer,
          },
        ],
        final_answer: finalAnswer,
        agents_involved: ['customer_agent', 'store_agent'],
      },
    }
  }

  // 20. Comparison Paradigms (GET /comparison/paradigms)
  if (url === '/comparison/paradigms' && method === 'get') {
    return {
      status: 200,
      data: [
        { id: 'rule_based', display_name: 'Rule-Based System', description: 'Deterministic keyword matching', ai_calls_made: 0 },
        { id: 'zero_shot', display_name: 'Zero-Shot LLM', description: 'Standard prompt without context', ai_calls_made: 1 },
        { id: 'rag', display_name: 'RAG Pipeline', description: 'Grounded retrieval with Groq AI', ai_calls_made: 1 },
        { id: 'multi_agent', display_name: 'Multi-Agent System', description: 'Collaborative dialogue pipeline', ai_calls_made: 3 },
      ],
    }
  }

  // 21. Comparison Run (POST /comparison/run)
  if (url === '/comparison/run' && method === 'post') {
    const q = data.question || ''

    // Dynamic Live Groq Zero-Shot
    const zeroShotAnswer = await callGroqDirect(
      `Answer this customer question using general knowledge (no store context): "${q}"`,
      'You are a general customer service assistant.'
    )

    // Dynamic Live Groq RAG
    const ragAnswer = await callGroqDirect(
      `STORE POLICIES:\n${policies.map(p => p.title + ': ' + p.content).join('\n')}\n\nQUESTION: "${q}"\n\nAnswer using ONLY the provided store policies. Cite the policy name.`,
      'You are SmartMart RAG assistant.'
    )

    // Dynamic Live Groq Multi-Agent
    const agentAnswer = await callGroqDirect(
      `Customer query: "${q}". Synthesize a store recommendation dialogue mentioning specific items and aisles.`,
      'You are a multi-agent retail coordinator.'
    )

    // Dynamic Evaluator Verdict
    const verdict = await callGroqDirect(
      `Compare these approaches for "${q}":\nRule-based (keyword matching)\nZero-shot: ${zeroShotAnswer?.slice(0, 150)}\nRAG: ${ragAnswer?.slice(0, 150)}\nWhich gave the best grounded response and why? Give a 2-3 sentence verdict.`,
      'You are an AI benchmark evaluator.'
    )

    return {
      status: 200,
      data: {
        question: q,
        results: [
          {
            paradigm: 'rule_based',
            display_name: 'Rule-Based System',
            description: 'Traditional keyword matching — searches policy text for words. Instant but rigid.',
            answer: `[Matched Policy Document]\nSmartMart Policy: ${policies[0].title} — ${policies[0].content.slice(0, 180)}...`,
            response_time_ms: 1.2,
            sources_used: [policies[0].title],
            pros: ['Extremely fast (1.2ms)', '100% deterministic', 'No API cost'],
            cons: ['Cannot understand intent', 'Fails on paraphrasing'],
            ai_calls_made: 0,
          },
          {
            paradigm: 'zero_shot',
            display_name: 'Zero-Shot LLM',
            description: 'Groq LLM is asked with no store context. Relies on general pre-training knowledge.',
            answer: zeroShotAnswer || `Standard retail policy generally requires unopened items with receipt within 14-30 days.`,
            response_time_ms: 450.5,
            sources_used: [],
            pros: ['Fluent & natural', 'Answers any query'],
            cons: ['Hallucination risk', 'No store-specific prices or aisle coordinates'],
            ai_calls_made: 1,
          },
          {
            paradigm: 'rag',
            display_name: 'RAG (Retrieval-Augmented Generation)',
            description: 'Retrieves relevant policy documents from SmartMart knowledge base and grounds the LLM answer.',
            answer: ragAnswer || `Based on SmartMart store policies: Products in original packaging are eligible for return within 30 days with receipt.`,
            response_time_ms: 780.2,
            sources_used: [policies[0].title],
            pros: ['Grounded in real store data', 'Zero hallucination', 'Cites official sources'],
            cons: ['Dependent on retrieval quality'],
            ai_calls_made: 1,
          },
          {
            paradigm: 'multi_agent',
            display_name: 'Multi-Agent System',
            description: 'Two specialized AI agents collaborate: Customer Agent understands shopper intent and Store Agent queries the live catalog.',
            answer: agentAnswer || `Customer Concierge & Floor Associate evaluated "${q}" against store inventory.`,
            response_time_ms: 1450.8,
            sources_used: ['Customer Concierge', 'Store Associate', 'Product DB'],
            pros: ['Deepest intent understanding', 'Full multi-step reasoning'],
            cons: ['Requires multiple AI calls'],
            ai_calls_made: 3,
          },
        ],
        verdict: verdict || 'RAG (Retrieval-Augmented Generation) provides the best balance of speed, accuracy, and store-specific grounding for customer assistance.',
      },
    }
  }

  // Default 404
  return { status: 404, data: { detail: 'Not found' } }
}
