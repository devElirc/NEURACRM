import React from 'react'

interface StatsGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  children,
  columns = 4,
  className = ''
}) => {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 ${className}`}>
      {children}
    </div>
  )
}