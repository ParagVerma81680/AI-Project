import axios from 'axios'
import { handleMockRequest } from './mockService'

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // Allow 45s for multi-call AI operations
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If request fails (e.g. 404, network error, or hosted on static GitHub Pages)
    const isStaticHost =
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('github.io') ||
       window.location.hostname !== 'localhost' ||
       !error.response ||
       error.response.status === 404 ||
       error.code === 'ERR_NETWORK')

    if (isStaticHost && error.config) {
      try {
        const mockRes = await handleMockRequest(error.config)
        if (mockRes.status >= 400) {
          const err = new Error(mockRes.data?.detail || 'Request failed')
          err.response = mockRes
          return Promise.reject(err)
        }
        return {
          ...mockRes,
          config: error.config,
          headers: {},
          statusText: 'OK',
        }
      } catch (mockErr) {
        return Promise.reject(mockErr)
      }
    }

    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default client
