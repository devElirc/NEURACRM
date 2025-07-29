import React from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { Navigate } from 'react-router-dom'
import { isSuperAdminDomain, getTenantFromHost } from '@/utils/tenant'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  
  // Redirect based on role and domain
  if (user) {
    const isSuper = isSuperAdminDomain()
    const tenant = getTenantFromHost()
    
    if (isSuper && user.is_superadmin) {
      return <Navigate to="/superadmin" replace />
    }
    
    if (tenant && user.roles?.some(role => 
      role.role_type === 'admin' || role.name.toLowerCase().includes('admin')
    )) {
      return <Navigate to="/tenant-admin" replace />
    }
    
    return <Navigate to="/user" replace />
  }
  
  return <Navigate to="/login" replace />
}