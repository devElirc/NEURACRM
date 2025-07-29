import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccounts, useDeleteAccount, type AccountListItem, type Account } from '../api'
import { AccountFormModal } from '../components/AccountFormModal'
import { DataTable, TableControls, ColumnManager, PrimaryLinkCell, LinkCell, DateCell, useColumnVisibility, type ColumnConfig, type ActionConfig } from '@/shared'

export const AccountsListPage: React.FC = () => {
  const [currentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccountItems, setSelectedAccountItems] = useState<AccountListItem[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>(undefined)
  const navigate = useNavigate()
  
  const { data: accountsData, isLoading, error, refetch } = useAccounts(currentPage, pageSize)
  const deleteAccount = useDeleteAccount()
  
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteAccount.mutateAsync(id)
        alert('Account deleted successfully')
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'
        alert(`Error deleting account: ${errorMessage}`)
      }
    }
  }

  const handleNewAccount = () => {
    setSelectedAccount(undefined)
    setModalOpen(true)
  }

  const handleEditAccount = (account: AccountListItem) => {
    // Convert AccountListItem to Account shape for modal (if needed)
    setSelectedAccount({ ...account } as Account)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedAccount(undefined)
  }

  const handleModalSuccess = () => {
    setModalOpen(false)
    setSelectedAccount(undefined)
    refetch()
  }

  const handleSelectionChange = (selectedItems: AccountListItem[]) => {
    setSelectedAccountItems(selectedItems)
  }

  const handleBulkDelete = async () => {
    if (selectedAccountItems.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedAccountItems.length} accounts?`)) {
      try {
        for (const account of selectedAccountItems) {
          await deleteAccount.mutateAsync(account.account_id)
        }
        alert(`${selectedAccountItems.length} accounts deleted successfully`)
        setSelectedAccountItems([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'
        alert(`Error deleting accounts: ${errorMessage}`)
      }
    }
  }

  const accounts = accountsData?.results || []

  // DataTable column configuration
  const columns: ColumnConfig<AccountListItem>[] = [
    {
      key: 'account_name',
      title: 'Account Name',
      sortable: true,
      render: (_, account) => (
        <div>
          <PrimaryLinkCell 
            text={account.account_name}
            onClick={() => navigate(`/accounts/${account.account_id}`)}
          />
          {account.parent_account_name && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Parent: {account.parent_account_name}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'industry',
      title: 'Industry',
      sortable: true,
      render: (value) => (
        <span className="text-gray-900 dark:text-gray-100">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'owner_name',
      title: 'Owner',
      sortable: true,
      render: (value) => value || 'Unassigned'
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (value) => value || 'N/A'
    },
    {
      key: 'website',
      title: 'Website',
      render: (value) => value ? <LinkCell value={value} type="url" /> : 'N/A'
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => <DateCell value={value} />
    }
  ]

  // DataTable action configuration
  const actions: ActionConfig<AccountListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (account) => navigate(`/accounts/${account.account_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (account) => handleEditAccount(account),
      variant: 'default'
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (account) => handleDelete(account.account_id, account.account_name),
      variant: 'danger'
    }
  ]

  // Column visibility management
  const {
    columnVisibility,
    updateColumnVisibility
  } = useColumnVisibility(columns, {
    storageKey: 'accounts-list',
    defaultVisible: ['account_name', 'industry', 'owner_name', 'created_at']
  })
  
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      {/* Controls */}
      <TableControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search accounts..."
        filters={
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {accounts.length} of {accountsData?.count} accounts
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ColumnManager
              columns={columns}
              visibleColumns={columnVisibility}
              onVisibilityChange={updateColumnVisibility}
            />
            {selectedAccountItems.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Delete Selected ({selectedAccountItems.length})
              </button>
            )}
            <button
              onClick={handleNewAccount}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              + New Account
            </button>
          </div>
        }
      />
      
      {/* DataTable */}
      <DataTable
        data={accounts}
        columns={columns}
        actions={actions}
        keyExtractor={(account) => account.account_id.toString()}
        loading={isLoading}
        error={error ? String(error) : undefined}
        searchTerm={searchTerm}
        showSelection={true}
        onSelectionChange={handleSelectionChange}
        columnVisibility={columnVisibility}
        emptyMessage="No accounts found. Try adjusting your search or filters."
      />
      {/* Account Form Modal */}
      <AccountFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        account={selectedAccount}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}