export const getTenantFromHost = (): string | null => {
  const hostname = window.location.hostname
  
  // Handle localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }
  
  // Handle tenant.localhost pattern
  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.')
    return parts[0] !== 'localhost' ? parts[0] : null
  }
  
  // Handle production domain pattern (tenant.domain.com)
  if (hostname.includes('.')) {
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      return parts[0]
    }
  }
  
  return null
}

// export const getApiBaseUrl = (): string => {
//   const tenant = getTenantFromHost()
//   const protocol = window.location.protocol
  
//   // Debug logging
//   console.log('🔍 getApiBaseUrl Debug:', {
//     hostname: window.location.hostname,
//     port: window.location.port,
//     tenant,
//     protocol,
//     fullUrl: window.location.href
//   })
  
//   if (tenant) {
//     // Always use port 8000 for backend API, regardless of frontend port
//     const apiUrl = `${protocol}//${tenant}.localhost:8000`
//     console.log('🔍 Using tenant API URL:', apiUrl)
//     return apiUrl
//   }
  
//   const apiUrl = `${protocol}//127.0.0.1:8000`
//   console.log('🔍 Using superadmin API URL:', apiUrl)
//   return apiUrl
// }

export const getApiBaseUrl = (): string => {
  const tenant = getTenantFromHost()
  const protocol = window.location.protocol
  const hostname = window.location.hostname

  // Debug logging
  console.log('🔍 getApiBaseUrl Debug:', {
    hostname,
    port: window.location.port,
    tenant,
    protocol,
    fullUrl: window.location.href,
  })

  // Development (localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//127.0.0.1:8000`
  }

  // Production: use relative URL, let Nginx proxy `/api/` → Daphne
  return ''
}



export const isSuperAdminDomain = (): boolean => {
  const hostname = window.location.hostname
  return hostname === '127.0.0.1' || hostname === 'localhost'
}

export const getCurrentTenant = (): string | null => {
  return getTenantFromHost()
}