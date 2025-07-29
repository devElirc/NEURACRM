import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  className?: string
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  className = '',
  trend,
  variant = 'default',
  size = 'md'
}) => {
  const baseClasses = `
    bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700
    transition-all duration-300 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600
    transform hover:scale-[1.02] hover:-translate-y-1
    cursor-pointer group
  `.replace(/\s+/g, ' ').trim()

  const variantClasses = {
    default: 'border-gray-200 dark:border-gray-700',
    primary: 'border-primary-200 bg-primary-50/30 dark:border-primary-700 dark:bg-primary-900/20',
    success: 'border-success-200 bg-success-50/30 dark:border-success-700 dark:bg-success-900/20',
    warning: 'border-warning-200 bg-warning-50/30 dark:border-warning-700 dark:bg-warning-900/20',
    error: 'border-error-200 bg-error-50/30 dark:border-error-700 dark:bg-error-900/20'
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const valueColorClasses = {
    default: 'text-gray-900 dark:text-white',
    primary: 'text-primary-600 dark:text-primary-400',
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    error: 'text-error-600 dark:text-error-400'
  }

  const iconColorClasses = {
    default: 'text-gray-500 dark:text-gray-400',
    primary: 'text-primary-500 dark:text-primary-400',
    success: 'text-success-500 dark:text-success-400',
    warning: 'text-warning-500 dark:text-warning-400',
    error: 'text-error-500 dark:text-error-400'
  }

  const titleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const cardClasses = `
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${sizeClasses[size]} 
    ${className}
  `.replace(/\s+/g, ' ').trim()

  return (
    <div className={cardClasses}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-gray-600 dark:text-gray-300 mb-1 ${titleSizes[size]}`}>
            {title}
          </p>
          <p className={`font-bold ${valueSizes[size]} ${valueColorClasses[variant]} leading-tight transition-all duration-200 group-hover:scale-105`}>
            {value}
          </p>
          {trend && (
            <div className="mt-3 flex items-center">
              <div className={`flex items-center text-sm font-medium transition-all duration-200 group-hover:scale-105 ${
                trend.isPositive ? 'text-success-600' : 'text-error-600'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:translate-y-[-2px]" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:translate-y-[2px]" />
                )}
                {Math.abs(trend.value)}%
              </div>
              {trend.label && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex-shrink-0 ml-4 ${iconColorClasses[variant]} transition-all duration-200 group-hover:scale-110`}>
            <div className={`${iconSizes[size]} transition-transform duration-300 group-hover:rotate-12`}>
              {React.cloneElement(icon as React.ReactElement, {
                className: `${iconSizes[size]}`
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}