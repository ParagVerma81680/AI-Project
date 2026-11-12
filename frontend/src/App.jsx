import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import ChatbotWidget from './components/ChatbotWidget'
import Home from './pages/Home'
import Products from './pages/Products'
import RoutePlanner from './pages/RoutePlanner'
import PolicyChat from './pages/PolicyChat'
import Recommendations from './pages/Recommendations'
import Agents from './pages/Agents'
import Comparison from './pages/Comparison'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter>
          <CartProvider>
            <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:orderId" element={<Orders />} />
                <Route path="/planner" element={<RoutePlanner />} />
                <Route path="/policy-chat" element={<PolicyChat />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/comparison" element={<Comparison />} />
              </Routes>
              <CartDrawer />
              <ChatbotWidget />
            </div>
          </CartProvider>
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
