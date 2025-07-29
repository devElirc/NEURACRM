import React from 'react'
import { ContactForm } from './ContactForm'
import { type Contact } from '../api'
import { FormModal } from '../../../shared/components'

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
  contact?: Contact
  initialAccount?: { id: number; name: string }
  onSuccess?: () => void
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  contact,
  initialAccount,
  onSuccess
}) => {
  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose}>
      <ContactForm 
        contact={contact}
        initialAccount={initialAccount}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </FormModal>
  )
} 