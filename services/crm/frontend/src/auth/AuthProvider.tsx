import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthContextType, AuthState, LoginCredentials, User, AuthTokens, Tenant } from './types'
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
    const storedUser = localStorage.getItem('auth_user')
    const storedTokens = localStorage.getItem('auth_tokens')
    const storedTenant = localStorage.getItem('auth_tenant')

    if (storedUser && storedTokens && storedTenant) {
      try {
        const user: User = JSON.parse(storedUser)
        const tokens: AuthTokens = JSON.parse(storedTokens)
        const tenant: Tenant = JSON.parse(storedTenant)

        if (tokens.access_token) {
          const tokenPayload = JSON.parse(atob(tokens.access_token.split('.')[1]))
          const currentTime = Math.floor(Date.now() / 1000)

          if (tokenPayload.exp < currentTime) {
            localStorage.removeItem('auth_user')
            localStorage.removeItem('auth_tokens')
            localStorage.removeItem('auth_tenant')

            setState(prev => ({ ...prev, isLoading: false }))
            return
          }
        }

        setState({
          user,
          tokens,
          tenant,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (err) {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_tokens')
        localStorage.removeItem('auth_tenant')
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const { user, tokens, tenant } = await authApi.login(credentials)

      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_tokens', JSON.stringify(tokens))
      localStorage.setItem('auth_tenant', JSON.stringify(tenant))

      setState({
        user,
        tokens,
        tenant,
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
      // ignore
    } finally {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('auth_tenant')

      setState({
        user: null,
        tokens: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
      })

      toast.success('Logged out successfully')
    }
  }

  const refreshToken = async () => {
    try {
      const storedTokens = localStorage.getItem('auth_tokens')
      if (!storedTokens) throw new Error('No tokens found')

      const { refresh_token } = JSON.parse(storedTokens)
      const newTokens = await authApi.refreshToken(refresh_token)

      localStorage.setItem('auth_tokens', JSON.stringify(newTokens))

      setState(prev => ({
        ...prev,
        tokens: newTokens,
      }))
    } catch (error) {
      await logout()
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
