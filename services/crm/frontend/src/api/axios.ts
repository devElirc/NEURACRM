import axios from 'axios'

// Create axios instance with default config
// Note: baseURL is not set here because modules construct their own tenant-specific URLs
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  (config) => {
    // Get auth tokens from localStorage
    const tokens = localStorage.getItem('auth_tokens')
    if (tokens) {
      try {
        const { access_token } = JSON.parse(tokens)
        if (access_token) {
          config.headers.Authorization = `Bearer ${access_token}`
        }
      } catch (error) {
        console.error('Error parsing auth tokens:', error)
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Clear invalid tokens
      localStorage.removeItem('auth_tokens')
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient