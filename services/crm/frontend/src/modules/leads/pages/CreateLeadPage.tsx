import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LeadForm } from '../components/LeadForm'

export const CreateLeadPage: React.FC = () => {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/leads')
  }

  const handleCancel = () => {
    navigate('/leads')
  }

  return (
    <div className="p-6">
      <LeadForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}