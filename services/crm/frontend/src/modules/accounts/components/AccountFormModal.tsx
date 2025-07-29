import React from 'react'
import { AccountForm } from './AccountForm'
import { type Account } from '../api'
import { FormModal } from '../../../shared/components'

interface AccountFormModalProps {
  isOpen: boolean
  onClose: () => void
  account?: Account
  onSuccess?: () => void
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  account,
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
      <AccountForm 
        account={account}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </FormModal>
  )
} 