import React from 'react'
import { useParams } from 'react-router-dom'
import { ContactDetailsPage } from './ContactDetailsPage'

export const ContactDetailsRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  
  if (!id) {
    return <div className="p-6 text-red-600">Contact ID is required</div>
  }

  return <ContactDetailsPage contactId={parseInt(id)} />
}