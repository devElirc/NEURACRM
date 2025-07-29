import React, { useState, useEffect } from 'react'
import { Lead } from '../api'

interface ConversionData {
  account_data: {
    account_name: string
    industry?: string
    website?: string
    phone?: string
    street?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
    number_of_employees?: number
    description?: string
  }
  contact_data: {
    first_name: string
    last_name: string
    title?: string
    email?: string
    phone?: string
    street?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
  }
  create_deal: boolean
  deal_data?: {
    deal_name: string
    stage: string
    amount?: number
    close_date?: string
    description?: string
  }
}

interface LeadConversionModalProps {
  lead: Lead
  isOpen: boolean
  onClose: () => void
  onConvert: (data: ConversionData) => Promise<void>
  isConverting: boolean
}

const DEAL_STAGES = [
  'Prospecting',
  'Qualification', 
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
]

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({
  lead,
  isOpen,
  onClose,
  onConvert,
  isConverting
}) => {
  const [conversionData, setConversionData] = useState<ConversionData>({
    account_data: {
      account_name: '',
      industry: '',
      website: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      number_of_employees: undefined,
      description: ''
    },
    contact_data: {
      first_name: '',
      last_name: '',
      title: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    },
    create_deal: true,
    deal_data: {
      deal_name: '',
      stage: 'Prospecting',
      amount: undefined,
      close_date: '',
      description: ''
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-fill form data when modal opens
  useEffect(() => {
    if (isOpen && lead) {
      const defaultCloseDate = new Date()
      defaultCloseDate.setMonth(defaultCloseDate.getMonth() + 3)
      
      setConversionData({
        account_data: {
          account_name: lead.company_name || `${lead.first_name} ${lead.last_name} Company`,
          industry: lead.industry || '',
          website: lead.website || '',
          phone: lead.phone || '',
          street: lead.street || '',
          city: lead.city || '',
          state: lead.state || '',
          country: lead.country || '',
          postal_code: lead.postal_code || '',
          number_of_employees: lead.number_of_employees || undefined,
          description: lead.description || ''
        },
        contact_data: {
          first_name: lead.first_name,
          last_name: lead.last_name,
          title: lead.title || '',
          email: lead.email || '',
          phone: lead.phone || '',
          street: lead.street || '',
          city: lead.city || '',
          state: lead.state || '',
          country: lead.country || '',
          postal_code: lead.postal_code || ''
        },
        create_deal: true,
        deal_data: {
          deal_name: `Deal for ${lead.first_name} ${lead.last_name}`,
          stage: 'Prospecting',
          amount: undefined,
          close_date: defaultCloseDate.toISOString().split('T')[0],
          description: lead.description || ''
        }
      })
      setErrors({})
    }
  }, [isOpen, lead])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Account validation
    if (!conversionData.account_data.account_name.trim()) {
      newErrors.account_name = 'Account name is required'
    }

    // Contact validation
    if (!conversionData.contact_data.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }
    if (!conversionData.contact_data.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    // Deal validation (if creating deal)
    if (conversionData.create_deal && conversionData.deal_data) {
      if (!conversionData.deal_data.deal_name.trim()) {
        newErrors.deal_name = 'Deal name is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onConvert(conversionData)
    } catch (error) {
      console.error('Conversion error:', error)
    }
  }

  const updateAccountData = (field: string, value: any) => {
    setConversionData(prev => ({
      ...prev,
      account_data: {
        ...prev.account_data,
        [field]: value
      }
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const updateContactData = (field: string, value: any) => {
    setConversionData(prev => ({
      ...prev,
      contact_data: {
        ...prev.contact_data,
        [field]: value
      }
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const updateDealData = (field: string, value: any) => {
    setConversionData(prev => ({
      ...prev,
      deal_data: {
        ...prev.deal_data!,
        [field]: value
      }
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleCreateDeal = () => {
    setConversionData(prev => ({
      ...prev,
      create_deal: !prev.create_deal
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Convert Lead: {lead.first_name} {lead.last_name}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Review and edit the information before converting this lead to a customer
            </p>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* Account Information */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                <span className="ml-2 text-sm text-red-500">*Required</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={conversionData.account_data.account_name}
                    onChange={(e) => updateAccountData('account_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.account_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Company name"
                  />
                  {errors.account_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.account_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={conversionData.account_data.industry}
                    onChange={(e) => updateAccountData('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={conversionData.account_data.website}
                    onChange={(e) => updateAccountData('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={conversionData.account_data.phone}
                    onChange={(e) => updateAccountData('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Employees
                  </label>
                  <input
                    type="number"
                    value={conversionData.account_data.number_of_employees || ''}
                    onChange={(e) => updateAccountData('number_of_employees', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 100"
                    min="1"
                  />
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                <span className="ml-2 text-sm text-red-500">*Required</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={conversionData.contact_data.first_name}
                    onChange={(e) => updateContactData('first_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.first_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="First name"
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={conversionData.contact_data.last_name}
                    onChange={(e) => updateContactData('last_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.last_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Last name"
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={conversionData.contact_data.title}
                    onChange={(e) => updateContactData('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CEO, CTO, Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={conversionData.contact_data.email}
                    onChange={(e) => updateContactData('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={conversionData.contact_data.phone}
                    onChange={(e) => updateContactData('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </section>

            {/* Deal Information (Optional) */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="create_deal"
                    checked={conversionData.create_deal}
                    onChange={toggleCreateDeal}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="create_deal" className="text-lg font-medium text-gray-900">
                    Also create Deal
                  </label>
                  <span className="text-sm text-gray-500">Optional</span>
                </div>
              </div>

              {conversionData.create_deal && (
                <div className="pl-11 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deal Name *
                      </label>
                      <input
                        type="text"
                        value={conversionData.deal_data?.deal_name || ''}
                        onChange={(e) => updateDealData('deal_name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.deal_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Deal name"
                      />
                      {errors.deal_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.deal_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stage
                      </label>
                      <select
                        value={conversionData.deal_data?.stage || 'Prospecting'}
                        onChange={(e) => updateDealData('stage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {DEAL_STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={conversionData.deal_data?.amount || ''}
                        onChange={(e) => updateDealData('amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 50000"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Close Date
                      </label>
                      <input
                        type="date"
                        value={conversionData.deal_data?.close_date || ''}
                        onChange={(e) => updateDealData('close_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isConverting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConverting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {isConverting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isConverting ? 'Converting...' : 'Convert Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}