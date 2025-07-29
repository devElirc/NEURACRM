import React, { useState, useEffect } from 'react'
import { useCreateContact, useUpdateContact, type ContactCreate, type Contact } from '../api'
import { AccountSelect } from '@/shared/components/selectors/AccountSelect'
import { UserSelect } from '@/shared/components/selectors/UserSelect'
import { ContactSelect } from '@/shared/components/selectors/ContactSelect'
import { EssentialInfoSection, RelationshipsSection, AddressSection } from '@/shared/components/forms/FormSection'
import { FormField, Button } from '@/shared/components'
import { useEligibleLeadOwners } from '@/api/tenant'

interface ContactFormProps {
  contact?: Contact
  initialAccount?: { id: number; name: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export const ContactForm: React.FC<ContactFormProps> = ({ 
  contact, 
  initialAccount,
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<ContactCreate>({
    first_name: '',
    last_name: '',
    email: '',
    title: '',
    phone: '',
    description: '',
    mailing_street: '',
    mailing_city: '',
    mailing_state: '',
    mailing_country: '',
    postal_code: '',
  })
  
  // Additional state for UI components
  const [accountName, setAccountName] = useState('')
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>(undefined)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const { data: ownersData } = useEligibleLeadOwners()

  const createContact = useCreateContact()
  const updateContact = useUpdateContact()

  const isEditing = !!contact

  // Set default owner to current user on new contacts
  useEffect(() => {
    if (!isEditing && ownersData?.users) {
      const currentUser = ownersData.users.find(user => user.is_current_user)
      if (currentUser && !selectedOwner) {
        setSelectedOwner(currentUser.id)
        setFormData(prev => ({ ...prev, owner: currentUser.id }))
      }
    }
  }, [ownersData, isEditing, selectedOwner])

  // Load contact data for editing or set initial account
  useEffect(() => {
    if (contact) {
      setFormData({
        account: contact.account,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        title: contact.title || '',
        phone: contact.phone || '',
        description: contact.description || '',
        reports_to: contact.reports_to,
        mailing_street: contact.mailing_street || '',
        mailing_city: contact.mailing_city || '',
        mailing_state: contact.mailing_state || '',
        mailing_country: contact.mailing_country || '',
        postal_code: contact.postal_code || '',
        owner: contact.owner,
        // Note: Using only 'owner' field - removing redundant 'contact_owner'
      })
      
      // Set UI state
      setAccountName(contact.account_name || '')
      setSelectedOwner(contact.owner)
    } else if (initialAccount) {
      setFormData(prev => ({
        ...prev,
        account: initialAccount.id
      }))
      setAccountName(initialAccount.name)
    }
  }, [contact, initialAccount])

  const handleInputChange = (field: keyof ContactCreate, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle account selection from AccountSelect
  const handleAccountChange = (accountName: string) => {
    setAccountName(accountName)
    // Note: AccountSelect returns name, backend expects account ID
    // For now, we'll store the name and let backend handle account linking
    setFormData(prev => ({ ...prev, account: undefined }))
  }

  // Handle owner selection from UserSelect
  const handleOwnerChange = (userId: number) => {
    setSelectedOwner(userId)
    setFormData(prev => ({ ...prev, owner: userId }))
  }

  // Handle reports to selection from ContactSelect
  const handleReportsToChange = (contactId: number | undefined) => {
    setFormData(prev => ({ ...prev, reports_to: contactId }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
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
      if (isEditing && contact) {
        await updateContact.mutateAsync({ 
          id: contact.contact_id, 
          data: formData 
        })
        alert('Contact updated successfully!')
      } else {
        await createContact.mutateAsync(formData)
        alert('Contact created successfully!')
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Error saving contact:', error)
      alert(`Error saving contact: ${error}`)
    }
  }

  const isSubmitting = createContact.isPending || updateContact.isPending

  return (
    <div className="bg-white dark:bg-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Contact' : 'Create New Contact'}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        
        {/* Essential Information Section */}
        <EssentialInfoSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              error={errors.first_name}
              placeholder="Enter first name"
              disabled={isSubmitting}
              required
            />

            <FormField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              error={errors.last_name}
              placeholder="Enter last name"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              required
            />

            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
            />

            <div className="md:col-span-2">
              <FormField
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Sales Manager, CEO, Developer"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </EssentialInfoSection>

        {/* Company & Relationships Section */}
        <RelationshipsSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <AccountSelect
                value={accountName}
                onChange={handleAccountChange}
                placeholder="Search existing company or create new..."
                disabled={isSubmitting}
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional - Link contact to a company account
              </p>
            </div>

            <div>
              <ContactSelect
                value={formData.reports_to}
                onChange={handleReportsToChange}
                placeholder="Select manager (optional)..."
                label="Reports To"
                disabled={isSubmitting}
                excludeId={contact?.contact_id} // Don't allow contact to report to themselves
                className="w-full"
              />
            </div>

            <div className="md:col-span-2">
              <UserSelect
                value={selectedOwner}
                onChange={handleOwnerChange}
                placeholder="Select contact owner..."
                label="Contact Owner"
                disabled={isSubmitting}
                className="w-full"
                permissionFilter="manage_contacts"
              />
              <p className="mt-1 text-sm text-gray-500">
                The user responsible for managing this contact
              </p>
            </div>
          </div>
        </RelationshipsSection>

        {/* Address & Details Section */}
        <AddressSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <FormField
                label="Street Address"
                name="mailing_street"
                value={formData.mailing_street}
                onChange={handleInputChange}
                placeholder="Enter street address"
                disabled={isSubmitting}
              />
            </div>

            <FormField
              label="City"
              name="mailing_city"
              value={formData.mailing_city}
              onChange={handleInputChange}
              placeholder="Enter city"
              disabled={isSubmitting}
            />

            <FormField
              label="State/Province"
              name="mailing_state"
              value={formData.mailing_state}
              onChange={handleInputChange}
              placeholder="Enter state/province"
              disabled={isSubmitting}
            />

            <FormField
              label="Country"
              name="mailing_country"
              value={formData.mailing_country}
              onChange={handleInputChange}
              placeholder="Enter country"
              disabled={isSubmitting}
            />

            <FormField
              label="ZIP/Postal Code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              placeholder="Enter ZIP/postal code"
              disabled={isSubmitting}
            />

            <div className="md:col-span-2">
              <FormField
                label="Description"
                name="description"
                as="textarea"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter contact description or notes..."
                disabled={isSubmitting}
                rows={4}
              />
            </div>
          </div>
        </AddressSection>

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
            {isEditing ? 'Update Contact' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </div>
  )
}