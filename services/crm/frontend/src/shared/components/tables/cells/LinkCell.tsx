import React from 'react'

interface LinkCellProps {
  value: string
  type?: 'email' | 'phone' | 'url'
  className?: string
}

export const LinkCell: React.FC<LinkCellProps> = ({ 
  value, 
  type = 'url',
  className = ''
}) => {
  if (!value) {
    return <span className="text-gray-400">N/A</span>
  }

  const getHref = () => {
    switch (type) {
      case 'email':
        return `mailto:${value}`
      case 'phone':
        return `tel:${value}`
      case 'url':
        return value.startsWith('http') ? value : `https://${value}`
      default:
        return value
    }
  }

  const getDisplayValue = () => {
    if (type === 'url' && value.length > 30) {
      return value.replace(/^https?:\/\//, '').substring(0, 27) + '...'
    }
    return value
  }

  return (
    <a
      href={getHref()}
      target={type === 'url' ? '_blank' : undefined}
      rel={type === 'url' ? 'noopener noreferrer' : undefined}
      className={`text-blue-600 hover:text-blue-800 hover:underline ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {getDisplayValue()}
    </a>
  )
}