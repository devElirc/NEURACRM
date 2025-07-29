import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

interface RoleBasedRouteProps {
  children: React.ReactNode
  requiredRole?: 'superadmin' | 'admin' | 'user'
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access
  if (requiredRole === 'superadmin' && !user.is_superadmin) {
    return <Navigate to="/user" replace />
  }

  // Check if user has admin role for tenant-admin access
  if (requiredRole === 'admin') {
    const hasAdminRole = user.roles?.some(role => 
      role.role_type === 'admin' || role.name.toLowerCase().includes('admin')
    )
    if (!hasAdminRole && !user.is_superadmin) {
      return <Navigate to="/user" replace />
    }
  }

  return <>{children}</>
}