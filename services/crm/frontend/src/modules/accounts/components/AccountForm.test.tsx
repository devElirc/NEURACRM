import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AccountForm } from './AccountForm'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('AccountForm', () => {
  it('renders create form when no account provided', () => {
    renderWithProviders(<AccountForm />)
    
    expect(screen.getByText('Create New Account')).toBeInTheDocument()
    expect(screen.getByLabelText(/Account Name/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Account/ })).toBeInTheDocument()
  })

  it('renders edit form when account provided', () => {
    const mockAccount = {
      account_id: 1,
      account_name: 'Test Company',
      account_owner_alias: 'test-owner',
      description: 'Test description',
      industry: 'Technology',
      website: 'https://test.com',
      phone: '+1234567890',
      number_of_employees: 100,
      billing_country: 'US',
      billing_street: '123 Test St',
      billing_city: 'Test City',
      billing_state_province: 'Test State',
      billing_zip_postal_code: '12345',
      shipping_country: 'US',
      shipping_street: '123 Test St',
      shipping_city: 'Test City',
      shipping_state_province: 'Test State',
      shipping_zip_postal_code: '12345',
      tenant: 1,
      tenant_name: 'test-tenant',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }

    renderWithProviders(<AccountForm account={mockAccount} />)
    
    expect(screen.getByText('Edit Account')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Update Account/ })).toBeInTheDocument()
  })
})