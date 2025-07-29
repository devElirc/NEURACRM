import React from 'react'

interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
  variant?: 'error' | 'warning' | 'info'
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Error',
  message,
  onRetry,
  className = '',
  variant = 'error'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-400 dark:text-yellow-300',
          title: 'text-yellow-800 dark:text-yellow-200',
          message: 'text-yellow-700 dark:text-yellow-300'
        }
      case 'info':
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-400 dark:text-blue-300',
          title: 'text-blue-800 dark:text-blue-200',
          message: 'text-blue-700 dark:text-blue-300'
        }
      case 'error':
      default:
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: 'text-red-400 dark:text-red-300',
          title: 'text-red-800 dark:text-red-200',
          message: 'text-red-700 dark:text-red-300'
        }
    }
  }

  const classes = getVariantClasses()

  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'info':
        return (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
      default:
        return (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className={`rounded-md border p-4 ${classes.container} ${className}`}>
      <div className="flex">
        <div className={`flex-shrink-0 ${classes.icon}`}>
          {getIcon()}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${classes.title}`}>
            {title}
          </h3>
          <div className={`mt-2 text-sm ${classes.message}`}>
            <p>{message}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className={`text-sm font-medium underline hover:no-underline ${classes.message}`}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}