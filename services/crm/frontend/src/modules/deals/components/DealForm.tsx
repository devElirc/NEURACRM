import React, { useState, useEffect } from 'react'
import { useCreateDeal, useUpdateDeal, type DealCreate, type Deal } from '../api'
import { useAccounts } from '@/modules/accounts/api'
import { UserSelect } from '@/shared/components/selectors/UserSelect'
import { ContactSelect } from '@/shared/components/selectors/ContactSelect'
import { FormField, Button } from '@/shared/components'
import { useEligibleLeadOwners } from '@/api/tenant'

interface DealFormProps {
  deal?: Deal
  initialAccount?: { id: number; name: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export const DealForm: React.FC<DealFormProps> = ({ 
  deal, 
  initialAccount,
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<DealCreate>({
    deal_name: '',
    stage: 'Prospecting',
    amount: '',
    close_date: '',
    account: 0,
    account_name: '',
    deal_owner_alias: '',
    primary_contact: undefined,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>()

  const { data: ownersData } = useEligibleLeadOwners()

  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()
  const { data: accountsData } = useAccounts()

  const isEditing = !!deal
  const accounts = accountsData?.results || []

  // Set default owner to current user on new deals
  useEffect(() => {
    if (!isEditing && ownersData?.users) {
      const currentUser = ownersData.users.find(user => user.is_current_user)
      if (currentUser && !selectedOwner) {
        setSelectedOwner(currentUser.id)
      }
    }
  }, [ownersData, isEditing, selectedOwner])

  // Load deal data for editing or set initial account
  useEffect(() => {
    if (deal) {
      setFormData({
        deal_name: deal.deal_name || '',
        stage: deal.stage || 'Prospecting',
        amount: deal.amount || '',
        close_date: deal.close_date || '',
        account: deal.account || 0,
        account_name: deal.account_name || '',
        deal_owner_alias: deal.deal_owner_alias || '',
        primary_contact: deal.primary_contact || undefined,
      })
      // Set owner for editing
      setSelectedOwner(deal.owner)
    } else if (initialAccount) {
      setFormData(prev => ({
        ...prev,
        account: initialAccount.id,
        account_name: initialAccount.name
      }))
    }
  }, [deal, initialAccount, ownersData])

  const handleInputChange = (field: keyof DealCreate, value: string | number | undefined) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Clear primary contact when account changes
      if (field === 'account' && value !== prev.account) {
        newData.primary_contact = undefined
      }
      
      return newData
    })
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleOwnerChange = (userId: number) => {
    setSelectedOwner(userId)
    // Clear owner error if set
    if (errors.owner) {
      setErrors(prev => ({ ...prev, owner: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.deal_name.trim()) {
      newErrors.deal_name = 'Deal name is required'
    }

    if (!formData.stage.trim()) {
      newErrors.stage = 'Stage is required'
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number'
    }

    if (!formData.close_date.trim()) {
      newErrors.close_date = 'Close date is required'
    } else {
      const closeDate = new Date(formData.close_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (closeDate < today) {
        newErrors.close_date = 'Close date cannot be in the past'
      }
    }

    if (!formData.account || formData.account === 0) {
      newErrors.account = 'Account is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      // Include owner in the data
      const dealData = {
        ...formData,
        owner: selectedOwner
      }

      if (isEditing && deal) {
        await updateDeal.mutateAsync({
          dealId: deal.deal_id,
          dealData: dealData
        })
        alert('Deal updated successfully!')
      } else {
        await createDeal.mutateAsync(dealData)
        alert('Deal created successfully!')
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Error saving deal:', error)
      alert(`Error saving deal: ${error}`)
    }
  }

  const isSubmitting = createDeal.isPending || updateDeal.isPending

  const stageOptions = [
    { value: 'Prospecting', label: 'Prospecting' },
    { value: 'Qualification', label: 'Qualification' },
    { value: 'Need Analysis', label: 'Need Analysis' },
    { value: 'Value Proposition', label: 'Value Proposition' },
    { value: 'Proposal', label: 'Proposal' },
    { value: 'Negotiation', label: 'Negotiation' },
    { value: 'Closed Won', label: 'Closed Won' },
    { value: 'Closed Lost', label: 'Closed Lost' }
  ]

  return (
    <div className="bg-white dark:bg-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Deal' : 'Create New Deal'}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        {/* Basic Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Deal Name"
              name="deal_name"
              value={formData.deal_name}
              onChange={handleInputChange}
              error={errors.deal_name}
              placeholder="Enter deal name"
              disabled={isSubmitting}
              required
            />

            <FormField
              label="Stage"
              name="stage"
              as="select"
              value={formData.stage}
              onChange={handleInputChange}
              error={errors.stage}
              options={stageOptions}
              disabled={isSubmitting}
              required
            />

            <FormField
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              error={errors.amount}
              placeholder="0.00"
              min={0}
              step="0.01"
              disabled={isSubmitting}
              required
            />

            <FormField
              label="Close Date"
              name="close_date"
              type="date"
              value={formData.close_date}
              onChange={handleInputChange}
              error={errors.close_date}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        {/* Account Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Account"
              name="account"
              as="select"
              value={formData.account}
              onChange={handleInputChange}
              error={errors.account}
              options={[
                { value: 0, label: 'Select an account' },
                ...accounts.map(account => ({
                  value: account.account_id,
                  label: account.account_name
                }))
              ]}
              disabled={isSubmitting}
              required
            />

            <div>
              <FormField
                label="Account Name Alias"
                name="account_name"
                value={formData.account_name}
                onChange={handleInputChange}
                placeholder="Account name alias (optional)"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional account name override
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <ContactSelect
                value={formData.primary_contact}
                onChange={(contactId) => handleInputChange('primary_contact', contactId)}
                label="Primary Contact"
                accountFilter={formData.account}
                placeholder={
                  !formData.account || formData.account === 0 
                    ? "Select an account first..." 
                    : "Select primary contact..."
                }
                disabled={!formData.account || formData.account === 0 || isSubmitting}
              />
              {(!formData.account || formData.account === 0) && (
                <p className="mt-1 text-sm text-gray-500">
                  Select an account to choose a contact
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Deal Details Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Deal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UserSelect
              value={selectedOwner}
              onChange={handleOwnerChange}
              label="Deal Owner *"
              placeholder="Select deal owner..."
              error={errors.owner}
              permissionFilter="manage_opportunities"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
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
            {isEditing ? 'Update Deal' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </div>
  )
}