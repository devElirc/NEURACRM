import axios from 'axios'
import { AuthTokens, LoginCredentials, User } from './types'
import { getApiBaseUrl } from '../utils/tenant'

const getApiUrl = () => `${getApiBaseUrl()}/api`

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> => {
    const apiUrl = `${getApiUrl()}/auth/login/`
    console.log('🔍 LOGIN DEBUG:', {
      apiUrl,
      credentials,
      baseUrl: getApiBaseUrl(),
      hostname: window.location.hostname,
      port: window.location.port,
      href: window.location.href
    })
    
    try {
      const response = await axios.post(apiUrl, credentials)
      console.log('✅ LOGIN SUCCESS:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error)
      console.error('Error response:', (error as any).response?.data)
      console.error('Error status:', (error as any).response?.status)
      throw error
    }
  },

  logout: async (): Promise<void> => {
    await axios.post(`${getApiUrl()}/auth/logout/`)
  },

  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await axios.post(`${getApiUrl()}/auth/refresh/`, {
      refresh_token: refreshToken,
    })
    return response.data
  },

  getProfile: async (): Promise<User> => {
    const response = await axios.get(`${getApiUrl()}/auth/profile/`)
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await axios.patch(`${getApiUrl()}/auth/profile/`, data)
    return response.data
  },

  changePassword: async (data: {
    current_password: string
    new_password: string
    confirm_password: string
  }): Promise<void> => {
    await axios.post(`${getApiUrl()}/auth/password/change/`, data)
  },

  getDashboardStats: async (): Promise<any> => {
    const response = await axios.get(`${getApiUrl()}/auth/dashboard/stats/`)
    return response.data
  },

  getTenantAdminDashboard: async (): Promise<any> => {
    const response = await axios.get(`${getApiUrl()}/tenant/admin-dashboard/`)
    return response.data
  },

  getUserDashboard: async (): Promise<any> => {
    const response = await axios.get(`${getApiUrl()}/tenant/user-dashboard/`)
    return response.data
  },
}

// Axios interceptor for adding auth token
axios.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('auth_tokens')
    if (tokens) {
      try {
        const { access_token } = JSON.parse(tokens)
        
        // Check if token is expired before using it
        if (access_token) {
          const tokenPayload = JSON.parse(atob(access_token.split('.')[1]))
          const currentTime = Math.floor(Date.now() / 1000)
          
          if (tokenPayload.exp < currentTime) {
            // Token is expired, don't add it to request
            console.log('🔍 Token expired, not adding to request')
            localStorage.removeItem('auth_tokens')
            localStorage.removeItem('auth_user')
            return config
          }
          
          config.headers.Authorization = `Bearer ${access_token}`
        }
      } catch (error) {
        console.error('🔍 Invalid token format:', error)
        localStorage.removeItem('auth_tokens')
        localStorage.removeItem('auth_user')
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Flag to prevent concurrent token refresh attempts
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

// Function to add subscribers waiting for token refresh
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

// Function to notify all subscribers when token is refreshed
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

// Axios interceptor for handling token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, wait for the new token
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(axios(originalRequest))
          })
        })
      }
      
      originalRequest._retry = true
      isRefreshing = true
      
      const tokens = localStorage.getItem('auth_tokens')
      if (tokens) {
        const { refresh_token } = JSON.parse(tokens)
        
        try {
          // Check if refresh token is also expired
          const refreshTokenPayload = JSON.parse(atob(refresh_token.split('.')[1]))
          const currentTime = Math.floor(Date.now() / 1000)
          
          if (refreshTokenPayload.exp < currentTime) {
            // Refresh token is also expired, clear storage and redirect
            console.log('🔍 Refresh token expired, redirecting to login')
            isRefreshing = false
            refreshSubscribers = []
            localStorage.removeItem('auth_tokens')
            localStorage.removeItem('auth_user')
            window.location.href = '/login'
            return Promise.reject(new Error('Refresh token expired'))
          }
          
          // Use direct axios call to avoid circular dependency
          const response = await axios.post(`${getApiUrl()}/auth/refresh/`, {
            refresh_token: refresh_token,
          })
          
          const newTokens = response.data
          localStorage.setItem('auth_tokens', JSON.stringify(newTokens))
          
          // Update original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`
          
          // Notify all waiting requests
          onTokenRefreshed(newTokens.access_token)
          
          isRefreshing = false
          return axios(originalRequest)
        } catch (refreshError) {
          // Refresh failed, redirect to login
          console.log('🔍 Token refresh failed, redirecting to login:', refreshError)
          isRefreshing = false
          refreshSubscribers = []
          localStorage.removeItem('auth_tokens')
          localStorage.removeItem('auth_user')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // No tokens available, redirect to login
        isRefreshing = false
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)