import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLead } from '../api'
import { LeadForm } from '../components/LeadForm'

export const EditLeadRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data: lead, isLoading, error } = useLead(parseInt(id!))

  const handleSuccess = () => {
    navigate(`/leads/${id}`)
  }

  const handleCancel = () => {
    navigate(`/leads/${id}`)
  }

  if (!id) {
    return <div className="p-6 text-red-600">Lead ID is required</div>
  }

  if (isLoading) {
    return <div className="p-6">Loading lead...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">Error loading lead: {error.message}</div>
  }

  if (!lead) {
    return <div className="p-6 text-gray-600">Lead not found</div>
  }

  return (
    <div className="p-6">
      <LeadForm 
        lead={lead} 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </div>
  )
}