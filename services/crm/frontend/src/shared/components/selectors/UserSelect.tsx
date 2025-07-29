import React, { useState, useRef, useEffect } from 'react'
import { useEligibleLeadOwners, type EligibleLeadOwner } from '@/api/tenant'

interface UserSelectProps {
  value?: number
  onChange: (userId: number, user: EligibleLeadOwner) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  label?: string
  error?: string
  permissionFilter?: 'manage_leads' | 'manage_contacts' | 'manage_accounts' | 'manage_opportunities' | 'all'
}

export const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  placeholder = "Select user...",
  className = "",
  disabled = false,
  label,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: ownersData, isLoading, error: apiError } = useEligibleLeadOwners()
  const users = ownersData?.users || []

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Find selected user
  const selectedUser = users.find(user => user.id === value)
  
  // Debug logging
  console.log('🔍 UserSelect Debug:', {
    value,
    valueType: typeof value,
    usersCount: users.length,
    selectedUser: selectedUser ? `${selectedUser.full_name} (${selectedUser.id})` : 'None',
    firstUser: users[0] ? `${users[0].full_name} (${users[0].id})` : 'None'
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleUserSelect = (user: EligibleLeadOwner) => {
    onChange(user.id, user)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    } else if (e.key === 'ArrowDown' && filteredUsers.length > 0) {
      e.preventDefault()
      setIsOpen(true)
    }
  }

  if (isLoading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
          Loading users...
        </div>
      </div>
    )
  }

  if (apiError) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600">
          Error loading users
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent text-gray-900 dark:text-gray-100 ${
          disabled ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
        } ${error ? 'border-red-500' : ''}`}
        onClick={handleInputClick}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search users..."
            className="w-full outline-none bg-transparent"
            disabled={disabled}
            autoFocus
          />
        ) : (
          <div className="flex items-center justify-between">
            <span className={selectedUser ? 'text-gray-900' : 'text-gray-500'}>
              {selectedUser ? (
                <div className="flex items-center">
                  <span className="font-medium">{selectedUser.full_name}</span>
                  {selectedUser.is_current_user && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                      You
                    </span>
                  )}
                  <span className="text-sm text-gray-500 ml-2">({selectedUser.roles.join(', ')})</span>
                </div>
              ) : (
                placeholder
              )}
            </span>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              {searchTerm ? 'No users found matching your search' : 'No eligible users available'}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                  user.is_current_user ? 'bg-green-50 border-green-200' : ''
                }`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</div>
                  {user.is_current_user && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-300">{user.email}</div>
                <div className="text-xs text-blue-600 mt-1">
                  Roles: {user.roles.join(', ')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}