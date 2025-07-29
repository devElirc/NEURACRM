import React from 'react'
import { Search } from 'lucide-react'

export interface TableControlsProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  actions?: React.ReactNode
  filters?: React.ReactNode
  className?: string
}

export const TableControls: React.FC<TableControlsProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions,
  filters,
  className = '',
}) => {
  return (
    <div 
      className={`${className} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
        padding: '12px',
        borderRadius: '8px',
      }}
    >
      {/* Search Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <Search size={16} className="text-gray-500 dark:text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            fontSize: '13px',
          }}
        />
      </div>

      {/* Filters */}
      {filters && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {filters}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {actions}
        </div>
      )}
    </div>
  )
}