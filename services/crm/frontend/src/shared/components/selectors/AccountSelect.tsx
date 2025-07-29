import React, { useState, useEffect, useRef } from 'react'
import { useAccounts } from '@/modules/accounts/api'
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline'

export interface AccountSelectProps {
  value?: string
  onChange: (accountName: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  leadMode?: boolean // New prop to indicate this is for lead creation
}

export const AccountSelect: React.FC<AccountSelectProps> = ({
  value,
  onChange,
  placeholder = "Select or type company name...",
  disabled = false,
  className = "",
  leadMode = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: accountsData, isLoading, error } = useAccounts(1, 100) // Get more accounts for search

  const accounts = accountsData?.results || []

  // Filter accounts based on input value
  const filteredAccounts = accounts.filter(account =>
    account.account_name.toLowerCase().includes(inputValue.toLowerCase())
  )

  // Set input value when value changes
  useEffect(() => {
    if (typeof value === 'string') {
      setInputValue(value || '')
    } else {
      setInputValue('')
    }
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAccountSelect = (accountName: string) => {
    setInputValue(accountName)
    onChange(accountName)
    setIsOpen(false)
  }

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleClear = () => {
    setInputValue('')
    onChange('')
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            text-gray-900 dark:text-gray-100
            ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}
            ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
          `}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            >
              ×
            </button>
          )}
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && inputValue && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Options List */}
          <div className="max-h-40 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400">Loading accounts...</div>
            ) : error ? (
              <div className="px-3 py-2 text-red-500 dark:text-red-400">Error loading accounts</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>No existing accounts found</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">Will create new account</span>
                </div>
              </div>
            ) : (
              <>
                {filteredAccounts.map((account) => (
                  <div
                    key={account.account_id}
                    className={`
                      px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600
                      ${inputValue === account.account_name ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
                    `}
                    onClick={() => handleAccountSelect(account.account_name)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{account.account_name}</div>
                        {account.industry && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{account.industry}</div>
                        )}
                        {leadMode && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">Existing account - will link on conversion</div>
                        )}
                      </div>
                      {inputValue === account.account_name && (
                        <div className="text-blue-600 dark:text-blue-400">✓</div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Show "Create New" option if typed text doesn't match any existing account */}
                {inputValue && !filteredAccounts.some(account => 
                  account.account_name.toLowerCase() === inputValue.toLowerCase()
                ) && (
                  <div className="border-t border-gray-200 dark:border-gray-600">
                    <div className="px-3 py-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center space-x-2">
                        <PlusIcon className="h-4 w-4" />
                        <span>
                          {leadMode 
                            ? `New company: "${inputValue}" (account created on conversion)`
                            : `Create new account: "${inputValue}"`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountSelect