import React from 'react'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showActions?: boolean
  showSelection?: boolean
  className?: string
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showActions = true,
  showSelection = false,
  className = ''
}) => {
  const renderSkeletonRow = (index: number) => (
    <tr key={index} className="animate-pulse">
      {showSelection && (
        <td className="px-6 py-4">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
        </td>
      )}
      {Array.from({ length: columns }, (_, colIndex) => (
        <td key={colIndex} className="px-6 py-4">
          <div className={`h-4 bg-gray-200 rounded ${
            colIndex === 0 ? 'w-32' : colIndex === 1 ? 'w-24' : 'w-20'
          }`}></div>
        </td>
      ))}
      {showActions && (
        <td className="px-6 py-4">
          <div className="w-5 h-5 bg-gray-200 rounded ml-auto"></div>
        </td>
      )}
    </tr>
  )

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-background-secondary">
            <tr className="animate-pulse">
              {showSelection && (
                <th className="px-6 py-4">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                </th>
              )}
              {Array.from({ length: columns }, (_, colIndex) => (
                <th key={colIndex} className="px-6 py-4">
                  <div className={`h-4 bg-gray-300 rounded ${
                    colIndex === 0 ? 'w-24' : colIndex === 1 ? 'w-20' : 'w-16'
                  }`}></div>
                </th>
              ))}
              {showActions && (
                <th className="px-6 py-4">
                  <div className="w-16 h-4 bg-gray-300 rounded ml-auto"></div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }, (_, index) => renderSkeletonRow(index))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Card skeleton for dashboard stats
interface CardSkeletonProps {
  className?: string
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse ${className}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-3"></div>
        <div className="flex items-center">
          <div className="h-4 bg-gray-200 rounded w-12 mr-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
)

// Form skeleton for loading forms
interface FormSkeletonProps {
  fields?: number
  className?: string
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ 
  fields = 6, 
  className = '' 
}) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse ${className}`}>
    <div className="space-y-6">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index}>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-gray-300 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
)