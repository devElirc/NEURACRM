import React from 'react'
import { LeadForm } from './LeadForm'
import { type Lead } from '../api'
import { FormModal } from '../../../shared/components'

interface LeadFormModalProps {
  isOpen: boolean
  onClose: () => void
  lead?: Lead
  onSuccess?: () => void
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  lead,
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
      <LeadForm 
        lead={lead}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </FormModal>
  )
} 