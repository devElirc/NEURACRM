import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Inbox, 
  MessageCircle, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  Globe, 
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Clock
} from 'lucide-react';

export function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      icon: MessageCircle,
      title: 'Unified Inbox',
      description: 'Manage all your team communications from email, chat, and social media in one place.',
      color: 'blue'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Assign conversations, add internal notes, and collaborate seamlessly with your team.',
      color: 'green'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track response times, resolution rates, and team performance with detailed analytics.',
      color: 'purple'
    },
    {
      icon: Zap,
      title: 'Smart Automation',
      description: 'Automate repetitive tasks with smart rules, tags, and workflow automation.',
      color: 'orange'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with SSO, 2FA, and compliance with industry standards.',
      color: 'red'
    },
    {
      icon: Globe,
      title: 'Multi-Channel Support',
      description: 'Support customers across email, live chat, social media, and phone calls.',
      color: 'indigo'
    }
  ];

  const stats = [
    { label: 'Messages Processed', value: '2.5M+', icon: MessageCircle },
    { label: 'Teams Using Platform', value: '10K+', icon: Users },
    { label: 'Average Response Time', value: '< 2min', icon: Clock },
    { label: 'Customer Satisfaction', value: '98%', icon: Star }
  ];

  const getFeatureColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      indigo: 'bg-indigo-500'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Inbox className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TeamInbox
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            The modern team inbox that brings all your customer communications together. 
            Collaborate seamlessly, respond faster, and deliver exceptional customer experiences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Welcome back,</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center transition-colors">
                <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to manage customer communications
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to help your team collaborate better and respond faster to customer needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 ${getFeatureColor(feature.color)} rounded-lg flex items-center justify-center mb-6`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Choose where you'd like to begin your TeamInbox experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-8 w-8" />
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-semibold mb-2">View Dashboard</h3>
              <p className="text-blue-100">
                Get insights into your team's performance, response times, and key metrics.
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <MessageCircle className="h-8 w-8" />
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Open Inbox</h3>
              <p className="text-purple-100">
                Start managing conversations, assign tickets, and collaborate with your team.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates</span>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { type: 'message', text: 'New message from John Customer', time: '2 min ago', priority: 'high' },
              { type: 'assignment', text: 'Ticket assigned to Sarah Johnson', time: '15 min ago', priority: 'medium' },
              { type: 'resolved', text: 'Support ticket resolved', time: '1 hour ago', priority: 'low' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div className={`w-3 h-3 rounded-full ${
                  activity.priority === 'high' ? 'bg-red-500' :
                  activity.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium">{activity.text}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}