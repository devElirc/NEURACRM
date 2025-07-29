import React, { useState, useRef, useEffect } from 'react'
import { useContacts, useContactsByAccount, type ContactListItem } from '@/modules/contacts/api'

export interface ContactSelectProps {
  value?: number
  onChange: (contactId: number | undefined, contactName?: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  label?: string
  error?: string
  excludeId?: number // Exclude specific contact ID (e.g., current contact being edited)
  accountFilter?: number // Filter contacts by account ID
}

export const ContactSelect: React.FC<ContactSelectProps> = ({
  value,
  onChange,
  placeholder = "Select contact...",
  className = "",
  disabled = false,
  label,
  error,
  excludeId,
  accountFilter
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Use different hooks based on whether accountFilter is provided
  const allContactsQuery = useContacts(1, 50)
  const accountContactsQuery = useContactsByAccount(accountFilter || 0)

  // Determine which data to use based on accountFilter
  const contactsData = accountFilter && accountFilter > 0 ? accountContactsQuery.data : allContactsQuery.data
  const isLoading = accountFilter && accountFilter > 0 ? accountContactsQuery.isLoading : allContactsQuery.isLoading
  const apiError = accountFilter && accountFilter > 0 ? accountContactsQuery.error : allContactsQuery.error
  const contacts = contactsData?.results || []

  // Filter contacts based on search term and exclude specific ID
  const filteredContacts = contacts.filter((contact: ContactListItem) => {
    if (excludeId && contact.contact_id === excludeId) return false
    
    const searchLower = searchTerm.toLowerCase()
    return (
      contact.first_name.toLowerCase().includes(searchLower) ||
      contact.last_name.toLowerCase().includes(searchLower) ||
      contact.full_name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      (contact.title && contact.title.toLowerCase().includes(searchLower)) ||
      (contact.account_name && contact.account_name.toLowerCase().includes(searchLower))
    )
  })

  // Find selected contact
  const selectedContact = contacts.find((contact: ContactListItem) => contact.contact_id === value)

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

  const handleContactSelect = (contact: ContactListItem) => {
    onChange(contact.contact_id, contact.full_name)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange(undefined)
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
    } else if (e.key === 'ArrowDown' && filteredContacts.length > 0) {
      e.preventDefault()
      setIsOpen(true)
    }
  }

  if (isLoading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          Loading contacts...
        </div>
      </div>
    )
  }

  if (apiError) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          Error loading contacts
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
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${
          disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
        } ${error ? 'border-red-500 dark:border-red-500' : ''}`}
        onClick={handleInputClick}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search contacts..."
            className="w-full outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            disabled={disabled}
            autoFocus
          />
        ) : (
          <div className="flex items-center justify-between">
            <span className={selectedContact ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
              {selectedContact ? (
                <div className="flex items-center">
                  <span className="font-medium">{selectedContact.full_name}</span>
                  {selectedContact.title && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({selectedContact.title})</span>
                  )}
                  {selectedContact.account_name && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">@ {selectedContact.account_name}</span>
                  )}
                </div>
              ) : (
                placeholder
              )}
            </span>
            <div className="flex items-center space-x-1">
              {selectedContact && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  ×
                </button>
              )}
              <svg
                className="w-5 h-5 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
              {searchTerm ? 'No contacts found matching your search' : 'No contacts available'}
            </div>
          ) : (
            filteredContacts.map((contact: ContactListItem) => (
              <div
                key={contact.contact_id}
                className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                onClick={() => handleContactSelect(contact)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{contact.full_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{contact.email}</div>
                    {contact.title && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">{contact.title}</div>
                    )}
                    {contact.account_name && (
                      <div className="text-xs text-blue-600 dark:text-blue-400">@ {contact.account_name}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}