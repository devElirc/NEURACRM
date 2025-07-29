import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FormSectionProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  alwaysExpanded?: boolean
  className?: string
  headerClassName?: string
  variant?: 'default' | 'card' | 'bordered'
  icon?: React.ReactNode
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  children,
  collapsible = false,
  defaultExpanded = true,
  alwaysExpanded = false,
  className = "",
  headerClassName = "",
  variant = 'default',
  icon
}) => {
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded || defaultExpanded)

  // If alwaysExpanded is true, force expanded state
  const expanded = alwaysExpanded || isExpanded

  const handleToggle = () => {
    if (!alwaysExpanded && collapsible) {
      setIsExpanded(!isExpanded)
    }
  }

  const variantClasses = {
    default: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6',
    card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm rounded-lg p-6 mb-6',
    bordered: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6 mb-6'
  }

  const sectionClasses = `${variantClasses[variant]} ${className}`.trim()

  return (
    <div className={sectionClasses}>
      <div
        className={`flex items-start justify-between mb-5 ${
          collapsible && !alwaysExpanded ? 'cursor-pointer' : ''
        } ${headerClassName}`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
              {React.cloneElement(icon as React.ReactElement, {
                className: 'w-5 h-5'
              })}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {collapsible && !alwaysExpanded && (
          <button
            type="button"
            className="flex-shrink-0 ml-4 p-1 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
            aria-label={expanded ? 'Collapse section' : 'Expand section'}
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                expanded ? 'transform rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>
      
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          expanded 
            ? 'opacity-100 max-h-screen transform translate-y-0' 
            : 'opacity-0 max-h-0 transform -translate-y-2'
        }`}
      >
        <div className={`transition-all duration-300 ${expanded ? 'pb-0' : 'pb-0'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}

// Convenience components for common form section patterns
export const EssentialInfoSection: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FormSection title="Essential Information" alwaysExpanded>
    {children}
  </FormSection>
)

export const RelationshipsSection: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FormSection title="Company & Relationships" defaultExpanded>
    {children}
  </FormSection>
)

export const AddressSection: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FormSection title="Address & Details" collapsible defaultExpanded={false}>
    {children}
  </FormSection>
)