import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeals, useDeleteDeal, type Deal, type DealListItem } from '../api'
import { DealFormModal } from '../components/DealFormModal'
import { DataTable, TableControls, ColumnManager, PrimaryLinkCell, ValueCell, BadgeCell, DateCell, useColumnVisibility, type ColumnConfig, type ActionConfig } from '@/shared'

export const DealsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [selectedDeals, setSelectedDeals] = useState<number[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | undefined>(undefined)

  const { data: dealsData, isLoading, error, refetch } = useDeals()
  const deleteDeal = useDeleteDeal()

  const deals = dealsData?.results || []

  // Filter deals based on search term and stage
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = !searchTerm || 
      deal.deal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.account_name_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.primary_contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStage = !stageFilter || deal.stage === stageFilter
    return matchesSearch && matchesStage
  })

  const handleDelete = async (deal: DealListItem) => {
    if (window.confirm(`Are you sure you want to delete "${deal.deal_name}"?`)) {
      try {
        await deleteDeal.mutateAsync(deal.deal_id)
        alert('Deal deleted successfully')
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'
        alert(`Error deleting deal: ${errorMessage}`)
      }
    }
  }

  const handleEdit = (deal: DealListItem) => {
    setSelectedDeal(deal as Deal)
    setModalOpen(true)
  }

  const handleNew = () => {
    setSelectedDeal(undefined)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedDeal(undefined)
  }

  const handleModalSuccess = () => {
    setModalOpen(false)
    setSelectedDeal(undefined)
    refetch()
  }

  const handleSelectionChange = (selectedItems: DealListItem[]) => {
    setSelectedDeals(selectedItems.map(deal => deal.deal_id))
  }

  const handleBulkDelete = async () => {
    if (selectedDeals.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedDeals.length} deals?`)) {
      try {
        for (const dealId of selectedDeals) {
          await deleteDeal.mutateAsync(dealId)
        }
        alert(`${selectedDeals.length} deals deleted successfully`)
        setSelectedDeals([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'
        alert(`Error deleting deals: ${errorMessage}`)
      }
    }
  }


  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Prospecting':
        return 'blue'
      case 'Qualification':
        return 'yellow'
      case 'Proposal':
        return 'purple'
      case 'Negotiation':
        return 'orange'
      case 'Closed Won':
        return 'green'
      case 'Closed Lost':
        return 'red'
      default:
        return 'gray'
    }
  }

  // DataTable column configuration
  const columns: ColumnConfig<DealListItem>[] = [
    {
      key: 'deal_name',
      title: 'Deal Name',
      sortable: true,
      render: (_, deal) => (
        <div>
          <PrimaryLinkCell 
            text={deal.deal_name}
            onClick={() => navigate(`/deals/${deal.deal_id}`)}
          />
          {deal.account_name_display && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {deal.account_name_display}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'stage',
      title: 'Stage',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value || 'Prospecting'} 
          variant={getStageColor(value || 'Prospecting') as any}
        />
      )
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      render: (value) => <ValueCell value={value} />,
      align: 'right'
    },
    {
      key: 'close_date',
      title: 'Close Date',
      sortable: true,
      render: (value) => value ? <DateCell value={value} /> : 'N/A'
    },
    {
      key: 'owner_name',
      title: 'Owner',
      sortable: true,
      render: (value) => value || 'Unassigned'
    },
    {
      key: 'primary_contact_name',
      title: 'Primary Contact',
      sortable: true,
      render: (value) => value || 'No contact'
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => <DateCell value={value} />
    }
  ]

  // DataTable action configuration
  const actions: ActionConfig<DealListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (deal) => navigate(`/deals/${deal.deal_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (deal) => handleEdit(deal),
      variant: 'default'
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (deal) => handleDelete(deal),
      variant: 'danger'
    }
  ]

  // Column visibility management
  const {
    columnVisibility,
    updateColumnVisibility
  } = useColumnVisibility(columns, {
    storageKey: 'deals-list',
    defaultVisible: ['deal_name', 'account_name', 'deal_value', 'stage', 'owner_name', 'created_at']
  })

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">

      {/* Controls */}
      <TableControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search deals..."
        filters={
          <>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stages</option>
              <option value="Prospecting">Prospecting</option>
              <option value="Qualification">Qualification</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredDeals.length} of {deals.length} deals
            </span>
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <ColumnManager
              columns={columns}
              visibleColumns={columnVisibility}
              onVisibilityChange={updateColumnVisibility}
            />
            {selectedDeals.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Delete Selected ({selectedDeals.length})
              </button>
            )}
            <button
              onClick={handleNew}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              + New Deal
            </button>
          </div>
        }
      />

      {/* DataTable */}
      <DataTable
        data={filteredDeals}
        columns={columns}
        actions={actions}
        keyExtractor={(deal) => deal.deal_id.toString()}
        loading={isLoading}
        error={error ? String(error) : undefined}
        searchTerm={searchTerm}
        showSelection={true}
        onSelectionChange={handleSelectionChange}
        columnVisibility={columnVisibility}
        emptyMessage="No deals found. Try adjusting your search or filters."
      />

      {/* Deal Form Modal */}
      <DealFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        deal={selectedDeal}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}