import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLead, useLeadCompanyInfo, useDeleteLead, useConvertLeadEnhanced } from '../api'
import { LeadConversionModal } from '../components/LeadConversionModal'

interface LeadDetailsPageProps {
  leadId: number
}

export const LeadDetailsPage: React.FC<LeadDetailsPageProps> = ({ leadId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'company' | 'activity'>('overview')
  const [showConversionModal, setShowConversionModal] = useState(false)
  const navigate = useNavigate()
  
  const { data: lead, isLoading, error } = useLead(leadId)
  const { data: companyInfo } = useLeadCompanyInfo(leadId)
  const deleteLead = useDeleteLead()
  const convertLead = useConvertLeadEnhanced()

  const handleDelete = async () => {
    if (!lead) return
    
    if (window.confirm(`Are you sure you want to delete "${lead.first_name} ${lead.last_name}"?`)) {
      try {
        await deleteLead.mutateAsync(leadId)
        alert('Lead deleted successfully')
        navigate('/leads')
      } catch (error) {
        alert(`Error deleting lead: ${error}`)
      }
    }
  }

  const handleConvert = () => {
    setShowConversionModal(true)
  }

  const handleConversionSubmit = async (conversionData: any) => {
    try {
      const result = await convertLead.mutateAsync({ 
        id: leadId, 
        conversionData 
      })
      
      alert(`Lead converted successfully! Created: ${result.account?.account_name}${result.deal ? `, ${result.deal.deal_name}` : ''}`)
      navigate('/leads')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
      alert(`Error converting lead: ${errorMessage}`)
      console.error('Conversion error:', error)
    } finally {
      setShowConversionModal(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'proposal': return 'bg-purple-100 text-purple-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) return <div className="p-6">Loading lead...</div>
  if (error) return <div className="p-6 text-red-600">Error loading lead: {error.message}</div>
  if (!lead) return <div className="p-6 text-gray-600">Lead not found</div>

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {lead.first_name.charAt(0).toUpperCase()}{lead.last_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {lead.first_name} {lead.last_name}
                </h1>
                <p className="text-gray-600">{lead.title || 'No title specified'}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.lead_status)}`}>
                    {lead.lead_status || 'N/A'}
                  </span>
                  {lead.score !== null && lead.score !== undefined && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Score:</span>
                      <span className="text-sm font-medium">{lead.score}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/leads/${leadId}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleConvert}
                disabled={convertLead.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {convertLead.isPending ? 'Converting...' : 'Convert'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLead.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteLead.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {(['overview', 'company', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-lg">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{lead.first_name} {lead.last_name}</p>
                  </div>
                  {lead.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <a 
                        href={`mailto:${lead.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <a 
                        href={`tel:${lead.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {lead.phone}
                      </a>
                    </div>
                  )}
                  {lead.title && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-gray-900">{lead.title}</p>
                    </div>
                  )}
                  {lead.company_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company</label>
                      <p className="text-gray-900">{lead.company_name}</p>
                    </div>
                  )}
                  {lead.lead_owner_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Lead Owner</label>
                      <p className="text-gray-900">{lead.lead_owner_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="space-y-3">
                  {lead.lead_source && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Lead Source</label>
                      <p className="text-gray-900">{lead.lead_source}</p>
                    </div>
                  )}
                  {lead.industry && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Industry</label>
                      <p className="text-gray-900">{lead.industry}</p>
                    </div>
                  )}
                  {lead.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Website</label>
                      <a 
                        href={lead.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {lead.website}
                      </a>
                    </div>
                  )}
                  {lead.number_of_employees && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Employees</label>
                      <p className="text-gray-900">{lead.number_of_employees.toLocaleString()}</p>
                    </div>
                  )}
                  {lead.average_revenue && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Average Revenue</label>
                      <p className="text-gray-900">${lead.average_revenue.toLocaleString()}</p>
                    </div>
                  )}
                  {lead.score !== null && lead.score !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Lead Score</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900">{lead.score}/100</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            {(lead.street || lead.city || lead.country) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                <div className="text-gray-900">
                  {lead.street && <p>{lead.street}</p>}
                  <p>
                    {lead.city && `${lead.city}, `}
                    {lead.state && `${lead.state} `}
                    {lead.postal_code}
                  </p>
                  {lead.country && <p>{lead.country}</p>}
                </div>
              </div>
            )}

            {/* Description */}
            {lead.description && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{lead.description}</p>
              </div>
            )}

            {/* Audit Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">
                    {new Date(lead.created_at).toLocaleDateString()} at {new Date(lead.created_at).toLocaleTimeString()}
                    {lead.created_by_name && ` by ${lead.created_by_name}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">
                    {new Date(lead.updated_at).toLocaleDateString()} at {new Date(lead.updated_at).toLocaleTimeString()}
                    {lead.updated_by_name && ` by ${lead.updated_by_name}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
            </div>

            {companyInfo && companyInfo.company ? (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-medium text-gray-900">
                      {companyInfo.company.account_name}
                    </h4>
                    <p className="text-sm text-gray-600">Account ID: {companyInfo.company.account_id}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/accounts/${companyInfo.company.account_id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Account Details
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyInfo.company.industry && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Industry</label>
                      <p className="text-gray-900">{companyInfo.company.industry}</p>
                    </div>
                  )}
                  {companyInfo.company.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Website</label>
                      <a 
                        href={companyInfo.company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {companyInfo.company.website}
                      </a>
                    </div>
                  )}
                  {companyInfo.company.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <a 
                        href={`tel:${companyInfo.company.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {companyInfo.company.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>This lead is not associated with any company</p>
                <p className="text-sm mt-2">Leads can be linked to accounts for better organization</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
            </div>

            <div className="text-center py-8 text-gray-500">
              <p>Activity timeline coming soon</p>
              <p className="text-sm mt-2">This will show lead interactions, emails, calls, and notes</p>
            </div>
          </div>
        )}
      </div>

      {/* Conversion Modal */}
      {lead && (
        <LeadConversionModal
          lead={lead}
          isOpen={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          onConvert={handleConversionSubmit}
          isConverting={convertLead.isPending}
        />
      )}
    </div>
  )
}