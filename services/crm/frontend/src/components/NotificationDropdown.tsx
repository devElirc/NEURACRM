import React, { useState } from 'react'
import { Bell, Check, X, Clock, AlertCircle } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  read: boolean
}

// Mock notifications data - will be replaced with real API later
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New lead assigned',
    message: 'John Smith has been assigned to you',
    type: 'info',
    timestamp: '5 minutes ago',
    read: false,
  },
  {
    id: '2',
    title: 'Deal closed',
    message: 'Acme Corp deal worth $15,000 has been closed successfully',
    type: 'success',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    title: 'Follow-up reminder',
    message: 'Contact Jane Doe for quarterly review',
    type: 'warning',
    timestamp: '2 hours ago',
    read: true,
  },
  {
    id: '4',
    title: 'System maintenance',
    message: 'Scheduled maintenance will occur tonight at 11 PM',
    type: 'info',
    timestamp: '1 day ago',
    read: true,
  },
]

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <Check className="w-4 h-4 text-green-500" />
    case 'warning':
      return <Clock className="w-4 h-4 text-yellow-500" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    default:
      return <Bell className="w-4 h-4 text-blue-500" />
  }
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    )
  }

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
            <span className="sr-only">{unreadCount} unread notifications</span>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications ({unreadCount} unread)
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 ${
                      notification.read
                        ? 'border-l-transparent bg-white'
                        : 'border-l-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.timestamp}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Remove notification"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2">
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}