import { useState, useRef, useEffect } from 'react'
import { Settings, Eye, EyeOff, RotateCcw } from 'lucide-react'
import type { ColumnConfig } from './DataTable'

export interface ColumnVisibility {
  [key: string]: boolean
}

export interface ColumnManagerProps<T = any> {
  columns: ColumnConfig<T>[]
  visibleColumns: ColumnVisibility
  onVisibilityChange: (visibility: ColumnVisibility) => void
  className?: string
}

export const ColumnManager = <T extends Record<string, any>>({
  columns,
  visibleColumns,
  onVisibilityChange,
  className = ''
}: ColumnManagerProps<T>) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const toggleColumn = (columnKey: string) => {
    onVisibilityChange({
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    })
  }

  const showAllColumns = () => {
    const allVisible = columns.reduce((acc, column) => {
      acc[column.key] = true
      return acc
    }, {} as ColumnVisibility)
    onVisibilityChange(allVisible)
  }

  const hideAllColumns = () => {
    const allHidden = columns.reduce((acc, column) => {
      acc[column.key] = false
      return acc
    }, {} as ColumnVisibility)
    onVisibilityChange(allHidden)
  }

  const resetToDefault = () => {
    // Show all columns by default
    showAllColumns()
  }

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: 'white',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#9ca3af'
          e.currentTarget.style.backgroundColor = '#f9fafb'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db'
          e.currentTarget.style.backgroundColor = 'white'
        }}
      >
        <Settings size={16} />
        <span>Columns ({visibleCount})</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50"
          style={{
            minWidth: '280px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Manage Columns
              </h3>
              <button
                onClick={resetToDefault}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={12} />
                Reset
              </button>
            </div>
            
            {/* Bulk Actions */}
            <div className="flex gap-2">
              <button
                onClick={showAllColumns}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Show All
              </button>
              <button
                onClick={hideAllColumns}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Hide All
              </button>
            </div>
          </div>

          {/* Column List */}
          <div className="p-2">
            {columns.map((column) => {
              const isVisible = visibleColumns[column.key] !== false
              
              return (
                <div
                  key={column.key}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleColumn(column.key)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        isVisible
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 dark:border-gray-500'
                      }`}
                    >
                      {isVisible && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                          className="text-white"
                        >
                          <path
                            d="M9 1L3.5 6.5L1 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {column.title}
                    </span>
                  </div>
                  
                  <div className="text-gray-400 dark:text-gray-500">
                    {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
            {visibleCount} of {columns.length} columns visible
          </div>
        </div>
      )}
    </div>
  )
}