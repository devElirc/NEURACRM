import React from 'react'
import { DealForm } from './DealForm'
import { type Deal } from '../api'
import { FormModal } from '../../../shared/components'

interface DealFormModalProps {
  isOpen: boolean
  onClose: () => void
  deal?: Deal
  initialAccount?: { id: number; name: string }
  onSuccess?: () => void
}

export const DealFormModal: React.FC<DealFormModalProps> = ({
  isOpen,
  onClose,
  deal,
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
      <DealForm 
        deal={deal}
        initialAccount={initialAccount}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </FormModal>
  )
} 