import React from 'react'

interface AvatarCellProps {
  name: string
  subtitle?: string
  color?: string
}

export const AvatarCell: React.FC<AvatarCellProps> = ({ 
  name, 
  subtitle,
  color = 'blue'
}) => {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      gray: 'bg-gray-500'
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <div className="flex items-center">
      <div className="flex-shrink-0 h-10 w-10">
        <div className={`h-10 w-10 rounded-full ${getColorClasses(color)} flex items-center justify-center`}>
          <span className="text-white font-medium text-sm">
            {getInitials(name)}
          </span>
        </div>
      </div>
      <div className="ml-4">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</div>
        )}
      </div>
    </div>
  )
}