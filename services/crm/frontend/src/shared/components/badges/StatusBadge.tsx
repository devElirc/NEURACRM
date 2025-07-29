import React from 'react'

type StatusType = 'new' | 'qualified' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'active' | 'inactive' | 'pending'

interface StatusBadgeProps {
  status: StatusType | string
  variant?: 'default' | 'dot' | 'pill'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  customColors?: {
    bg: string
    text: string
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'default',
  size = 'md',
  className = '',
  customColors
}) => {
  // Predefined status color mappings
  const statusColors: Record<string, { bg: string; text: string }> = {
    // Lead statuses
    new: { bg: 'bg-status-new-bg text-status-new-text', text: 'text-status-new-text' },
    qualified: { bg: 'bg-status-qualified-bg text-status-qualified-text', text: 'text-status-qualified-text' },
    contacted: { bg: 'bg-status-contacted-bg text-status-contacted-text', text: 'text-status-contacted-text' },
    proposal: { bg: 'bg-status-proposal-bg text-status-proposal-text', text: 'text-status-proposal-text' },
    negotiation: { bg: 'bg-status-negotiation-bg text-status-negotiation-text', text: 'text-status-negotiation-text' },
    
    // Deal statuses
    won: { bg: 'bg-success-50 text-success-600', text: 'text-success-600' },
    lost: { bg: 'bg-error-50 text-error-600', text: 'text-error-600' },
    
    // General statuses
    active: { bg: 'bg-success-50 text-success-600', text: 'text-success-600' },
    inactive: { bg: 'bg-gray-100 text-gray-600', text: 'text-gray-600' },
    pending: { bg: 'bg-warning-50 text-warning-600', text: 'text-warning-600' },
    
    // Fallback
    default: { bg: 'bg-gray-100 text-gray-600', text: 'text-gray-600' }
  }

  const baseClasses = 'inline-flex items-center font-medium transition-all duration-200'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  }

  const variantClasses = {
    default: 'rounded-md',
    dot: 'rounded-md',
    pill: 'rounded-full'
  }

  // Get colors for status
  const colors = customColors || statusColors[status.toLowerCase()] || statusColors.default

  const badgeClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${colors.bg}
    ${className}
  `.replace(/\s+/g, ' ').trim()

  const displayText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()

  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} ${className}`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${colors.bg.replace('bg-', 'bg-').split(' ')[0].replace('-bg', '-500')}`} />
        <span className={`font-medium ${colors.text}`}>{displayText}</span>
      </span>
    )
  }

  return (
    <span className={badgeClasses}>
      {displayText}
    </span>
  )
}

// Utility function for creating status badges with predefined types
export const createStatusBadge = (status: StatusType, props?: Omit<StatusBadgeProps, 'status'>) => {
  return <StatusBadge status={status} {...props} />
}

// Export status types for use in other components
export type { StatusType }