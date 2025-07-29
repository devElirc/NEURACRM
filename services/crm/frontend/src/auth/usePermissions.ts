import { useAuth } from './AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { authApi } from './api'

export interface UserPermissions {
  // Core permissions
  hasAllAccess: boolean
  canManageLeads: boolean
  canViewCustomers: boolean
  canManageContacts: boolean
  canManageAccounts: boolean
  canManageOpportunities: boolean
  canManageTeam: boolean
  canManageSettings: boolean
  canViewOnly: boolean
  
  // Lead-specific permissions
  canCreateLeads: boolean
  canUpdateLeads: boolean
  canDeleteLeads: boolean
  canViewLeads: boolean
  canConvertLeads: boolean
  
  // Contact-specific permissions
  canCreateContacts: boolean
  canUpdateContacts: boolean
  canDeleteContacts: boolean
  canViewContacts: boolean
  
  // Account-specific permissions
  canCreateAccounts: boolean
  canUpdateAccounts: boolean
  canDeleteAccounts: boolean
  canViewAccounts: boolean
  
  // Deal-specific permissions
  canCreateDeals: boolean
  canUpdateDeals: boolean
  canDeleteDeals: boolean
  canViewDeals: boolean
  
  // Check if user owns/created a specific resource
  canModifyResource: (resource: { lead_owner?: number; created_by?: number; owner?: number }) => boolean
}

export const usePermissions = (): UserPermissions => {
  const { user } = useAuth()
  
  // Fetch user permissions from dashboard API
  const { data: dashboardData } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: authApi.getUserDashboard,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Get user's permissions from dashboard data or fallback to roles
  const getUserPermissions = (): string[] => {
    // First try to get permissions from dashboard API
    if (dashboardData?.user_permissions) {
      return dashboardData.user_permissions
    }
    
    // Fallback to roles if available
    if (user?.roles && user.roles.length > 0) {
      const permissions: string[] = []
      user.roles.forEach(role => {
        if (role.permissions) {
          // Extract permissions that are set to true
          Object.keys(role.permissions).forEach(permission => {
            if (role.permissions?.[permission] === true) {
              permissions.push(permission)
            }
          })
        }
      })
      return [...new Set(permissions)] // Remove duplicates
    }
    
    // Default permissions for users without roles
    return ['view_customers', 'view_only']
  }
  
  const permissions = getUserPermissions()
  const hasPermission = (permission: string): boolean => {
    return permissions.includes('all') || permissions.includes(permission)
  }
  
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissions.includes('all') || permissionList.some(p => permissions.includes(p))
  }
  
  const canModifyResource = (resource: { lead_owner?: number | string; created_by?: number | string; owner?: number | string }): boolean => {
    // Admin and managers can modify any resource
    if (hasPermission('all') || hasPermission('manage_leads') || hasPermission('manage_team')) {
      return true
    }
    
    // Users can modify resources they own or created
    const userId = user?.id
    return !!(userId && (
      resource.lead_owner?.toString() === userId ||
      resource.created_by?.toString() === userId ||
      resource.owner?.toString() === userId
    ))
  }
  
  return {
    // Core permissions
    hasAllAccess: hasPermission('all'),
    canManageLeads: hasPermission('manage_leads'),
    canViewCustomers: hasPermission('view_customers'),
    canManageContacts: hasPermission('manage_contacts'),
    canManageAccounts: hasPermission('manage_accounts'),
    canManageOpportunities: hasPermission('manage_opportunities'),
    canManageTeam: hasPermission('manage_team'),
    canManageSettings: hasPermission('manage_settings'),
    canViewOnly: hasPermission('view_only'),
    
    // Lead-specific permissions
    canCreateLeads: hasAnyPermission(['all', 'manage_leads']),
    canUpdateLeads: hasAnyPermission(['all', 'manage_leads']),
    canDeleteLeads: hasAnyPermission(['all', 'manage_leads']),
    canViewLeads: hasAnyPermission(['all', 'manage_leads', 'view_customers', 'view_only', 'manage_contacts', 'manage_accounts']),
    canConvertLeads: hasAnyPermission(['all', 'manage_leads']),
    
    // Contact-specific permissions
    canCreateContacts: hasAnyPermission(['all', 'manage_contacts']),
    canUpdateContacts: hasAnyPermission(['all', 'manage_contacts']),
    canDeleteContacts: hasAnyPermission(['all', 'manage_contacts']),
    canViewContacts: hasAnyPermission(['all', 'manage_contacts', 'view_customers', 'view_only', 'manage_leads', 'manage_accounts']),
    
    // Account-specific permissions
    canCreateAccounts: hasAnyPermission(['all', 'manage_accounts']),
    canUpdateAccounts: hasAnyPermission(['all', 'manage_accounts']),
    canDeleteAccounts: hasAnyPermission(['all', 'manage_accounts']),
    canViewAccounts: hasAnyPermission(['all', 'manage_accounts', 'view_customers', 'view_only', 'manage_leads', 'manage_contacts']),
    
    // Deal-specific permissions
    canCreateDeals: hasAnyPermission(['all', 'manage_opportunities']),
    canUpdateDeals: hasAnyPermission(['all', 'manage_opportunities']),
    canDeleteDeals: hasAnyPermission(['all', 'manage_opportunities']),
    canViewDeals: hasAnyPermission(['all', 'manage_opportunities', 'view_customers', 'view_only', 'manage_leads', 'manage_contacts']),
    
    // Resource modification check
    canModifyResource
  }
}

export default usePermissions