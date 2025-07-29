import React from 'react'

interface ActionButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md'
  disabled?: boolean
  loading?: boolean
  tooltip?: string
  className?: string
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'sm',
  disabled = false,
  loading = false,
  tooltip,
  className = ''
}) => {
  const baseClasses = `
    inline-flex items-center justify-center rounded-lg border border-transparent
    font-medium transition-all duration-200 focus:outline-none focus:ring-2 
    focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50
  `.replace(/\s+/g, ' ').trim()

  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-sm'
  }

  const variantClasses = {
    default: `
      text-gray-500 hover:text-gray-700 hover:bg-gray-100
      focus:ring-gray-200
    `,
    primary: `
      text-primary-600 hover:text-primary-700 hover:bg-primary-50
      focus:ring-primary-200
    `,
    danger: `
      text-error-600 hover:text-error-700 hover:bg-error-50
      focus:ring-error-200
    `,
    success: `
      text-success-600 hover:text-success-700 hover:bg-success-50
      focus:ring-success-200
    `,
    warning: `
      text-warning-600 hover:text-warning-700 hover:bg-warning-50
      focus:ring-warning-200
    `
  }

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant].replace(/\s+/g, ' ').trim()}
    ${className}
  `.replace(/\s+/g, ' ').trim()

  const handleClick = () => {
    if (!disabled && !loading) {
      onClick()
    }
  }

  const buttonContent = (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={tooltip}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        children
      )}
    </button>
  )

  // Wrap with tooltip if provided
  if (tooltip && !loading) {
    return (
      <div className="relative group">
        {buttonContent}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    )
  }

  return buttonContent
}

// Action button group for organizing multiple action buttons
interface ActionButtonGroupProps {
  children: React.ReactNode
  className?: string
  spacing?: 'tight' | 'normal' | 'loose'
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  children,
  className = '',
  spacing = 'normal'
}) => {
  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-3'
  }

  const groupClasses = `
    inline-flex items-center
    ${spacingClasses[spacing]}
    ${className}
  `.replace(/\s+/g, ' ').trim()

  return (
    <div className={groupClasses}>
      {children}
    </div>
  )
}