import React from 'react'

interface FormFieldProps<TName = string> {
  label: string
  name: TName
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'url' | 'date'
  value: string | number | undefined
  onChange: (name: TName, value: string | number | undefined) => void
  error?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  min?: number
  max?: number
  step?: string
  rows?: number // For textarea
  as?: 'input' | 'textarea' | 'select'
  options?: { value: string | number; label: string }[] // For select
}

export const FormField = <TName = string>({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  min,
  max,
  step,
  rows = 4,
  as = 'input',
  options
}: FormFieldProps<TName>) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = e.target.value
    
    if (type === 'number') {
      if (step && step.includes('.')) {
        onChange(name, newValue ? parseFloat(newValue) : undefined)
      } else {
        onChange(name, newValue ? parseInt(newValue) : undefined)
      }
    } else {
      onChange(name, newValue)
    }
  }

  const baseInputClasses = `w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
    error ? 'border-red-500 dark:border-red-400' : ''
  } ${disabled ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''} ${className}`

  const displayValue = value === undefined ? '' : value.toString()

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {as === 'textarea' ? (
        <textarea
          value={displayValue}
          onChange={handleChange}
          className={baseInputClasses}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
        />
      ) : as === 'select' ? (
        <select
          value={displayValue}
          onChange={handleChange}
          className={baseInputClasses}
          disabled={disabled}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={displayValue}
          onChange={handleChange}
          className={baseInputClasses}
          placeholder={placeholder}
          disabled={disabled}
          min={type === 'number' ? min : undefined}
          max={type === 'number' ? max : undefined}
          step={type === 'number' ? step : undefined}
        />
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}