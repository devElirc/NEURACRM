import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useDeleteLead, type LeadListItem, type Lead } from '../api'
import { usePermissions } from '@/auth/usePermissions'
import { LeadFormModal } from '../components/LeadFormModal'
import { DataTable, TableControls, ColumnManager, BadgeCell, DateCell, ContactInfoCell, PrimaryLinkCell, useColumnVisibility, type ColumnConfig, type ActionConfig } from '@/shared'

export const LeadsListPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLeadItems, setSelectedLeadItems] = useState<LeadListItem[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined)
  const navigate = useNavigate()
  const permissions = usePermissions()
  
  const { data: leadsData, isLoading, error, refetch } = useLeads(currentPage, pageSize)
  const deleteLead = useDeleteLead()
  
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteLead.mutateAsync(id)
        alert('Lead deleted successfully')
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'
        alert(`Error deleting lead: ${errorMessage}`)
      }
    }
  }


  const handleNewLead = () => {
    setSelectedLead(undefined)
    setModalOpen(true)
  }

  const handleEditLead = (lead: LeadListItem) => {
    // Convert LeadListItem to Lead type for the modal
    const leadForEdit: Lead = {
      ...lead,
      tenant: 0, // This will be set by the backend
      tenant_name: lead.tenant_name || '',
      company: undefined,
      company_name: lead.company_name,
      website: '',
      description: '',
      score: lead.score,
      lead_owner: lead.lead_owner,
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      number_of_employees: undefined,
      average_revenue: undefined,
      created_by: lead.created_by,
      created_by_name: '',
      updated_by: undefined,
      updated_by_name: '',
    }
    setSelectedLead(leadForEdit)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedLead(undefined)
  }

  const handleModalSuccess = () => {
    setModalOpen(false)
    setSelectedLead(undefined)
    refetch()
  }

  const handleSelectionChange = (selectedItems: LeadListItem[]) => {
    setSelectedLeadItems(selectedItems)
  }

  const handleBulkDelete = async () => {
    if (selectedLeadItems.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedLeadItems.length} leads?`)) {
      try {
        for (const lead of selectedLeadItems) {
          await deleteLead.mutateAsync(lead.lead_id)
        }
        alert(`${selectedLeadItems.length} leads deleted successfully`)
        setSelectedLeadItems([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'
        alert(`Error deleting leads: ${errorMessage}`)
      }
    }
  }

  const leads = leadsData?.results || []

  // DataTable column configuration
  const columns: ColumnConfig<LeadListItem>[] = [
    {
      key: 'full_name',
      title: 'Lead Name',
      sortable: true,
      render: (_, lead) => (
        <div>
          <PrimaryLinkCell 
            text={lead.full_name}
            onClick={() => navigate(`/leads/${lead.lead_id}`)}
          />
          {lead.company_name && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {lead.company_name}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'lead_status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value || 'New'} 
          variant="green"
        />
      )
    },
    {
      key: 'contact',
      title: 'Contact',
      render: (_, lead) => (
        <ContactInfoCell 
          email={lead.email}
          phone={lead.phone}
        />
      )
    },
    {
      key: 'lead_source',
      title: 'Source',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value || 'Unknown'} 
          variant="blue"
        />
      )
    },
    {
      key: 'lead_owner_name',
      title: 'Owner',
      sortable: true,
      render: (value) => value || 'Unassigned'
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => <DateCell value={value} />
    }
  ]

  // DataTable action configuration
  const actions: ActionConfig<LeadListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (lead) => navigate(`/leads/${lead.lead_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (lead) => handleEditLead(lead),
      variant: 'default',
      hidden: (lead) => !permissions.canManageLeads || lead.lead_status === 'converted'
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (lead) => handleDelete(lead.lead_id, lead.full_name),
      variant: 'danger',
      hidden: () => !permissions.canManageLeads
    }
  ]

  const canCreateLeads = permissions.canManageLeads

  // Column visibility management
  const {
    columnVisibility,
    updateColumnVisibility
  } = useColumnVisibility(columns, {
    storageKey: 'leads-list',
    defaultVisible: ['first_name', 'company', 'lead_status', 'lead_source', 'phone', 'created_at']
  })

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      {/* Controls */}
      <TableControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search leads..."
        filters={
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {leads.length} of {leadsData?.count} leads
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ColumnManager
              columns={columns}
              visibleColumns={columnVisibility}
              onVisibilityChange={updateColumnVisibility}
            />
            {selectedLeadItems.length > 0 && permissions.canManageLeads && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Delete Selected ({selectedLeadItems.length})
              </button>
            )}
            {canCreateLeads && (
              <button
                onClick={handleNewLead}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                + New Lead
              </button>
            )}
          </div>
        }
      />
      
      {/* DataTable */}
      <DataTable
        data={leads}
        columns={columns}
        actions={actions}
        keyExtractor={(lead) => lead.lead_id.toString()}
        loading={isLoading}
        error={error ? String(error) : undefined}
        searchTerm={searchTerm}
        showSelection={true}
        onSelectionChange={handleSelectionChange}
        columnVisibility={columnVisibility}
        emptyMessage="No leads found. Try adjusting your search or filters."
      />

      {/* Pagination */}
      {leadsData && leadsData.count > pageSize && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {Math.ceil(leadsData.count / pageSize)}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(leadsData.count / pageSize)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        lead={selectedLead}
      />
    </div>
  )
}