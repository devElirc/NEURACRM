import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountForm } from '../components/AccountForm'

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate()
  
  const handleSuccess = () => {
    // Redirect to accounts list
    navigate('/accounts')
  }

  const handleCancel = () => {
    // Navigate back to accounts list
    navigate('/accounts')
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
                <span className="ml-1 text-gray-500 md:ml-2">Create Account</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Page Content */}
        <AccountForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}