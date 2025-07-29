import React, { useState, useEffect } from 'react'
import { useCreateAccount, useUpdateAccount, type AccountCreate, type Account } from '../api'
import { UserSelect } from '@/shared/components/selectors/UserSelect'
import { FormField, Button } from '@/shared/components'
import { useEligibleLeadOwners } from '@/api/tenant'

interface AccountFormProps {
  account?: Account
  onSuccess?: () => void
  onCancel?: () => void
}

export const AccountForm: React.FC<AccountFormProps> = ({ 
  account, 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<AccountCreate>({
    account_name: '',
    account_owner_alias: '',
    description: '',
    industry: '',
    website: '',
    phone: '',
    number_of_employees: undefined,
    billing_country: '',
    billing_street: '',
    billing_city: '',
    billing_state_province: '',
    billing_zip_postal_code: '',
    shipping_country: '',
    shipping_street: '',
    shipping_city: '',
    shipping_state_province: '',
    shipping_zip_postal_code: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>()

  const { data: ownersData } = useEligibleLeadOwners()

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()

  const isEditing = !!account

  // Set default owner to current user on new accounts
  useEffect(() => {
    if (!isEditing && ownersData?.users) {
      const currentUser = ownersData.users.find(user => user.is_current_user)
      if (currentUser && !selectedOwner) {
        setSelectedOwner(currentUser.id)
      }
    }
  }, [ownersData, isEditing, selectedOwner])

  // Load account data for editing
  useEffect(() => {
    if (account) {
      setFormData({
        account_name: account.account_name || '',
        account_owner_alias: account.account_owner_alias || '',
        description: account.description || '',
        industry: account.industry || '',
        website: account.website || '',
        phone: account.phone || '',
        number_of_employees: account.number_of_employees || undefined,
        billing_country: account.billing_country || '',
        billing_street: account.billing_street || '',
        billing_city: account.billing_city || '',
        billing_state_province: account.billing_state_province || '',
        billing_zip_postal_code: account.billing_zip_postal_code || '',
        shipping_country: account.shipping_country || '',
        shipping_street: account.shipping_street || '',
        shipping_city: account.shipping_city || '',
        shipping_state_province: account.shipping_state_province || '',
        shipping_zip_postal_code: account.shipping_zip_postal_code || '',
      })
      // Set owner for editing
      setSelectedOwner(account.owner)
    }
  }, [account, ownersData])

  const handleInputChange = (field: keyof AccountCreate, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required'
    }

    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://'
    }

    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      // Include owner in the data
      const accountData = {
        ...formData,
        owner: selectedOwner
      }

      if (isEditing && account) {
        await updateAccount.mutateAsync({ 
          id: account.account_id, 
          data: accountData 
        })
        alert('Account updated successfully!')
      } else {
        await createAccount.mutateAsync(accountData)
        alert('Account created successfully!')
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Error saving account:', error)
      alert(`Error saving account: ${error}`)
    }
  }

  const isSubmitting = createAccount.isPending || updateAccount.isPending

  return (
    <div className="bg-white dark:bg-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Account' : 'Create New Account'}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        {/* Basic Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Account Name"
              name="account_name"
              value={formData.account_name}
              onChange={handleInputChange}
              error={errors.account_name}
              placeholder="Enter account name"
              required
            />

            <UserSelect
              value={selectedOwner}
              onChange={handleOwnerChange}
              label="Account Owner *"
              placeholder="Select account owner..."
              error={errors.owner}
              permissionFilter="manage_accounts"
            />

            <FormField
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="e.g., Technology, Healthcare, Finance"
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
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
            />

            <FormField
              label="Number of Employees"
              name="number_of_employees"
              type="number"
              value={formData.number_of_employees}
              onChange={handleInputChange}
              placeholder="e.g., 100"
              min={1}
            />
          </div>

          <div className="mt-6">
            <FormField
              label="Description"
              name="description"
              as="textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter account description..."
              rows={4}
            />
          </div>
        </div>

        {/* Business Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Billing Country"
              name="billing_country"
              value={formData.billing_country}
              onChange={handleInputChange}
              placeholder="Enter country"
            />

            <FormField
              label="Billing Street Address"
              name="billing_street"
              value={formData.billing_street}
              onChange={handleInputChange}
              placeholder="Enter street address"
            />

            <FormField
              label="Billing City"
              name="billing_city"
              value={formData.billing_city}
              onChange={handleInputChange}
              placeholder="Enter city"
            />

            <FormField
              label="Billing State/Province"
              name="billing_state_province"
              value={formData.billing_state_province}
              onChange={handleInputChange}
              placeholder="Enter state/province"
            />

            <FormField
              label="Billing ZIP/Postal Code"
              name="billing_zip_postal_code"
              value={formData.billing_zip_postal_code}
              onChange={handleInputChange}
              placeholder="Enter ZIP/postal code"
            />
          </div>
        </div>

        {/* Address Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Shipping Country"
              name="shipping_country"
              value={formData.shipping_country}
              onChange={handleInputChange}
              placeholder="Enter country"
            />

            <FormField
              label="Shipping Street Address"
              name="shipping_street"
              value={formData.shipping_street}
              onChange={handleInputChange}
              placeholder="Enter street address"
            />

            <FormField
              label="Shipping City"
              name="shipping_city"
              value={formData.shipping_city}
              onChange={handleInputChange}
              placeholder="Enter city"
            />

            <FormField
              label="Shipping State/Province"
              name="shipping_state_province"
              value={formData.shipping_state_province}
              onChange={handleInputChange}
              placeholder="Enter state/province"
            />

            <FormField
              label="Shipping ZIP/Postal Code"
              name="shipping_zip_postal_code"
              value={formData.shipping_zip_postal_code}
              onChange={handleInputChange}
              placeholder="Enter ZIP/postal code"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
            {isEditing ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    </div>
  )
}