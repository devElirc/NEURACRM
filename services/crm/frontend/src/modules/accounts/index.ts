// Export pages
export { AccountsListPage } from './pages/AccountsListPage'
export { AccountDetailsPage } from './pages/AccountDetailsPage'
export { CreateAccountPage } from './pages/CreateAccountPage'
export { EditAccountPage } from './pages/EditAccountPage'
export { AccountDetailsRoute } from './pages/AccountDetailsRoute'
export { EditAccountRoute } from './pages/EditAccountRoute'

// Export components
export { AccountForm } from './components/AccountForm'

// Export API hooks and types
export {
  useAccounts,
  useAccount,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useAccountSummary,
  useAccountContacts,
  useAccountDeals,
  useAccountLeads,
  type Account,
  type AccountListItem,
  type AccountCreate,
  type AccountSummary,
  type PaginatedResponse,
} from './api'