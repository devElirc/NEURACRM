import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ContactForm } from '../components/ContactForm'

export const CreateContactPage: React.FC = () => {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/contacts')
  }

  const handleCancel = () => {
    navigate('/contacts')
  }

  return (
    <div className="p-6">
      <ContactForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}