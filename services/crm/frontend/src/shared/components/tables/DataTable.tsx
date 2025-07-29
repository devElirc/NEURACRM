import React, { useState, useEffect } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { LoadingSpinner, ErrorAlert, EmptyState } from '../feedback'
import type { ColumnVisibility } from './ColumnManager'

export interface ColumnConfig<T = any> {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, item: T) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
}

export interface ActionConfig<T = any> {
  id: string
  label: string
  onClick: (item: T) => void
  icon?: React.ReactNode
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning'
  hidden?: (item: T) => boolean
  disabled?: (item: T) => boolean
  divider?: boolean
}

export interface DataTableProps<T = any> {
  data: T[]
  columns: ColumnConfig<T>[]
  loading?: boolean
  error?: string
  keyExtractor: (item: T) => string | number
  actions?: ActionConfig<T>[]
  onRowClick?: (item: T) => void
  emptyMessage?: string
  className?: string
  searchTerm?: string
  showSelection?: boolean
  onSelectionChange?: (selectedItems: T[]) => void
  columnVisibility?: ColumnVisibility
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading,
  error,
  keyExtractor,
  actions,
  onRowClick,
  emptyMessage = 'No data found',
  className = '',
  searchTerm = '',
  showSelection = false,
  onSelectionChange,
  columnVisibility
}: DataTableProps<T>) => {
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set())
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [openActionMenu, setOpenActionMenu] = useState<string | number | null>(null)
  const [actionMenuPosition, setActionMenuPosition] = useState('bottom')
  const actionMenuRef = React.useRef<HTMLDivElement>(null)

  // Filter and sort data
  const processedData = React.useMemo(() => {
    let processed = [...data]
    
    // Filter based on search term
    if (searchTerm) {
      processed = processed.filter(item => {
        return columns.some(column => {
          if (column.searchable === false) return false
          const value = item[column.key]
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
        })
      })
    }
    
    // Sort data
    if (sortColumn) {
      processed.sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }
    
    return processed
  }, [data, searchTerm, columns, sortColumn, sortDirection])

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Handle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(processedData.map(keyExtractor))
      setSelectedItems(allIds)
      onSelectionChange?.(processedData)
    } else {
      setSelectedItems(new Set())
      onSelectionChange?.([])
    }
  }

  const handleSelectItem = (item: T, checked: boolean) => {
    const id = keyExtractor(item)
    const newSelected = new Set(selectedItems)
    
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    
    setSelectedItems(newSelected)
    const selectedData = processedData.filter(item => newSelected.has(keyExtractor(item)))
    onSelectionChange?.(selectedData)
  }

  // Update selection callback when items change
  useEffect(() => {
    if (onSelectionChange) {
      const selectedData = processedData.filter(item => selectedItems.has(keyExtractor(item)))
      onSelectionChange(selectedData)
    }
  }, [selectedItems, processedData, onSelectionChange, keyExtractor])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openActionMenu !== null && !target.closest('.action-menu-container')) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [openActionMenu]);

  const handleActionMenuToggle = (itemKey: string | number) => {
    if (openActionMenu === itemKey) {
      setOpenActionMenu(null);
    } else {
      if (actionMenuRef.current) {
        const rect = actionMenuRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 200) { // 200 is an estimated height for the dropdown
          setActionMenuPosition('top');
        } else {
          setActionMenuPosition('bottom');
        }
      }
      setOpenActionMenu(itemKey);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${className} bg-white dark:bg-gray-800`} style={{
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '32px',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <LoadingSpinner size="md" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} bg-white dark:bg-gray-800`} style={{
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
      }}>
        <ErrorAlert message={error} />
      </div>
    )
  }

  const isAllSelected = selectedItems.size === processedData.length && processedData.length > 0
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < processedData.length

  // Filter visible columns
  const visibleColumns = columns.filter(column => 
    columnVisibility ? columnVisibility[column.key] !== false : true
  )

  return (
    <div className={`${className} bg-white dark:bg-gray-800`} style={{
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }}>
      <table className="bg-white dark:bg-gray-800" style={{
        width: '100%',
        borderCollapse: 'collapse' as const,
      }}>
        <thead className="bg-gray-50 dark:bg-gray-700" style={{
          borderBottom: '1px solid #e2e8f0',
        }}>
          <tr>
            {showSelection && (
              <th className="text-gray-600 dark:text-gray-200" style={{
                padding: '8px 12px',
                textAlign: 'left' as const,
                fontSize: '13px',
                fontWeight: '600',
              }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate
                  }}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
            )}
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                className="text-gray-700 dark:text-gray-300"
                style={{
                  padding: '8px 12px',
                  textAlign: column.align || 'left',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: column.sortable ? 'pointer' : 'default',
                  userSelect: column.sortable ? 'none' as const : 'auto',
                  width: column.width || 'auto',
                }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{column.title}</span>
                  {column.sortable && (
                    <ArrowUpDown 
                      size={14}
                      color={sortColumn === column.key ? '#3b82f6' : '#9ca3af'}
                    />
                  )}
                </div>
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="text-gray-600 dark:text-gray-200" style={{
                padding: '8px 12px',
                textAlign: 'right' as const,
                fontSize: '13px',
                fontWeight: '600',
              }}>
                Actions
              </th>
            )}
            </tr>
          </thead>
        <tbody>
          {processedData.length === 0 ? (
            <tr>
              <td 
                colSpan={visibleColumns.length + (actions ? 1 : 0) + (showSelection ? 1 : 0)} 
                className="text-gray-500 dark:text-gray-400"
                style={{ padding: '48px 12px', textAlign: 'center' }}
              >
                <EmptyState 
                  title={emptyMessage}
                  description={searchTerm ? "Try adjusting your search or filters." : undefined}
                />
              </td>
            </tr>
          ) : (
            processedData.map((item) => {
              const itemKey = keyExtractor(item)
              const isSelected = selectedItems.has(itemKey)
              
              return (
                <tr
                  key={itemKey}
                  className={`border-b border-gray-200 dark:border-gray-600 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                  style={{
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => onRowClick?.(item)}
                >
                  {showSelection && (
                    <td 
                      className="text-gray-700 dark:text-gray-300"
                      style={{
                        padding: '8px 12px',
                        fontSize: '13px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectItem(item, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className="text-gray-700 dark:text-gray-300"
                      style={{
                        padding: '8px 12px',
                        fontSize: '13px',
                        textAlign: column.align || 'left',
                      }}
                    >
                      {column.render ? column.render(item[column.key], item) : (item[column.key] || 'N/A')}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td
                      className="text-gray-700 dark:text-gray-300"
                      style={{
                        padding: '8px 12px',
                        fontSize: '13px',
                        textAlign: 'right',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ position: 'relative' }} className="action-menu-container" ref={actionMenuRef}>
                        <button
                          onClick={() => handleActionMenuToggle(itemKey)}
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            fontSize: '18px',
                          }}
                        >
                          ⋯
                        </button>
                        {openActionMenu === itemKey && (
                          <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600" style={{
                            position: 'absolute',
                            right: 0,
                            top: actionMenuPosition === 'top' ? 'auto' : '100%',
                            bottom: actionMenuPosition === 'top' ? '100%' : 'auto',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 10,
                            minWidth: '150px',
                            padding: '4px 0',
                          }}>
                            {actions.filter(action => !action.hidden || !action.hidden(item)).map((action) => (
                                <React.Fragment key={action.id}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick(item);
                                      setOpenActionMenu(null);
                                    }}
                                    disabled={action.disabled && action.disabled(item)}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-600 ${
                                      action.variant === 'danger' 
                                        ? 'text-red-600 dark:text-red-400' 
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      width: '100%',
                                      padding: '8px 12px',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      fontSize: '13px',
                                      opacity: (action.disabled && action.disabled(item)) ? 0.5 : 1,
                                    }}
                                  >
                                    {action.icon}
                                    {action.label}
                                  </button>
                                  {action.divider && <div className="h-px bg-gray-200 dark:bg-gray-600 mx-0 my-1" />}
                                </React.Fragment>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
