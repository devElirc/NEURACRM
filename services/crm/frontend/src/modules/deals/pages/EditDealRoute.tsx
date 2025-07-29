import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDeal } from '../api'
import { DealForm } from '../components/DealForm'

export const EditDealRoute: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>()
  const navigate = useNavigate()
  const dealIdNum = dealId ? parseInt(dealId) : 0

  const { data: deal, isLoading, error } = useDeal(dealIdNum)

  const handleSuccess = () => {
    navigate(`/deals/${dealIdNum}`)
  }

  const handleCancel = () => {
    navigate(`/deals/${dealIdNum}`)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error loading deal: {error?.message || 'Deal not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <DealForm deal={deal} onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}