import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

interface QuickAddItem {
  name: string
  href: string
  icon: string
  permission?: string
}

const QUICK_ADD_ITEMS: QuickAddItem[] = [
  {
    name: 'Lead',
    href: '/leads/new',
    icon: '🎯',
    permission: 'manage_leads'
  },
  {
    name: 'Account',
    href: '/accounts/new',
    icon: '🏢',
    permission: 'manage_accounts'
  },
  {
    name: 'Contact',
    href: '/contacts/new',
    icon: '👤',
    permission: 'manage_contacts'
  },
  {
    name: 'Deal',
    href: '/deals/new',
    icon: '💰',
    permission: 'manage_opportunities'
  }
]

export const QuickAddDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const hasPermission = (permission?: string) => {
    if (!permission) return true
    if (!user) return false
    
    // Superadmin has all permissions
    if (user.is_superadmin) return true
    
    // Allow all permissions temporarily for testing
    return true
  }

  const filteredItems = QUICK_ADD_ITEMS.filter(item => hasPermission(item.permission))

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Quick Add
        <svg 
          className={`ml-2 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={handleClose}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-600">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quick Add
              </p>
            </div>
            {filteredItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleClose}
                className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span>New {item.name}</span>
              </Link>
            ))}
            {filteredItems.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No items available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}