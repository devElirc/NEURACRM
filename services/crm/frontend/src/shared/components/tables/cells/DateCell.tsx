import React from 'react'

interface DateCellProps {
  value: string | Date
  format?: 'short' | 'long' | 'relative'
  className?: string
}

export const DateCell: React.FC<DateCellProps> = ({ 
  value, 
  format = 'short',
  className = ''
}) => {
  if (!value) {
    return <span className="text-gray-400">N/A</span>
  }

  const date = new Date(value)
  
  if (isNaN(date.getTime())) {
    return <span className="text-red-400">Invalid date</span>
  }

  const formatDate = () => {
    switch (format) {
      case 'long':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      case 'relative':
        return getRelativeTime(date)
      case 'short':
      default:
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
    }
  }

  const getRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
      return `${diffInDays}d ago`
    }
    
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`
    }
    
    const diffInYears = Math.floor(diffInMonths / 12)
    return `${diffInYears}y ago`
  }

  return (
    <span className={`text-sm text-gray-900 ${className}`} title={date.toLocaleString()}>
      {formatDate()}
    </span>
  )
}