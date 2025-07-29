import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthContextType, AuthState, LoginCredentials, User, AuthTokens } from './types'
import { authApi } from './api'
import toast from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    tenant: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    // Check for stored auth data on app start
    const storedUser = localStorage.getItem('auth_user')
    const storedTokens = localStorage.getItem('auth_tokens')

    if (storedUser && storedTokens) {
      try {
        const user: User = JSON.parse(storedUser)
        const tokens: AuthTokens = JSON.parse(storedTokens)

        // Check if access token is expired
        if (tokens.access_token) {
          const tokenPayload = JSON.parse(atob(tokens.access_token.split('.')[1]))
          const currentTime = Math.floor(Date.now() / 1000)

          if (tokenPayload.exp < currentTime) {
            // Token is expired, clear storage and don't authenticate
            localStorage.removeItem('auth_user')
            localStorage.removeItem('auth_tokens')
            setState(prev => ({ ...prev, isLoading: false }))
            return
          }
        }

        setState({
          user,
          tenant: null,
          tokens,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch {
        // Invalid token format, clear storage
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_tokens')
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const { user, tokens } = await authApi.login(credentials)

      // Store auth data
      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_tokens', JSON.stringify(tokens))

      setState({
        user,
        tenant: null,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      })

      toast.success('Login successful!')
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }))
      const message = error.response?.data?.detail || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors - always clear local state
    } finally {
      // Clear auth data
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_tokens')

      setState({
        user: null,
        tenant: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      })

      toast.success('Logged out successfully')
    }
  }

  const refreshToken = async () => {
    try {
      const storedTokens = localStorage.getItem('auth_tokens')
      if (!storedTokens) {
        throw new Error('No refresh token available')
      }

      const { refresh_token } = JSON.parse(storedTokens)
      const newTokens = await authApi.refreshToken(refresh_token)

      localStorage.setItem('auth_tokens', JSON.stringify(newTokens))

      setState(prev => ({
        ...prev,
        tokens: newTokens,
      }))
    } catch (error) {
      // Token refresh failed, logout user
      logout()
      throw error
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}