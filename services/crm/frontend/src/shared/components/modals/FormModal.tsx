import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className = '',
  size = 'lg',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  const modalClasses = `
    relative bg-white dark:bg-gray-800 rounded-lg shadow-dropdown border border-gray-200 dark:border-gray-600
    ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden
    transform transition-all duration-200 scale-100
    ${className}
  `.replace(/\s+/g, ' ').trim()

  return (
    <div className="fixed inset-0 z-modal overflow-y-auto">
      {/* Backdrop with animation */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity duration-200"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={modalClasses} role="dialog" aria-modal="true">
          
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="flex-1 min-w-0">
                {title && (
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {subtitle}
                  </p>
                )}
              </div>
              
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    ml-4 p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600
                    rounded-lg transition-all duration-200 focus:outline-none 
                    focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                  "
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className={`${title || showCloseButton ? 'p-6' : 'p-6 pt-8'}`}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}