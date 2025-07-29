import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/auth/AuthProvider'
import { AppThemeProvider } from '@/contexts/ThemeProvider'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { RoleBasedRoute } from '@/auth/RoleBasedRoute'
import { PermissionBasedRoute } from '@/auth/PermissionBasedRoute'
import { LoginPage } from '@/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SuperAdminDashboard } from '@/pages/dashboard/SuperAdminDashboard'
import { TenantAdminDashboard } from '@/pages/dashboard/TenantAdminDashboard'
import { UserDashboard } from '@/pages/dashboard/UserDashboard'
import { MainLayout } from '@/layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { 
  AccountsListPage, 
  CreateAccountPage, 
  AccountDetailsRoute,
  EditAccountRoute
} from '@/modules/accounts'
import { 
  ContactsListPage, 
  CreateContactPage, 
  ContactDetailsRoute,
  EditContactRoute
} from '@/modules/contacts'
import { 
  LeadsListPage, 
  CreateLeadPage, 
  LeadDetailsRoute,
  EditLeadRoute
} from '@/modules/leads'
import { 
  DealsListPage, 
  CreateDealPage, 
  DealDetailsRoute,
  EditDealRoute
} from '@/modules/deals'

import { 
  InboxView
} from '@/modules/team_inbox'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AuthProvider>
        <ErrorBoundary>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              {/* Main CRM Application with Universal Sidebar */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                
                {/* Legacy Dashboard Routes - now integrated into main layout */}
                <Route
                  path="superadmin"
                  element={
                    <RoleBasedRoute requiredRole="superadmin">
                      <SuperAdminDashboard />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="tenant-admin"
                  element={
                    <RoleBasedRoute requiredRole="admin">
                      <TenantAdminDashboard />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="user"
                  element={
                    <RoleBasedRoute requiredRole="user">
                      <UserDashboard />
                    </RoleBasedRoute>
                  }
                />
                
                {/* Account Routes */}
                <Route
                  path="accounts"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_accounts', 'all']}>
                      <AccountsListPage />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="accounts/new"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_accounts', 'all']}>
                      <CreateAccountPage />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="accounts/:id"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_accounts', 'all']}>
                      <AccountDetailsRoute />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="accounts/:id/edit"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_accounts', 'all']}>
                      <EditAccountRoute />
                    </PermissionBasedRoute>
                  }
                />
                
                {/* Contact Routes */}
                <Route
                  path="contacts"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_contacts', 'all']}>
                      <ContactsListPage />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="contacts/new"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_contacts', 'all']}>
                      <CreateContactPage />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="contacts/:id"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_contacts', 'all']}>
                      <ContactDetailsRoute />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="contacts/:id/edit"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_contacts', 'all']}>
                      <EditContactRoute />
                    </PermissionBasedRoute>
                  }
                />
                
                {/* Lead Routes */}
                <Route
                  path="leads"
                  element={
                    <PermissionBasedRoute requiredPermissions={['all', 'manage_leads', 'view_customers', 'view_only', 'manage_contacts', 'manage_accounts', 'manage_team']}>
                      <LeadsListPage />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="leads/new"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_leads', 'all']}>
                      <CreateLeadPage />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="leads/:id"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_leads', 'all']}>
                      <LeadDetailsRoute />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="leads/:id/edit"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_leads', 'all']}>
                      <EditLeadRoute />
                    </PermissionBasedRoute>
                  }
                />
                
                {/* Deal Routes */}
                <Route
                  path="deals"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_opportunities', 'all']}>
                      <DealsListPage />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="deals/new"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_opportunities', 'all']}>
                      <CreateDealPage />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="deals/:dealId"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_opportunities', 'all']}>
                      <DealDetailsRoute />
                    </PermissionBasedRoute>
                  }
                />
                <Route
                  path="deals/:dealId/edit"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_opportunities', 'all']}>
                      <EditDealRoute />
                    </PermissionBasedRoute>
                  }
                />
                {/* Team Inbox Routes */}
                <Route
                  path="team_inbox"
                  element={
                    <PermissionBasedRoute requiredPermissions={['manage_opportunities', 'all']}>
                      <InboxView />
                    </PermissionBasedRoute>
                  }
                />
              </Route>
            </Routes>
            <Toaster position="top-right" />
            </div>
          </Router>
        </ErrorBoundary>
        </AuthProvider>
      </AppThemeProvider>
    </QueryClientProvider>
  )
}

export default App