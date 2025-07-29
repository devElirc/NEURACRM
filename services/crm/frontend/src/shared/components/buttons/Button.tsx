import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  fullWidth = false
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg 
    transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-offset-1
    border border-transparent disabled:cursor-not-allowed disabled:opacity-50
    transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg
    ${fullWidth ? 'w-full' : ''}
  `.replace(/\s+/g, ' ').trim()
  
  const variantClasses = {
    primary: `
      bg-primary-600 text-white shadow-sm
      hover:bg-primary-700 hover:shadow-primary-500/25 focus:ring-primary-200
      disabled:bg-primary-400 disabled:hover:bg-primary-400 disabled:transform-none disabled:shadow-sm
    `,
    secondary: `
      bg-white text-gray-700 border-gray-300 shadow-sm
      hover:bg-gray-50 hover:border-gray-400 hover:shadow-gray-500/10 focus:ring-primary-200
      disabled:bg-gray-100 disabled:hover:bg-gray-100 disabled:border-gray-300 disabled:transform-none disabled:shadow-sm
    `,
    tertiary: `
      bg-gray-100 text-gray-700 border-gray-100
      hover:bg-gray-200 hover:border-gray-200 hover:shadow-gray-500/10 focus:ring-gray-200
      disabled:bg-gray-50 disabled:hover:bg-gray-50 disabled:transform-none disabled:shadow-none
    `,
    danger: `
      bg-error-500 text-white shadow-sm
      hover:bg-error-600 hover:shadow-error-500/25 focus:ring-error-200
      disabled:bg-error-400 disabled:hover:bg-error-400 disabled:transform-none disabled:shadow-sm
    `,
    success: `
      bg-success-500 text-white shadow-sm
      hover:bg-success-600 hover:shadow-success-500/25 focus:ring-success-200
      disabled:bg-success-400 disabled:hover:bg-success-400 disabled:transform-none disabled:shadow-sm
    `,
    warning: `
      bg-warning-500 text-white shadow-sm
      hover:bg-warning-600 hover:shadow-warning-500/25 focus:ring-warning-200
      disabled:bg-warning-400 disabled:hover:bg-warning-400 disabled:transform-none disabled:shadow-sm
    `
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12'
  }
  
  const isDisabled = disabled || loading
  
  const buttonClasses = `
    ${baseClasses} 
    ${variantClasses[variant].replace(/\s+/g, ' ').trim()} 
    ${sizeClasses[size]} 
    ${className}
  `.replace(/\s+/g, ' ').trim()

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={buttonClasses}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 transition-all duration-200"
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
      )}
      {children}
    </button>
  )
}