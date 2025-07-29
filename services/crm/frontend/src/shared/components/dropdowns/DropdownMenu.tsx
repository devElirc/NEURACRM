import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export interface DropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  divider?: boolean
  danger?: boolean
}

interface DropdownMenuProps {
  trigger: React.ReactNode | string
  items: DropdownItem[]
  className?: string
  menuClassName?: string
  position?: 'left' | 'right' | 'center'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'text' | 'icon'
  disabled?: boolean
  showChevron?: boolean
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  className = '',
  menuClassName = '',
  position = 'right',
  size = 'md',
  variant = 'button',
  disabled = false,
  showChevron = true
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          setIsOpen(false)
          break
        case 'ArrowDown':
          event.preventDefault()
          // Focus first menu item
          const firstItem = document.querySelector('[role="menuitem"]') as HTMLElement
          if (firstItem) firstItem.focus()
          break
        case 'ArrowUp':
          event.preventDefault()
          // Focus last menu item
          const menuItems = document.querySelectorAll('[role="menuitem"]')
          const lastItem = menuItems[menuItems.length - 1] as HTMLElement
          if (lastItem) lastItem.focus()
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeydown)
      return () => document.removeEventListener('keydown', handleKeydown)
    }
  }, [isOpen])

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick()
      setIsOpen(false)
    }
  }

  const triggerSizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const triggerVariantClasses = {
    button: `
      bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
      transition-all duration-200
    `,
    text: `
      text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg
      transition-all duration-200
    `,
    icon: `
      p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500
    `
  }

  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 transform -translate-x-1/2'
  }

  const triggerClasses = `
    ${variant === 'icon' ? 'inline-flex items-center justify-center' : 'inline-flex items-center'}
    ${triggerSizeClasses[size]}
    ${triggerVariantClasses[variant].replace(/\s+/g, ' ').trim()}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.replace(/\s+/g, ' ').trim()

  const menuClasses = `
    absolute z-dropdown mt-2 min-w-48 bg-white rounded-lg shadow-dropdown 
    border border-gray-200 py-1 ${positionClasses[position]} ${menuClassName}
  `.replace(/\s+/g, ' ').trim()

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger */}
      <div
        className={triggerClasses}
        onClick={handleTriggerClick}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {typeof trigger === 'string' ? (
          <span className="truncate">{trigger}</span>
        ) : (
          trigger
        )}
        {showChevron && variant !== 'icon' && (
          <ChevronDown 
            className={`ml-2 h-4 w-4 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          />
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={menuClasses} role="menu">
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.divider && index > 0 && (
                <div className="border-t border-gray-100 my-1" />
              )}
              <button
                className={`
                  w-full text-left px-4 py-2 text-sm transition-colors duration-200
                  flex items-center gap-3
                  ${item.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : item.danger
                      ? 'text-error-600 hover:bg-error-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `.replace(/\s+/g, ' ').trim()}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                role="menuitem"
              >
                {item.icon && (
                  <div className="flex-shrink-0 w-4 h-4">
                    {React.cloneElement(item.icon as React.ReactElement, {
                      className: 'w-4 h-4'
                    })}
                  </div>
                )}
                <span className="truncate">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}