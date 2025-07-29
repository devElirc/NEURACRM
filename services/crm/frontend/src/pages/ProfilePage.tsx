import React from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { User, Mail, Phone, Calendar } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account information
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.full_name}
              </h2>
              <p className="text-sm text-gray-500">
                {user.is_superadmin ? 'Super Administrator' : 'User'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-lg text-gray-900">
                    {user.phone || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Member Since</p>
                  <p className="text-lg text-gray-900">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Account Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Roles</p>
                {user.roles && user.roles.length > 0 ? (
                  <div className="space-y-1">
                    {user.roles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mr-2"
                      >
                        {role.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No roles assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}