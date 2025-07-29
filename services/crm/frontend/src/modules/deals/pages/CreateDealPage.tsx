import React from 'react'
import { useNavigate } from 'react-router-dom'
import { DealForm } from '../components/DealForm'

export const CreateDealPage: React.FC = () => {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/deals')
  }

  const handleCancel = () => {
    navigate('/deals')
  }

  return (
    <div className="p-6">
      <DealForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}