import React from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/auth/api'
import { useDealSummary } from '@/modules/deals/api'
import { StatsCard } from '@/shared/components/cards'
import { Users, Phone, Mail, Calendar, DollarSign, TrendingUp } from 'lucide-react'

interface Activity {
  type: 'lead' | 'contact' | 'account' | 'deal'
  title: string
  description: string
  date: string
}

export const UserDashboard: React.FC = () => {
  const { user } = useAuth()
  
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: authApi.getUserDashboard,
    refetchInterval: 30000,
  })

  const { data: dealSummary } = useDealSummary()

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM Dashboard</h1>
        <div className="flex items-center space-x-4 mt-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome, {dashboardData?.user_name || user?.full_name}
            {dashboardData?.tenant_name && ` - ${dashboardData.tenant_name}`}
          </p>
          {dashboardData?.data_scope && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              dashboardData.data_scope === 'all' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {dashboardData.data_scope === 'all' ? 'All Data' : 'My Data'}
            </span>
          )}
        </div>
      </div>

      {/* User Info */}
      {/* <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            User Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base text-gray-900">{dashboardData?.user_email || user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Roles</p>
              <p className="text-base text-gray-900">
                {dashboardData?.user_roles?.join(', ') || 'No roles assigned'}
              </p>
            </div>
          </div>
        </div>
      </div> */}

      {/* CRM Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Leads"
          value={dashboardData?.crm_stats?.leads || 0}
          icon={<Users className="h-8 w-8 text-blue-500" />}
          variant="primary"
        />
        
        <StatsCard
          title="Contacts"
          value={dashboardData?.crm_stats?.contacts || 0}
          icon={<Phone className="h-8 w-8 text-green-500" />}
          variant="success"
        />
        
        <StatsCard
          title="Accounts"
          value={dashboardData?.crm_stats?.accounts || 0}
          icon={<Mail className="h-8 w-8 text-purple-500" />}
          variant="default"
        />
        
        <StatsCard
          title="Opportunities"
          value={dashboardData?.crm_stats?.opportunities || 0}
          icon={<Calendar className="h-8 w-8 text-orange-500" />}
          variant="warning"
        />
      </div>

      {/* Deal Metrics */}
      {dealSummary && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Deal Pipeline</h3>
            <DollarSign className="h-6 w-6 text-green-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('en-US', { 
                  style: 'currency', 
                  currency: 'USD' 
                }).format(parseFloat(dealSummary.total_value))}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pipeline Value</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dealSummary.total_deals}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Deals</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('en-US', { 
                  style: 'currency', 
                  currency: 'USD' 
                }).format(parseFloat(dealSummary.avg_deal_value))}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Deal Size</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-orange-500 mr-1" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {dealSummary.deals_closing_this_month}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Closing This Month</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-green-500 mr-1" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {dealSummary.deals_closing_next_month}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Closing Next Month</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-blue-500 mr-1" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {dealSummary.deals_by_stage.Qualification || 0}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Qualification</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-500 mr-1" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {dealSummary.deals_by_stage.Negotiation || 0}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Negotiation</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {dashboardData?.recent_activities && dashboardData.recent_activities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {dashboardData.recent_activities.map((activity: Activity, index: number) => (
                  <li key={index}>
                    <div className={`relative ${index < dashboardData.recent_activities.length - 1 ? 'pb-8' : ''}`}>
                      {index < dashboardData.recent_activities.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600" aria-hidden="true"></span>
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                            activity.type === 'lead' ? 'bg-blue-500' :
                            activity.type === 'contact' ? 'bg-green-500' :
                            activity.type === 'account' ? 'bg-purple-500' :
                            'bg-orange-500'
                          }`}>
                            <span className="text-white text-xs font-medium">
                              {activity.type.charAt(0).toUpperCase()}
                            </span>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {activity.title}
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                              {activity.description}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                            <time dateTime={activity.date}>{activity.date}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}