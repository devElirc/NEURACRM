import React from 'react';
import { Inbox, Users, Zap, Shield, Star, TrendingUp, MessageCircle } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  isLogin?: boolean;
}

export function AuthLayout({ children, title, subtitle, isLogin = true }: AuthLayoutProps) {
  const features = [
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with your entire team in one shared inbox.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Respond to customers faster with smart automation and workflows.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with SOC 2 compliance and advanced encryption.'
    }
  ];

  const stats = [
    { icon: Users, label: 'Teams', value: '10K+' },
    { icon: MessageCircle, label: 'Messages', value: '2.5M+' },
    { icon: Star, label: 'Satisfaction', value: '98%' }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo & Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Inbox className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold">TeamInbox</span>
            </div>
            
            <div className="max-w-md">
              <h1 className="text-4xl font-bold leading-tight mb-4">
                {isLogin ? 'Welcome back to your team inbox' : 'Join thousands of teams'}
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                {isLogin 
                  ? 'Manage all your customer conversations in one place with powerful collaboration tools.'
                  : 'Start collaborating better with your team and deliver exceptional customer experiences.'
                }
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Why teams choose TeamInbox</h3>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-blue-100 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-between pt-8 border-t border-white/20">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Icon className="h-5 w-5 text-blue-200 mr-2" />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                  </div>
                  <div className="text-sm text-blue-100">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="lg:hidden flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Inbox className="h-6 w-6 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600">{subtitle}</p>
            </div>
            
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}