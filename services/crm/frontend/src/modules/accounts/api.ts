import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentTenant } from '../../utils/tenant'
import axios from '@/api/axios'

// Base API URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// Account types
export interface Account {
  account_id: number
  tenant: number
  tenant_name: string
  account_name: string
  account_owner_alias?: string
  description?: string
  parent_account?: number
  parent_account_name?: string
  industry?: string
  website?: string
  phone?: string
  number_of_employees?: number
  owner?: number
  owner_name?: string
  billing_country?: string
  billing_street?: string
  billing_city?: string
  billing_state_province?: string
  billing_zip_postal_code?: string
  shipping_country?: string
  shipping_street?: string
  shipping_city?: string
  shipping_state_province?: string
  shipping_zip_postal_code?: string
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
  updated_by?: number
  updated_by_name?: string
}

export interface AccountListItem {
  account_id: number
  account_name: string
  tenant_name: string
  industry?: string
  website?: string
  phone?: string
  number_of_employees?: number
  owner_name?: string
  parent_account_name?: string
  created_at: string
  updated_at: string
}

export interface AccountCreate {
  account_name: string
  account_owner_alias?: string
  description?: string
  parent_account?: number
  industry?: string
  website?: string
  phone?: string
  number_of_employees?: number
  owner?: number
  billing_country?: string
  billing_street?: string
  billing_city?: string
  billing_state_province?: string
  billing_zip_postal_code?: string
  shipping_country?: string
  shipping_street?: string
  shipping_city?: string
  shipping_state_province?: string
  shipping_zip_postal_code?: string
}

export interface AccountSummary {
  total_accounts: number
  accounts_with_contacts: number
  accounts_with_deals: number
  accounts_by_industry: Record<string, number>
  tenant: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API functions - using axios with automatic auth handling

const getApiUrl = () => {
  const tenant = getCurrentTenant()
  const baseUrl = tenant ? `http://${tenant}.localhost:8000` : API_BASE
  const apiUrl = `${baseUrl}/api/accounts/`
  console.log('🔍 Accounts API URL:', apiUrl)
  return apiUrl
}

const accountApi = {
  // Get all accounts
  getAccounts: async (page = 1, pageSize = 20): Promise<PaginatedResponse<AccountListItem>> => {
    try {
      const url = `${getApiUrl()}?page=${page}&page_size=${pageSize}`
      console.log('🔍 Fetching accounts from:', url)
      
      const response = await axios.get(url)
      
      console.log('🔍 Accounts response status:', response.status)
      console.log('🔍 Accounts data:', response.data)
      return response.data
    } catch (error) {
      console.error('🔍 Accounts API error:', error)
      throw error
    }
  },

  // Get single account
  getAccount: async (id: number): Promise<Account> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create account
  createAccount: async (data: AccountCreate): Promise<Account> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data
  },

  // Update account
  updateAccount: async (id: number, data: Partial<AccountCreate>): Promise<Account> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete account
  deleteAccount: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get account summary
  getAccountSummary: async (): Promise<AccountSummary> => {
    const response = await axios.get(`${getApiUrl()}summary/`)
    return response.data
  },

  // Get account contacts
  getAccountContacts: async (id: number) => {
    const response = await axios.get(`${getApiUrl()}${id}/contacts/`)
    return response.data
  },

  // Get account deals
  getAccountDeals: async (id: number) => {
    const response = await axios.get(`${getApiUrl()}${id}/deals/`)
    return response.data
  },

  // Get account leads
  getAccountLeads: async (id: number) => {
    const response = await axios.get(`${getApiUrl()}${id}/leads/`)
    return response.data
  }
}

// React Query hooks
export const useAccounts = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['accounts', page, pageSize],
    queryFn: () => accountApi.getAccounts(page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAccount = (id: number) => {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => accountApi.getAccount(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateAccount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: accountApi.createAccount,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['accounts'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['account-summary'],
        type: 'active'
      })
    },
  })
}

export const useUpdateAccount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AccountCreate> }) => 
      accountApi.updateAccount(id, data),
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['accounts'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['account', data.account_id],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['account-summary'],
        type: 'active'
      })
    },
  })
}

export const useDeleteAccount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: accountApi.deleteAccount,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['accounts'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['account-summary'],
        type: 'active'
      })
    },
  })
}

export const useAccountSummary = () => {
  return useQuery({
    queryKey: ['account-summary'],
    queryFn: accountApi.getAccountSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAccountContacts = (id: number) => {
  return useQuery({
    queryKey: ['account-contacts', id],
    queryFn: () => accountApi.getAccountContacts(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAccountDeals = (id: number) => {
  return useQuery({
    queryKey: ['account-deals', id],
    queryFn: () => accountApi.getAccountDeals(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAccountLeads = (id: number) => {
  return useQuery({
    queryKey: ['account-leads', id],
    queryFn: () => accountApi.getAccountLeads(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}