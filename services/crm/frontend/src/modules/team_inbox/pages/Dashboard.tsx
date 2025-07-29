import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Mail,
  Calendar,
  Target,
  Activity,
  Zap
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const stats = [
    {
      title: 'Total Conversations',
      value: '1,247',
      change: '+12%',
      trend: 'up',
      icon: MessageCircle,
      color: 'blue'
    },
    {
      title: 'Open Tickets',
      value: '89',
      change: '-5%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'orange'
    },
    {
      title: 'Avg Response Time',
      value: '2h 15m',
      change: '-23%',
      trend: 'down',
      icon: Clock,
      color: 'green'
    },
    {
      title: 'Resolution Rate',
      value: '94.2%',
      change: '+3%',
      trend: 'up',
      icon: CheckCircle,
      color: 'purple'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'message',
      title: 'New message from John Customer',
      description: 'Billing Integration Issue',
      time: '2 minutes ago',
      priority: 'high'
    },
    {
      id: 2,
      type: 'assignment',
      title: 'Ticket assigned to Sarah Johnson',
      description: 'Feature Request: Dark Mode',
      time: '15 minutes ago',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'resolved',
      title: 'Ticket resolved by Mike Chen',
      description: 'Account Verification Problem',
      time: '1 hour ago',
      priority: 'low'
    },
    {
      id: 4,
      type: 'escalation',
      title: 'SLA breach warning',
      description: 'Payment processing issue',
      time: '2 hours ago',
      priority: 'urgent'
    }
  ];

  const getStatColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-green-500 bg-green-50 dark:bg-green-900/20';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return Mail;
      case 'assignment': return Users;
      case 'resolved': return CheckCircle;
      case 'escalation': return AlertTriangle;
      default: return Activity;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Here's what's happening with your team inbox today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${getStatColor(stat.color)} rounded-lg flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">from last month</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{activity.time}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                          {activity.priority}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Team Performance */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <Mail className="h-5 w-5" />
                  <span>Compose Message</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <Calendar className="h-5 w-5" />
                  <span>Schedule Follow-up</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <Target className="h-5 w-5" />
                  <span>Create Task</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <BarChart3 className="h-5 w-5" />
                  <span>View Analytics</span>
                </button>
              </div>
            </div>

            {/* Team Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Performance</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">SJ</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Sarah Johnson</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">24 resolved today</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">98%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">MC</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Mike Chen</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">18 resolved today</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">95%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">AL</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Alex Lee</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">15 resolved today</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">92%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}