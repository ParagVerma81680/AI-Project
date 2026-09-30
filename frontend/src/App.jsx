import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Products from './pages/Products'
import RoutePlanner from './pages/RoutePlanner'
import PolicyChat from './pages/PolicyChat'
import Recommendations from './pages/Recommendations'
import Agents from './pages/Agents'
import Comparison from './pages/Comparison'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/planner" element={<RoutePlanner />} />
            <Route path="/policy-chat" element={<PolicyChat />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/comparison" element={<Comparison />} />
          </Routes>
        </div>
      </HashRouter>
    </AuthProvider>
  )
}
