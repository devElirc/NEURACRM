import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/auth/api'
import { StatsCard } from '@/shared/components/cards'
import { Users, Shield, Settings, Activity } from 'lucide-react'

export const TenantAdminDashboard: React.FC = () => {
  // Remove unused user variable
  
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['tenant-admin-dashboard'],
    queryFn: authApi.getTenantAdminDashboard,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenant Admin</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {dashboardData?.tenant_name || 'Company management'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Users"
          value={dashboardData?.total_users || 0}
          icon={<Users className="h-8 w-8 text-blue-500" />}
          variant="primary"
        />
        
        <StatsCard
          title="Total Roles"
          value={dashboardData?.total_roles || 0}
          icon={<Shield className="h-8 w-8 text-green-500" />}
          variant="success"
        />
        
        <StatsCard
          title="User Roles"
          value={dashboardData?.active_user_roles || 0}
          icon={<Settings className="h-8 w-8 text-purple-500" />}
          variant="default"
        />
        
        <StatsCard
          title="Recent Actions"
          value={dashboardData?.recent_actions || 0}
          icon={<Activity className="h-8 w-8 text-orange-500" />}
          variant="warning"
        />
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <Users className="h-8 w-8 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manage Users</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add, edit, and remove company users</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <Shield className="h-8 w-8 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manage Roles</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure user roles and permissions</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <Settings className="h-8 w-8 text-purple-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Company Settings</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure company preferences</p>
        </div>
      </div>

      {/* Recent Users */}
      {dashboardData?.recent_users && dashboardData.recent_users.length > 0 && (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Recent Users
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {dashboardData.recent_users.map((user: any) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.roles.join(', ') || 'No roles'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}