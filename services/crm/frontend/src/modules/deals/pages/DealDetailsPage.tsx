import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDeal, useDealAccountInfo, useDealContacts, useDeleteDeal } from '../api'

export const DealDetailsPage: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>()
  const navigate = useNavigate()
  const dealIdNum = dealId ? parseInt(dealId) : 0

  const { data: deal, isLoading, error } = useDeal(dealIdNum)
  const { data: accountInfo } = useDealAccountInfo(dealIdNum)
  const { data: contacts } = useDealContacts(dealIdNum)
  const deleteDeal = useDeleteDeal()

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await deleteDeal.mutateAsync(dealIdNum)
        navigate('/deals')
      } catch (error) {
        console.error('Error deleting deal:', error)
      }
    }
  }

  const getStageColor = (stage: string) => {
    const colors = {
      'Prospecting': 'bg-blue-100 text-blue-800',
      'Qualification': 'bg-yellow-100 text-yellow-800',
      'Need Analysis': 'bg-purple-100 text-purple-800',
      'Value Proposition': 'bg-indigo-100 text-indigo-800',
      'Proposal': 'bg-orange-100 text-orange-800',
      'Negotiation': 'bg-red-100 text-red-800',
      'Closed Won': 'bg-green-100 text-green-800',
      'Closed Lost': 'bg-gray-100 text-gray-800'
    }
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDaysToClose = (closeDateString: string) => {
    const closeDate = new Date(closeDateString)
    const today = new Date()
    const timeDiff = closeDate.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysDiff
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error loading deal: {error?.message || 'Deal not found'}</p>
        </div>
      </div>
    )
  }

  const daysToClose = calculateDaysToClose(deal.close_date)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link
              to="/deals"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Deals
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{deal.deal_name}</h1>
          <p className="text-gray-500 mt-1">Deal ID: {deal.deal_id}</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/deals/${deal.deal_id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Edit Deal
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Delete Deal
          </button>
        </div>
      </div>

      {/* Deal Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Stage</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStageColor(deal.stage)}`}>
                {deal.stage}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Deal Value</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(deal.amount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Close Date</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(deal.close_date)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Days to Close</p>
              <p className={`text-lg font-semibold ${daysToClose < 0 ? 'text-red-600' : daysToClose < 30 ? 'text-orange-600' : 'text-gray-900'}`}>
                {daysToClose < 0 ? `${Math.abs(daysToClose)} days overdue` : `${daysToClose} days`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Deal Information</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Deal Name</label>
              <p className="mt-1 text-sm text-gray-900">{deal.deal_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Stage</label>
              <p className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(deal.stage)}`}>
                  {deal.stage}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Amount</label>
              <p className="mt-1 text-sm text-gray-900">{formatCurrency(deal.amount)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Close Date</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(deal.close_date)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Owner</label>
              <p className="mt-1 text-sm text-gray-900">
                {deal.owner_name || deal.deal_owner_alias || 'Not assigned'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Primary Contact</label>
              <p className="mt-1 text-sm text-gray-900">
                {deal.primary_contact_name ? (
                  <Link
                    to={`/contacts/${deal.primary_contact}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {deal.primary_contact_name}
                  </Link>
                ) : (
                  <span className="text-gray-400">No contact assigned</span>
                )}
              </p>
            </div>

            {deal.account_name && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Account Name (Alias)</label>
                <p className="mt-1 text-sm text-gray-900">{deal.account_name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
          </div>
          <div className="px-6 py-4">
            {accountInfo ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Name</label>
                  <p className="mt-1 text-sm text-gray-900">
                    <Link
                      to={`/accounts/${accountInfo.account.account_id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {accountInfo.account.account_name}
                    </Link>
                  </p>
                </div>

                {accountInfo.account.industry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Industry</label>
                    <p className="mt-1 text-sm text-gray-900">{accountInfo.account.industry}</p>
                  </div>
                )}

                {accountInfo.account.website && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Website</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <a
                        href={accountInfo.account.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {accountInfo.account.website}
                      </a>
                    </p>
                  </div>
                )}

                {accountInfo.account.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{accountInfo.account.phone}</p>
                  </div>
                )}

                {accountInfo.account.owner && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Account Owner</label>
                    <p className="mt-1 text-sm text-gray-900">{accountInfo.account.owner}</p>
                  </div>
                )}

                {(accountInfo.account.billing_city || accountInfo.account.billing_country) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Location</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {[accountInfo.account.billing_city, accountInfo.account.billing_country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No account information available</p>
            )}
          </div>
        </div>

        {/* Contacts Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Contacts</h3>
          </div>
          <div className="px-6 py-4">
            {contacts && contacts.contacts && contacts.contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.contacts.map((contact) => (
                  <div key={contact.contact_id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </h4>
                        {contact.title && <p className="text-sm text-gray-600">{contact.title}</p>}
                        <p className="text-sm text-gray-600">{contact.email}</p>
                        {contact.phone && <p className="text-sm text-gray-600">{contact.phone}</p>}
                      </div>
                      <button 
                        onClick={() => navigate(`/contacts/${contact.contact_id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : contacts?.error ? (
              <div className="text-center py-4 text-gray-500">
                <p>{contacts.error}</p>
                <p className="text-sm mt-2">This deal needs to be linked to an account to show contacts</p>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No contacts found for this deal's account</p>
                <p className="text-sm mt-2">Add contacts to the associated account to see them here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Information */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Audit Information</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">Created</label>
              <p className="mt-1 text-sm text-gray-900">
                {formatDateTime(deal.created_at)}
                {deal.created_by_name && (
                  <span className="text-gray-500"> by {deal.created_by_name}</span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">
                {formatDateTime(deal.updated_at)}
                {deal.updated_by_name && (
                  <span className="text-gray-500"> by {deal.updated_by_name}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}