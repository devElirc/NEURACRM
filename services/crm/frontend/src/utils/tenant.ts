// // export const getTenantFromHost = (): string | null => {
// //   const hostname = window.location.hostname
  
// //   // Handle localhost development
// //   if (hostname === 'localhost' || hostname === '127.0.0.1') {
// //     return null
// //   }
  
// //   // Handle tenant.localhost pattern
// //   if (hostname.endsWith('.localhost')) {
// //     const parts = hostname.split('.')
// //     return parts[0] !== 'localhost' ? parts[0] : null
// //   }
  
// //   // Handle production domain pattern (tenant.domain.com)
// //   if (hostname.includes('.')) {
// //     const parts = hostname.split('.')
// //     if (parts.length >= 3) {
// //       return parts[0]
// //     }
// //   }
  
// //   return null
// // }

// // export const getApiBaseUrl = (): string => {
// //   const tenant = getTenantFromHost()
// //   const protocol = window.location.protocol
  
// //   // Debug logging
// //   console.log('🔍 getApiBaseUrl Debug:', {
// //     hostname: window.location.hostname,
// //     port: window.location.port,
// //     tenant,
// //     protocol,
// //     fullUrl: window.location.href
// //   })
  
// //   if (tenant) {
// //     // Always use port 8000 for backend API, regardless of frontend port
// //     const apiUrl = `${protocol}//${tenant}.localhost:8000`
// //     console.log('🔍 Using tenant API URL:', apiUrl)
// //     return apiUrl
// //   }
  
// //   const apiUrl = `${protocol}//127.0.0.1:8000`
// //   console.log('🔍 Using superadmin API URL:', apiUrl)
// //   return apiUrl
// // }

// // export const isSuperAdminDomain = (): boolean => {
// //   const hostname = window.location.hostname
// //   return hostname === '127.0.0.1' || hostname === 'localhost'
// // }

// // export const getCurrentTenant = (): string | null => {
// //   return getTenantFromHost()
// // }




// export const getTenantFromHost = (): string | null => {
//   const hostname = window.location.hostname;
//   console.log('?? getTenantFromHost hostname:', hostname);

//   // No tenant detection for now
//   return null;
// };

// export const getApiBaseUrl = (): string => {
//   const hostname = window.location.hostname;
//   const protocol = window.location.protocol;
//   const port = window.location.port;

//   if (hostname === 'localhost' || hostname === '127.0.0.1') {
//     // Local dev ? full backend URL including /api
//     const url = `${protocol}//127.0.0.1:8000/api`;
//     console.log('?? Development API URL =', url, { hostname, port });
//     return url;
//   }

//   // Production ? base should be just "" so axios hits /api/*
//   const url = '';
//   console.log('?? Production API URL = root', { hostname, port });
//   return url;
// };

// export const isSuperAdminDomain = (): boolean => {
//   const hostname = window.location.hostname;
//   return hostname === '127.0.0.1' || hostname === 'localhost';
// };

// export const getCurrentTenant = (): string | null => {
//   return null;
// };


export const getTenantFromHost = (): string | null => {
  const hostname = window.location.hostname;
  console.log('?? getTenantFromHost hostname:', hostname);

  // No tenant detection for now
  return null;
};

export const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${window.location.protocol}//127.0.0.1:8000`;
  }

  // Production: use relative path so axios hits /api via Nginx
  return "";
};

export const isSuperAdminDomain = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === '127.0.0.1' || hostname === 'localhost';
};

export const getCurrentTenant = (): string | null => {
  return null;
};
