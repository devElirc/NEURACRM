import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { QuickAddDropdown } from '../components/QuickAddDropdown'
import { NotificationDropdown } from '../components/NotificationDropdown'
import { ThemeToggle } from '../components/ThemeToggle'

// Navigation structure for page titles
const NAVIGATION = [
  {
    segment: 'dashboard',
    title: 'Dashboard',
    href: '/',
  },
  {
    segment: 'accounts',
    title: 'Accounts',
    href: '/accounts',
  },
  {
    segment: 'contacts',
    title: 'Contacts',
    href: '/contacts',
  },
  {
    segment: 'leads',
    title: 'Leads',
    href: '/leads',
  },
  {
    segment: 'deals',
    title: 'Deals',
    href: '/deals',
  },
  {
    segment: 'profile',
    title: 'Profile',
    href: '/profile',
  },
  {
    segment: 'team_inbox',
    title: 'Team Inbox',
    href: '/team_inbox',
  },
]

interface HeaderProps {
  onMenuClick: () => void
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onToggleSidebar, sidebarOpen = true }) => {
  const { } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const shouldShowBackButton = () => {
    const path = location.pathname
    // Show back button on detail pages, edit pages, and create pages
    return path.includes('/new') ||
      path.match(/\/\d+$/) ||
      path.includes('/edit') ||
      path.match(/\/\d+\/edit$/)
  }

  const getPageTitle = () => {
    const path = location.pathname
    const segments = path.split('/').filter(Boolean)

    if (path === '/') return 'Dashboard'
    if (path.includes('/new')) return `Create ${segments[0].slice(0, -1)}`
    if (path.includes('/edit')) return `Edit ${segments[0].slice(0, -1)}`
    if (path.match(/\/\d+$/)) return `${segments[0].slice(0, -1)} Details`

    const currentItem = NAVIGATION.find(item =>
      location.pathname === item.href ||
      (item.href !== '/' && location.pathname.startsWith(item.href))
    )
    return currentItem?.title || 'Dashboard'
  }

  const handleBackClick = () => {
    navigate(-1)
  }

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center justify-between px-6 shadow-md">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:block text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        )}

        {/* Back Button - Shows on detail/edit pages */}
        <div className="flex items-center space-x-4">
          {shouldShowBackButton() && (
            <button
              onClick={handleBackClick}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}

          {/* Page Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Page Title */}
      {/* <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {getCurrentPageTitle()}
          </h1>
        </div> */}

      {/* Right side actions */}
      <div className="flex items-center space-x-3">
        {/* Quick Add */}
        <QuickAddDropdown />

        {/* Search */}
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search..."
            className="w-48 pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationDropdown />
      </div>

    </div>
  )
} 