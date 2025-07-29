import React from 'react'

interface BadgeCellProps {
  value: string
  variant?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink'
  className?: string
}

export const BadgeCell: React.FC<BadgeCellProps> = ({ 
  value, 
  variant = 'gray',
  className = ''
}) => {
  const getVariantClasses = (variant: string) => {
    const variants: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
    }
    return variants[variant] || variants.gray
  }

  if (!value) {
    return <span className="text-gray-400 dark:text-gray-500">N/A</span>
  }

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVariantClasses(variant)} ${className}`}
    >
      {value}
    </span>
  )
}