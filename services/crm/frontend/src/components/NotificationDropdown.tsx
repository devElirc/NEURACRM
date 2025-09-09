import React, { useState, useEffect } from 'react'
import { Bell, X, Check, Clock, AlertCircle } from 'lucide-react'
import { useWS } from '../shared/hooks/WebSocketProvider'
import { useAuth } from '../auth/AuthProvider'
import toast, { Toaster } from 'react-hot-toast'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'mention'
  timestamp: string
  read: boolean
  relatedUser?: {
    name: string
    avatar?: string
  }
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <Check className="w-4 h-4 text-green-500" />
    case 'warning':
      return <Clock className="w-4 h-4 text-yellow-500" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'mention':
      return <Bell className="w-4 h-4 text-blue-500" />
    default:
      return <Bell className="w-4 h-4 text-gray-500" />
  }
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { addListener } = useWS()
  const { user, tokens, tenant } = useAuth()

  // Fetch notifications on login
  useEffect(() => {
    if (!tenant || !tokens || !user) return

    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/inbox/notifications/?tenantId=${tenant.id}`,
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        if (!res.ok) throw new Error('Failed to fetch notifications')
        const data = await res.json()
        setNotifications(
          Array.isArray(data.results)
            ? data.results.map((n: any) => ({
                id: n.id,
                title: n.data.author
                  ? `${n.data.author} mentioned you`
                  : 'New Notification',
                message: n.data.comment_content || '',
                type: n.type || 'info',
                timestamp: n.created_at,
                read: n.is_read,
                relatedUser: n.related_user || undefined
              }))
            : []
        )
      } catch (err) {
        console.error(err)
      }
    }

    fetchNotifications()
  }, [tenant, tokens, user])

  // Listen to WebSocket notifications
  useEffect(() => {
    if (!addListener) return
    const unsubscribe = addListener((data) => {
      if (data.type === 'notification' && data.data) {
        const notifData = data.data
        const newNotification: Notification = {
          id: notifData.id,
          title: notifData.data.author
            ? `${notifData.data.author} mentioned you`
            : 'New Notification',
          message: notifData.data.comment_content || '',
          type: 'mention',
          timestamp: notifData.created_at,
          read: notifData.is_read,
          relatedUser: notifData.related_user || undefined
        }
        toast(`🔔 ${newNotification.title}: ${newNotification.message}`, { duration: 5000 })
        setNotifications(prev => [newNotification, ...prev])
      }
    })
    return unsubscribe
  }, [addListener])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await fetch(`http://localhost:8000/api/inbox/notifications/${id}/mark_read/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.access_token}`
        }
      })
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await fetch(`http://localhost:8000/api/inbox/notifications/mark-all-read/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.access_token}`
        },
        body: JSON.stringify({ ids: unreadIds })
      })
    } catch (err) {
      console.error('Failed to mark all notifications as read', err)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="relative">
      <Toaster position="top-right" />

      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications ({unreadCount})
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {notification.relatedUser?.avatar ? (
                        <img
                          src={notification.relatedUser.avatar}
                          alt={notification.relatedUser.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {getNotificationIcon(notification.type)}
                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            {notification.type}
                          </span>
                          {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
