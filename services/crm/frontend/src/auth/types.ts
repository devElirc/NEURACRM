export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  is_active: boolean
  is_superadmin: boolean
  full_name: string
  roles?: UserRole[]
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  name: string
  role_type: string
  assigned_at: string
  permissions?: Record<string, boolean>
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthState {
  user: User | null
  tenant: null,
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}