import React from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/auth/api'
import { StatsCard } from '@/shared/components/cards'
import { 
  Users, 
  Shield, 
  Settings, 
  Activity,
  Plus,
  Building2,
  Globe,
  Database
} from 'lucide-react'

export const SuperAdminDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: authApi.getDashboardStats,
    refetchInterval: 30000,
    enabled: isAuthenticated && user?.is_superadmin, // Only run query if authenticated and superadmin
  })

  if (authLoading || isLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          System-wide management and monitoring
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Tenant
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Tenants"
          value={stats?.total_tenants || 0}
          icon={<Building2 className="h-6 w-6 text-blue-500" />}
          variant="primary"
          size="md"
        />
        
        <StatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={<Users className="h-6 w-6 text-green-500" />}
          variant="success"
          size="md"
        />
        
        <StatsCard
          title="Active Domains"
          value={stats?.active_domains || 0}
          icon={<Globe className="h-6 w-6 text-purple-500" />}
          variant="default"
          size="md"
        />
        
        <StatsCard
          title="Active Sessions"
          value={stats?.active_sessions || 0}
          icon={<Activity className="h-6 w-6 text-yellow-500" />}
          variant="warning"
          size="md"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600" aria-hidden="true"></span>
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                        <Users className="h-4 w-4 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          New tenant <span className="font-medium text-gray-900 dark:text-white">Acme Corp</span> was created
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        <time dateTime="2023-01-15">2 hours ago</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600" aria-hidden="true"></span>
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                        <Shield className="h-4 w-4 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Security update applied to <span className="font-medium text-gray-900 dark:text-white">all tenants</span>
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        <time dateTime="2023-01-14">1 day ago</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="relative">
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                        <Database className="h-4 w-4 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Database backup completed for <span className="font-medium text-gray-900 dark:text-white">tenant-123</span>
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        <time dateTime="2023-01-13">2 days ago</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}