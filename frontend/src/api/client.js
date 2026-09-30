import axios from 'axios'
import { handleMockRequest } from './mockService'

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
