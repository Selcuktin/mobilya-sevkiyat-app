'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionText?: string
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
      }
    } catch (error) {
      showError('Hata', 'Bildirim güncellenemedi')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT'
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        showSuccess('Başarılı', 'Tüm bildirimler okundu olarak işaretlendi')
      }
    } catch (error) {
      showError('Hata', 'Bildirimler güncellenemedi')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        showSuccess('Başarılı', 'Bildirim silindi')
      }
    } catch (error) {
      showError('Hata', 'Bildirim silinemedi')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Bildirimler
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Henüz bildirim yok</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  } hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !notification.read 
                              ? 'text-gray-900 dark:text-gray-100' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {new Date(notification.timestamp).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              title="Okundu işaretle"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            title="Sil"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {notification.actionUrl && notification.actionText && (
                        <button
                          onClick={() => {
                            window.location.href = notification.actionUrl!
                            markAsRead(notification.id)
                          }}
                          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                          {notification.actionText}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <button
                onClick={() => {
                  setShowDropdown(false)
                  // Navigate to notifications page if exists
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Tüm Bildirimleri Görüntüle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Notification API functions
export const createNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    })
    return response.json()
  } catch (error) {
    console.error('Failed to create notification:', error)
    return { success: false }
  }
}

// System notification triggers
export const triggerStockAlert = (productName: string, currentStock: number) => {
  createNotification({
    type: 'warning',
    title: 'Stok Uyarısı',
    message: `${productName} ürününün stoku azaldı (${currentStock} adet kaldı)`,
    actionUrl: '/stok',
    actionText: 'Stok Yönetimi'
  })
}

export const triggerNewOrder = (orderNumber: string, customerName: string) => {
  createNotification({
    type: 'info',
    title: 'Yeni Sipariş',
    message: `${customerName} tarafından ${orderNumber} numaralı yeni sipariş oluşturuldu`,
    actionUrl: '/sevkiyat',
    actionText: 'Siparişi Görüntüle'
  })
}

export const triggerDeliveryComplete = (orderNumber: string) => {
  createNotification({
    type: 'success',
    title: 'Teslimat Tamamlandı',
    message: `${orderNumber} numaralı sipariş başarıyla teslim edildi`,
    actionUrl: '/sevkiyat',
    actionText: 'Sevkiyatları Görüntüle'
  })
}