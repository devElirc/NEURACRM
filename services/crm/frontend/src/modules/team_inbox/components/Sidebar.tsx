import React, { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import {
  Inbox,
  Send,
  Archive,
  Users,
  Tag,
  Clock,
  AlertCircle,
  BarChart3,
  Settings,
  Plus,
  UserCheck,
  UserX,
  Bell,
  LogOut,
  Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


interface SidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  currentView: 'home' | 'dashboard' | 'inbox';
  onViewChange: (view: 'home' | 'dashboard' | 'inbox') => void;
}

export function Sidebar({ activeFilter, onFilterChange, currentView, onViewChange }: SidebarProps) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const prevAuthRef = useRef<boolean | null>(null);

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, view: 'home' as const },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, view: 'dashboard' as const },
  ];

  const menuItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: 12 },
    { id: 'unassigned', label: 'Unassigned', icon: UserX, count: 3 },
    { id: 'assigned-to-me', label: 'Assigned to Me', icon: UserCheck, count: 5 },
    { id: 'snoozed', label: 'Snoozed', icon: Clock, count: 2 },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'archived', label: 'Archived', icon: Archive },
  ];

  const tags = [
    { id: 'billing', label: 'Billing', color: 'bg-blue-500' },
    { id: 'support', label: 'Support', color: 'bg-green-500' },
    { id: 'sales', label: 'Sales', color: 'bg-purple-500' },
    { id: 'urgent', label: 'Urgent', color: 'bg-red-500' },
    { id: 'follow-up', label: 'Follow-up', color: 'bg-orange-500' },
  ];

  useEffect(() => {
    const prevAuth = prevAuthRef.current;

    if (prevAuth !== isAuthenticated && isAuthenticated === false && isLoading === false) {
      navigate("/auth");
    }

    // Update ref with latest value
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, isLoading]);

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Inbox className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">TeamInbox</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="px-3 py-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.view)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-2">
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        <div className="p-3">
          <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Compose</span>
          </button>
        </div>

        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeFilter === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange('inbox');
                  onFilterChange(item.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.count && (
                  <span className={`px-2 py-1 text-xs rounded-full ${isActive ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 px-3">
          <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Tags
          </h3>
          <div className="space-y-1">
            {tags.map((tag) => (
              <button
                key={tag.id}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                <span>{tag.label}</span>
              </button>
            ))}
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
              <Plus className="h-3 w-3" />
              <span>Add tag</span>
            </button>
          </div>
        </div>

        <div className="mt-6 px-3 space-y-1">
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user ? `${user.firstName}${user.lastName}` : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
          <div className="flex items-center space-x-1">
            <ThemeToggle />
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
              <Bell className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </button>
            <button
              onClick={logout}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}