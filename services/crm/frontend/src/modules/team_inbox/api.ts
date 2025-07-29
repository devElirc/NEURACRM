import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentTenant } from '../../utils/tenant'
import axios from '@/api/axios'

// Base API URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'


// API functions - using axios with automatic auth handling

const getApiUrl = () => {
  const tenant = getCurrentTenant()
  const baseUrl = tenant ? `http://${tenant}.localhost:8000` : API_BASE
  return `${baseUrl}/api/contacts/`
}

const inboxApi = {

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
  
}
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