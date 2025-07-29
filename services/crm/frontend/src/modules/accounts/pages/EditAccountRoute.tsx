import React from 'react'
import { useParams } from 'react-router-dom'
import { EditAccountPage } from './EditAccountPage'

export const EditAccountRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const accountId = parseInt(id || '0', 10)

  if (!accountId || isNaN(accountId)) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Not Found</h2>
        <p className="text-gray-600 mb-6">The account ID is invalid or missing.</p>
        <a href="/accounts" className="text-blue-600 hover:text-blue-800">
          Back to Accounts
        </a>
      </div>
    )
  }

  return <EditAccountPage accountId={accountId} />
}