/**
 * Extract user-friendly error message from axios error response
 */
export const getErrorMessage = (error: any): string => {
  // Try to extract error message from response data
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  // Handle field validation errors
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }
  
  // Handle array of field errors
  if (error.response?.data && typeof error.response.data === 'object') {
    const firstField = Object.keys(error.response.data)[0]
    if (firstField && Array.isArray(error.response.data[firstField])) {
      return error.response.data[firstField][0]
    }
  }
  
  // Fallback to axios error message
  if (error.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

/**
 * Display error message to user with proper formatting
 */
export const showErrorMessage = (error: any, action: string) => {
  const message = getErrorMessage(error)
  alert(`Error ${action}: ${message}`)
}