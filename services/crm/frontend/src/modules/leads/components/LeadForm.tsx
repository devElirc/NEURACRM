import React, { useState, useEffect } from 'react'
import { useCreateLead, useUpdateLead, type LeadCreate, type Lead } from '../api'
import { AccountSelect } from '@/shared/components/selectors/AccountSelect'
import { UserSelect } from '@/shared/components/selectors/UserSelect'
import { FormField, Button } from '@/shared/components'
import { useEligibleLeadOwners } from '@/api/tenant'


interface LeadFormProps {
  lead?: Lead
  onSuccess?: () => void
  onCancel?: () => void
}

export const LeadForm: React.FC<LeadFormProps> = ({ 
  lead, 
  onSuccess, 
  onCancel 
}) => {
  const { data: ownersData } = useEligibleLeadOwners()
  
  const [formData, setFormData] = useState<LeadCreate>({
    first_name: '',
    last_name: '',
    email: '',
    title: '',
    phone: '',
    description: '',
    lead_status: 'New',
    score: 0,
    lead_source: '',
    industry: '',
    website: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    number_of_employees: undefined,
    average_revenue: undefined,
    company_name: '',
    lead_owner: undefined, // Will be set when eligible owners data loads
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createLead = useCreateLead()
  const updateLead = useUpdateLead()

  const isEditing = !!lead

  // Lead status options
  const statusOptions = [
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'Proposal', label: 'Proposal' },
    { value: 'Closed', label: 'Closed' },
  ]

  // Lead source options
  const sourceOptions = [
    { value: 'Website', label: 'Website' },
    { value: 'Phone', label: 'Phone' },
    { value: 'Email', label: 'Email' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Advertisement', label: 'Advertisement' },
    { value: 'Trade Show', label: 'Trade Show' },
    { value: 'Partner', label: 'Partner' },
  ]

  // Load lead data for editing
  useEffect(() => {
    if (lead) {
      setFormData({
        company: lead.company,
        company_name: lead.company_name || '',
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        title: lead.title || '',
        phone: lead.phone || '',
        description: lead.description || '',
        lead_status: lead.lead_status || 'New',
        score: lead.score || 0,
        lead_owner: lead.lead_owner,
        lead_source: lead.lead_source || '',
        industry: lead.industry || '',
        website: lead.website || '',
        street: lead.street || '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || '',
        postal_code: lead.postal_code || '',
        number_of_employees: lead.number_of_employees,
        average_revenue: lead.average_revenue,
      })
    }
  }, [lead])

  // Auto-set current user as lead owner for new leads when eligible owners data becomes available
  useEffect(() => {
    if (!lead && ownersData?.users && !formData.lead_owner) {
      // Find the current user in the eligible owners list
      const currentUser = ownersData.users.find(u => u.is_current_user)
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          lead_owner: currentUser.id
        }))
      }
    }
  }, [ownersData, lead, formData.lead_owner])

  const handleInputChange = (field: keyof LeadCreate, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://'
    }

    if (formData.score && (formData.score < 0 || formData.score > 100)) {
      newErrors.score = 'Score must be between 0 and 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      if (isEditing && lead) {
        await updateLead.mutateAsync({ 
          id: lead.lead_id, 
          data: formData 
        })
        alert('Lead updated successfully!')
      } else {
        await createLead.mutateAsync(formData)
        alert('Lead created successfully!')
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Error saving lead:', error)
      alert(`Error saving lead: ${error}`)
    }
  }

  const isSubmitting = createLead.isPending || updateLead.isPending

  return (
    <div className="bg-white dark:bg-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Lead' : 'Create New Lead'}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        {/* Basic Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              error={errors.first_name}
              placeholder="Enter first name"
              required
            />

            <FormField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              error={errors.last_name}
              placeholder="Enter last name"
              required
            />

            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="Enter email address"
            />

            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
            />

            <FormField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., CEO, Marketing Manager"
            />

            <FormField
              label="Lead Status"
              name="lead_status"
              as="select"
              value={formData.lead_status}
              onChange={handleInputChange}
              options={statusOptions}
            />

            <FormField
              label="Lead Source"
              name="lead_source"
              as="select"
              value={formData.lead_source}
              onChange={handleInputChange}
              options={sourceOptions}
              placeholder="Select source"
            />

            <FormField
              label="Score (0-100)"
              name="score"
              type="number"
              value={formData.score}
              onChange={handleInputChange}
              error={errors.score}
              placeholder="0"
              min={0}
              max={100}
            />
          </div>

          <div className="mt-6">
            <FormField
              label="Description"
              name="description"
              as="textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter lead description..."
              rows={4}
            />
          </div>
        </div>

        {/* Business Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <AccountSelect
                value={formData.company_name || ''}
                onChange={(accountName) => handleInputChange('company_name', accountName)}
                placeholder="Search existing companies or type new name..."
                className="w-full"
                leadMode={true}
              />
            </div>

            <FormField
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="e.g., Technology, Healthcare"
            />

            <FormField
              label="Website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              error={errors.website}
              placeholder="https://example.com"
            />

            <FormField
              label="Number of Employees"
              name="number_of_employees"
              type="number"
              value={formData.number_of_employees}
              onChange={handleInputChange}
              placeholder="e.g., 50"
              min={1}
            />

            <FormField
              label="Average Revenue"
              name="average_revenue"
              type="number"
              value={formData.average_revenue}
              onChange={handleInputChange}
              placeholder="e.g., 1000000"
              min={0}
              step="0.01"
            />

            <div>
              <UserSelect
                value={formData.lead_owner}
                onChange={(userId) => handleInputChange('lead_owner', userId)}
                label="Lead Owner"
                placeholder="Select lead owner..."
                className="w-full"
                permissionFilter="manage_leads"
              />
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Street Address"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              placeholder="Enter street address"
            />

            <FormField
              label="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Enter city"
            />

            <FormField
              label="State/Province"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="Enter state/province"
            />

            <FormField
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Enter country"
            />

            <FormField
              label="ZIP/Postal Code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              placeholder="Enter ZIP/postal code"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
            size="lg"
          >
            {isEditing ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </div>
  );
}
