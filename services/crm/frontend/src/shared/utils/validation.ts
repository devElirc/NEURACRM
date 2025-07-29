export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format
 * @param email - Email string to validate
 * @param required - Whether email is required
 * @returns Validation result
 */
export const validateEmail = (email: string, required = false): ValidationResult => {
  if (!email?.trim()) {
    return required 
      ? { isValid: false, error: 'Email is required' }
      : { isValid: true };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email)
    ? { isValid: true }
    : { isValid: false, error: 'Please enter a valid email address' };
}

/**
 * Validates phone number format
 * @param phone - Phone string to validate
 * @param required - Whether phone is required
 * @returns Validation result
 */
export const validatePhone = (phone: string, required = false): ValidationResult => {
  if (!phone?.trim()) {
    return required 
      ? { isValid: false, error: 'Phone is required' }
      : { isValid: true };
  }
  
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phoneRegex.test(phone)
    ? { isValid: true }
    : { isValid: false, error: 'Please enter a valid phone number' };
}

/**
 * Validates URL format (must start with http)
 * @param url - URL string to validate
 * @param required - Whether URL is required
 * @returns Validation result
 */
export const validateUrl = (url: string, required = false): ValidationResult => {
  if (!url?.trim()) {
    return required 
      ? { isValid: false, error: 'Website is required' }
      : { isValid: true };
  }
  
  return url.startsWith('http')
    ? { isValid: true }
    : { isValid: false, error: 'Website must start with http:// or https://' };
}

/**
 * Validates required fields
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateRequired = (value: string | number | undefined, fieldName: string): ValidationResult => {
  const stringValue = String(value || '').trim();
  return stringValue
    ? { isValid: true }
    : { isValid: false, error: `${fieldName} is required` };
}

/**
 * Validates number within specified range
 * @param value - Value to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @param fieldName - Name of field for error message
 * @param required - Whether field is required
 * @returns Validation result
 */
export const validateNumberRange = (
  value: string | number, 
  min: number, 
  max: number, 
  fieldName: string,
  required = false
): ValidationResult => {
  const stringValue = String(value || '').trim();
  
  if (!stringValue) {
    return required 
      ? { isValid: false, error: `${fieldName} is required` }
      : { isValid: true };
  }
  
  const numValue = Number(stringValue);
  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }
  
  if (numValue < min || numValue > max) {
    return { isValid: false, error: `${fieldName} must be between ${min} and ${max}` };
  }
  
  return { isValid: true };
}

/**
 * Validates positive numbers
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @param required - Whether field is required
 * @returns Validation result
 */
export const validatePositiveNumber = (value: string | number, fieldName: string, required = false): ValidationResult => {
  const stringValue = String(value || '').trim();
  
  if (!stringValue) {
    return required 
      ? { isValid: false, error: `${fieldName} is required` }
      : { isValid: true };
  }
  
  const numValue = Number(stringValue);
  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }
  
  return numValue > 0
    ? { isValid: true }
    : { isValid: false, error: `${fieldName} must be a positive number` };
}

/**
 * Validates future dates (cannot be in the past)
 * @param dateString - Date string to validate
 * @param fieldName - Name of field for error message
 * @param required - Whether field is required
 * @returns Validation result
 */
export const validateFutureDate = (dateString: string, fieldName: string, required = false): ValidationResult => {
  if (!dateString?.trim()) {
    return required 
      ? { isValid: false, error: `${fieldName} is required` }
      : { isValid: true };
  }
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date >= today
    ? { isValid: true }
    : { isValid: false, error: `${fieldName} cannot be in the past` };
}

/**
 * Helper function to collect validation errors from multiple validation results
 * @param validationResults - Array of field name and validation result pairs
 * @returns Object with error messages keyed by field name
 */
export const collectValidationErrors = (
  validationResults: Array<[string, ValidationResult]>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  validationResults.forEach(([fieldName, result]) => {
    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
    }
  });
  
  return errors;
}