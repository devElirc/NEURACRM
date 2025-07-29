import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContact } from '../api'
import { ContactForm } from '../components/ContactForm'

export const EditContactRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data: contact, isLoading, error } = useContact(parseInt(id!))

  const handleSuccess = () => {
    navigate(`/contacts/${id}`)
  }

  const handleCancel = () => {
    navigate(`/contacts/${id}`)
  }

  if (!id) {
    return <div className="p-6 text-red-600">Contact ID is required</div>
  }

  if (isLoading) {
    return <div className="p-6">Loading contact...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">Error loading contact: {error.message}</div>
  }

  if (!contact) {
    return <div className="p-6 text-gray-600">Contact not found</div>
  }

  return (
    <div className="p-6">
      <ContactForm 
        contact={contact} 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </div>
  )
}