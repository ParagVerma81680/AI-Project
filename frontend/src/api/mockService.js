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

  // Find unique aisles
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

  // Nearest-neighbor order
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

  // Build segments and full path
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

  // 1. Health
  if (url === '/health' || url === '') {
    return { status: 200, data: { status: 'ok', project: 'SmartMart AI' } }
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

    // Customer login
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
          fastapi: 'Connected (Cloud Web)',
          sqlite_db: 'Active (Indexed)',
          dijkstra_router: 'Operational',
          claude_rag: 'Ready',
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

  // 16. Policy Ask (POST /policies/ask)
  if (url === '/policies/ask' && method === 'post') {
    const q = (data.question || '').toLowerCase()
    let answer = 'According to SmartMart policy, items in original condition with receipt are eligible for return or exchange within 30 days.'
    let sources = ['Return & Refund Policy']

    if (q.includes('loyalt') || q.includes('point') || q.includes('member')) {
      answer = 'SmartMart Loyalty Membership is free! You earn 1 point for every Rs. 10 spent, 2 points on Double Points items, and 1.5 points on fresh produce. 100 points = Rs. 10 discount.'
      sources = ['Membership & Loyalty Program']
    } else if (q.includes('time') || q.includes('hour') || q.includes('open') || q.includes('sunday')) {
      answer = 'SmartMart is open 7 days a week from 7:00 AM to 10:00 PM, including Sundays and national holidays.'
      sources = ['Store Hours & Holiday Operations']
    } else if (q.includes('deliver') || q.includes('home')) {
      answer = 'We provide free home delivery on orders above Rs. 499 within a 5 km radius. For smaller orders, a nominal fee of Rs. 30 applies.'
      sources = ['Home Delivery Policy']
    } else if (q.includes('payment') || q.includes('upi') || q.includes('card')) {
      answer = 'We accept Cash, UPI (Google Pay, PhonePe, Paytm), and Credit/Debit cards (Visa, MasterCard, RuPay).'
      sources = ['Accepted Payment Methods']
    }

    return {
      status: 200,
      data: {
        question: data.question,
        answer,
        sources_used: sources,
        retrieved_count: sources.length,
      },
    }
  }

  // 17. Paradigms list
  if (url === '/comparison/paradigms') {
    return {
      status: 200,
      data: [
        { id: 'rule_based', display_name: 'Rule-Based System', description: 'Deterministic keyword matching', ai_calls_made: 0 },
        { id: 'zero_shot', display_name: 'Zero-Shot LLM', description: 'Standard prompt without context', ai_calls_made: 1 },
        { id: 'rag', display_name: 'RAG Pipeline', description: 'Grounded retrieval with Claude', ai_calls_made: 1 },
        { id: 'multi_agent', display_name: 'Multi-Agent System', description: 'Collaborative dialogue pipeline', ai_calls_made: 3 },
      ],
    }
  }

  // Default 404
  return { status: 404, data: { detail: 'Not found' } }
}
