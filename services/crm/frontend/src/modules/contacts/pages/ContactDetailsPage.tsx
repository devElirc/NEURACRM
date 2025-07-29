import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContact, useContactAccountInfo, useContactReportees, useContactDeals, useDeleteContact } from '../api'
import { DealFormModal } from '@/modules/deals'

interface ContactDetailsPageProps {
  contactId: number
}

export const ContactDetailsPage: React.FC<ContactDetailsPageProps> = ({ contactId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'account' | 'deals' | 'reportees'>('overview')
  const [isDealModalOpen, setIsDealModalOpen] = useState(false)
  const navigate = useNavigate()
  
  const { data: contact, isLoading, error } = useContact(contactId)
  const { data: accountInfo } = useContactAccountInfo(contactId)
  const { data: deals } = useContactDeals(contactId)
  const { data: reportees } = useContactReportees(contactId)
  const deleteContact = useDeleteContact()

  const handleDelete = async () => {
    if (!contact) return
    
    if (window.confirm(`Are you sure you want to delete "${contact.first_name} ${contact.last_name}"?`)) {
      try {
        await deleteContact.mutateAsync(contactId)
        alert('Contact deleted successfully')
        navigate('/contacts')
      } catch (error) {
        alert(`Error deleting contact: ${error}`)
      }
    }
  }

  const handleAddDeal = () => {
    setIsDealModalOpen(true)
  }

  const handleDealSuccess = () => {
    setIsDealModalOpen(false)
    // Refresh deals data - this will trigger automatically via React Query
  }

  if (isLoading) return <div className="p-6">Loading contact...</div>
  if (error) return <div className="p-6 text-red-600">Error loading contact: {error.message}</div>
  if (!contact) return <div className="p-6 text-gray-600">Contact not found</div>

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {contact.first_name.charAt(0).toUpperCase()}{contact.last_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contact.first_name} {contact.last_name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{contact.title || 'No title specified'}</p>
                <p className="text-gray-600 dark:text-gray-400">{contact.email}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/contacts/${contactId}/edit`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteContact.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {deleteContact.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-600">
          <nav className="flex space-x-8 px-6">
            {(['overview', 'account', 'deals', 'reportees'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'deals' && deals && ` (${deals.count})`}
                {tab === 'reportees' && reportees && ` (${reportees.count})`}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                    <p className="text-gray-900 dark:text-white">{contact.first_name} {contact.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <a 
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {contact.email}
                    </a>
                  </div>
                  {contact.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <a 
                        href={`tel:${contact.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.title && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-gray-900">{contact.title}</p>
                    </div>
                  )}
                  {contact.account_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Account</label>
                      <p className="text-gray-900">{contact.account_name}</p>
                    </div>
                  )}
                  {contact.reports_to_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reports To</label>
                      <p className="text-gray-900">{contact.reports_to_name}</p>
                    </div>
                  )}
                  {contact.owner_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Owner</label>
                      <p className="text-gray-900">{contact.owner_name}</p>
                    </div>
                  )}
                  {contact.contact_owner_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Owner</label>
                      <p className="text-gray-900">{contact.contact_owner_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mailing Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mailing Address</h3>
                <div className="space-y-4">
                  {(contact.mailing_street || contact.mailing_city || contact.mailing_country) ? (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <div className="text-gray-900">
                        {contact.mailing_street && <p>{contact.mailing_street}</p>}
                        <p>
                          {contact.mailing_city && `${contact.mailing_city}, `}
                          {contact.mailing_state && `${contact.mailing_state} `}
                          {contact.postal_code}
                        </p>
                        {contact.mailing_country && <p>{contact.mailing_country}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">No mailing address specified</div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {contact.description && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{contact.description}</p>
              </div>
            )}

            {/* Audit Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">
                    {new Date(contact.created_at).toLocaleDateString()} at {new Date(contact.created_at).toLocaleTimeString()}
                    {contact.created_by_name && ` by ${contact.created_by_name}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">
                    {new Date(contact.updated_at).toLocaleDateString()} at {new Date(contact.updated_at).toLocaleTimeString()}
                    {contact.updated_by_name && ` by ${contact.updated_by_name}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            </div>

            {accountInfo ? (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-medium text-gray-900">
                      {accountInfo.account.account_name}
                    </h4>
                    <p className="text-sm text-gray-600">Account ID: {accountInfo.account.account_id}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/accounts/${accountInfo.account.account_id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Account Details
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accountInfo.account.industry && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Industry</label>
                      <p className="text-gray-900">{accountInfo.account.industry}</p>
                    </div>
                  )}
                  {accountInfo.account.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Website</label>
                      <a 
                        href={accountInfo.account.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {accountInfo.account.website}
                      </a>
                    </div>
                  )}
                  {accountInfo.account.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <a 
                        href={`tel:${accountInfo.account.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {accountInfo.account.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>This contact is not associated with any account</p>
                <p className="text-sm mt-2">Contacts can be linked to accounts for better organization</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Deals</h3>
              {contact?.account ? (
                <button 
                  onClick={handleAddDeal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  + Add Deal
                </button>
              ) : (
                <div className="text-sm text-gray-500">
                  Contact must be linked to an account to create deals
                </div>
              )}
            </div>

            {deals && deals.deals.length > 0 ? (
              <div className="space-y-4">
                {deals.deals.map((deal: any) => (
                  <div key={deal.deal_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{deal.deal_name}</h4>
                        <p className="text-sm text-gray-600">Stage: {deal.stage}</p>
                        <p className="text-sm text-gray-600">Amount: ${deal.amount}</p>
                        <p className="text-sm text-gray-600">Close Date: {new Date(deal.close_date).toLocaleDateString()}</p>
                        {deal.owner && <p className="text-sm text-gray-600">Owner: {deal.owner}</p>}
                      </div>
                      <button 
                        onClick={() => navigate(`/deals/${deal.deal_id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {deals?.message ? (
                  <>
                    <p>{deals.message}</p>
                    <p className="text-sm mt-2">Link this contact to an account to create deals</p>
                  </>
                ) : (
                  <>
                    <p>No deals found for this contact's account</p>
                    <p className="text-sm mt-2">Add the first deal to get started</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reportees' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Direct Reports</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                + Add Reportee
              </button>
            </div>

            {reportees && reportees.reportees.length > 0 ? (
              <div className="space-y-4">
                {reportees.reportees.map((reportee: any) => (
                  <div key={reportee.contact_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {reportee.first_name.charAt(0).toUpperCase()}{reportee.last_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {reportee.first_name} {reportee.last_name}
                          </h4>
                          {reportee.title && <p className="text-sm text-gray-600">{reportee.title}</p>}
                          <p className="text-sm text-gray-600">{reportee.email}</p>
                          {reportee.phone && <p className="text-sm text-gray-600">{reportee.phone}</p>}
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/contacts/${reportee.contact_id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No direct reports found for this contact</p>
                <p className="text-sm mt-2">Add reportees to show organizational structure</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deal Modal */}
      {contact?.account && (
        <DealFormModal 
          isOpen={isDealModalOpen}
          onClose={() => setIsDealModalOpen(false)}
          initialAccount={contact.account ? { id: contact.account, name: contact.account_name || '' } : undefined}
          onSuccess={handleDealSuccess}
        />
      )}
    </div>
  )
}