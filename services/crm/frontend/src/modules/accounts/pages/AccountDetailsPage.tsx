import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useAccountContacts, useAccountDeals, useDeleteAccount } from '../api'
import { ContactFormModal } from '@/modules/contacts'
import { DealFormModal } from '@/modules/deals'
import { showErrorMessage } from '@/utils/error'

interface AccountDetailsPageProps {
  accountId: number
}

export const AccountDetailsPage: React.FC<AccountDetailsPageProps> = ({ accountId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals'>('overview')
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isDealModalOpen, setIsDealModalOpen] = useState(false)
  const navigate = useNavigate()
  
  const { data: account, isLoading, error } = useAccount(accountId)
  const { data: contacts } = useAccountContacts(accountId)
  const { data: deals } = useAccountDeals(accountId)
  const deleteAccount = useDeleteAccount()

  const handleDelete = async () => {
    if (!account) return
    
    if (window.confirm(`Are you sure you want to delete "${account.account_name}"?`)) {
      try {
        await deleteAccount.mutateAsync(accountId)
        alert('Account deleted successfully')
        navigate('/accounts')
      } catch (error: any) {
        showErrorMessage(error, 'deleting account')
      }
    }
  }

  const handleAddContact = () => {
    setIsContactModalOpen(true)
  }

  const handleAddDeal = () => {
    setIsDealModalOpen(true)
  }

  const handleContactSuccess = () => {
    setIsContactModalOpen(false)
    // Refresh contacts data - this will trigger automatically via React Query
  }

  const handleDealSuccess = () => {
    setIsDealModalOpen(false)
    // Refresh deals data - this will trigger automatically via React Query
  }

  if (isLoading) return <div className="p-6">Loading account...</div>
  if (error) return <div className="p-6 text-red-600">Error loading account: {error.message}</div>
  if (!account) return <div className="p-6 text-gray-600">Account not found</div>

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {account.account_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{account.account_name}</h1>
                <p className="text-gray-600 dark:text-gray-400">{account.industry || 'No industry specified'}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/accounts/${accountId}/edit`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteAccount.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {deleteAccount.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-600">
          <nav className="flex space-x-8 px-6">
            {(['overview', 'contacts', 'deals'] as const).map((tab) => (
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
                {tab === 'contacts' && contacts && ` (${contacts.count})`}
                {tab === 'deals' && deals && ` (${deals.count})`}
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
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Name</label>
                    <p className="text-gray-900 dark:text-white">{account.account_name}</p>
                  </div>
                  {account.account_owner_alias && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner Alias</label>
                      <p className="text-gray-900 dark:text-white">{account.account_owner_alias}</p>
                    </div>
                  )}
                  {account.industry && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Industry</label>
                      <p className="text-gray-900 dark:text-white">{account.industry}</p>
                    </div>
                  )}
                  {account.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</label>
                      <a 
                        href={account.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {account.website}
                      </a>
                    </div>
                  )}
                  {account.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white">{account.phone}</p>
                    </div>
                  )}
                  {account.owner_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner</label>
                      <p className="text-gray-900 dark:text-white">{account.owner_name}</p>
                    </div>
                  )}
                  {account.parent_account_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Parent Account</label>
                      <p className="text-gray-900 dark:text-white">{account.parent_account_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="space-y-4">
                  {/* Billing Address */}
                  {(account.billing_street || account.billing_city || account.billing_country) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Billing Address</label>
                      <div className="text-gray-900 dark:text-white">
                        {account.billing_street && <p>{account.billing_street}</p>}
                        <p>
                          {account.billing_city && `${account.billing_city}, `}
                          {account.billing_state_province && `${account.billing_state_province} `}
                          {account.billing_zip_postal_code}
                        </p>
                        {account.billing_country && <p>{account.billing_country}</p>}
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  {(account.shipping_street || account.shipping_city || account.shipping_country) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Shipping Address</label>
                      <div className="text-gray-900 dark:text-white">
                        {account.shipping_street && <p>{account.shipping_street}</p>}
                        <p>
                          {account.shipping_city && `${account.shipping_city}, `}
                          {account.shipping_state_province && `${account.shipping_state_province} `}
                          {account.shipping_zip_postal_code}
                        </p>
                        {account.shipping_country && <p>{account.shipping_country}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {account.description && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{account.description}</p>
              </div>
            )}

            {/* Audit Information */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Audit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(account.created_at).toLocaleDateString()} at {new Date(account.created_at).toLocaleTimeString()}
                    {account.created_by_name && ` by ${account.created_by_name}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(account.updated_at).toLocaleDateString()} at {new Date(account.updated_at).toLocaleTimeString()}
                    {account.updated_by_name && ` by ${account.updated_by_name}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contacts</h3>
              <button 
                onClick={handleAddContact}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                + Add Contact
              </button>
            </div>

            {contacts && contacts.contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.contacts.map((contact: any) => (
                  <div key={contact.contact_id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {contact.first_name} {contact.last_name}
                        </h4>
                        {contact.title && <p className="text-sm text-gray-600 dark:text-gray-400">{contact.title}</p>}
                        <p className="text-sm text-gray-600 dark:text-gray-400">{contact.email}</p>
                        {contact.phone && <p className="text-sm text-gray-600 dark:text-gray-400">{contact.phone}</p>}
                      </div>
                      <button 
                        onClick={() => navigate(`/contacts/${contact.contact_id}`)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No contacts found for this account</p>
                <p className="text-sm mt-2">Add the first contact to get started</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deals</h3>
              <button 
                onClick={handleAddDeal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                + Add Deal
              </button>
            </div>

            {deals && deals.deals.length > 0 ? (
              <div className="space-y-4">
                {deals.deals.map((deal: any) => (
                  <div key={deal.deal_id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{deal.deal_name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Stage: {deal.stage}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Amount: ${deal.amount}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Close Date: {new Date(deal.close_date).toLocaleDateString()}</p>
                        {deal.owner && <p className="text-sm text-gray-600 dark:text-gray-400">Owner: {deal.owner}</p>}
                      </div>
                      <button 
                        onClick={() => navigate(`/deals/${deal.deal_id}`)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No deals found for this account</p>
                <p className="text-sm mt-2">Add the first deal to get started</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modals */}
      <ContactFormModal 
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        initialAccount={account ? { id: accountId, name: account.account_name } : undefined}
        onSuccess={handleContactSuccess}
      />
      
      <DealFormModal 
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        initialAccount={account ? { id: accountId, name: account.account_name } : undefined}
        onSuccess={handleDealSuccess}
      />
    </div>
  )
}