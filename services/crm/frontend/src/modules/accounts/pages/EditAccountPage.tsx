import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from '../api'
import { AccountForm } from '../components/AccountForm'

interface EditAccountPageProps {
  accountId: number
}

export const EditAccountPage: React.FC<EditAccountPageProps> = ({ accountId }) => {
  const navigate = useNavigate()
  const { data: account, isLoading, error } = useAccount(accountId)

  const handleSuccess = () => {
    // Redirect to account details
    navigate(`/accounts/${accountId}`)
  }

  const handleCancel = () => {
    // Navigate back to account details
    navigate(`/accounts/${accountId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading account</div>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => navigate('/accounts')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Accounts
          </button>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Account not found</div>
          <button
            onClick={() => navigate('/accounts')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Accounts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/accounts" className="text-gray-700 hover:text-gray-900">
                Accounts
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <a href={`/accounts/${accountId}`} className="ml-1 text-gray-700 hover:text-gray-900 md:ml-2">
                  {account.account_name}
                </a>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1 text-gray-500 md:ml-2">Edit</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Page Content */}
        <AccountForm 
          account={account} 
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      </div>
    </div>
  )
}