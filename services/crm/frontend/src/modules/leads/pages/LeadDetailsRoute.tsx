import React from 'react'
import { useParams } from 'react-router-dom'
import { LeadDetailsPage } from './LeadDetailsPage'

export const LeadDetailsRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  
  if (!id) {
    return <div className="p-6 text-red-600">Lead ID is required</div>
  }

  return <LeadDetailsPage leadId={parseInt(id)} />
}