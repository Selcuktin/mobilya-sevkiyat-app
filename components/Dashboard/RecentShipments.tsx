'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Loading } from '../ui/Loading'
import { useToast } from '../../contexts/ToastContext'

interface Shipment {
  id: string
  orderNumber: string
  customerName: string
  status: string
  totalAmount: number
  createdAt: string
  items: Array<{
    productName: string
  }>
}

export function RecentShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const { showError } = useToast()

  useEffect(() => {
    fetchRecentShipments()
  }, [])

  const fetchRecentShipments = async () => {
    try {
      const response = await fetch('/api/shipments?limit=5')
      const data = await response.json()
      
      if (data.success) {
        setShipments(data.data)
      } else {
        showError('Veri yüklenemedi', data.error)
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Sevkiyat verileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'SHIPPED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'Teslim Edildi'
      case 'PENDING': return 'Hazırlanıyor'
      case 'SHIPPED': return 'Yolda'
      case 'CANCELLED': return 'İptal'
      default: return status
    }
  }

  if (loading) {
    return <Loading text="Sevkiyatlar yükleniyor..." />
  }

  if (shipments.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Henüz sevkiyat kaydı yok</p>
        <p className="text-sm text-gray-400 mt-1">İlk sevkiyatınızı oluşturun</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Shipments List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Son Sevkiyatlar</h3>
        
        {shipments.map((shipment) => (
          <div key={shipment.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mr-3">
                  <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{shipment.orderNumber}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{shipment.customerName}</p>
                  {shipment.items.length > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {shipment.items[0].productName}
                      {shipment.items.length > 1 && ` +${shipment.items.length - 1} ürün`}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(shipment.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                  {getStatusText(shipment.status)}
                </span>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                  {shipment.totalAmount.toLocaleString('tr-TR')} ₺
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shipment Status Overview */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Sevkiyat Durumu</h3>
        
        <ShipmentStatusChart shipments={shipments} />
      </div>
    </div>
  )
}

function ShipmentStatusChart({ shipments }: { shipments: Shipment[] }) {
  const statusCounts = shipments.reduce((acc, shipment) => {
    acc[shipment.status] = (acc[shipment.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total = shipments.length
  const statusData = [
    { 
      status: 'Hazırlanıyor', 
      count: statusCounts.PENDING || 0, 
      color: 'bg-yellow-500', 
      percentage: total > 0 ? ((statusCounts.PENDING || 0) / total) * 100 : 0 
    },
    { 
      status: 'Yolda', 
      count: statusCounts.SHIPPED || 0, 
      color: 'bg-blue-500', 
      percentage: total > 0 ? ((statusCounts.SHIPPED || 0) / total) * 100 : 0 
    },
    { 
      status: 'Teslim Edildi', 
      count: statusCounts.DELIVERED || 0, 
      color: 'bg-green-500', 
      percentage: total > 0 ? ((statusCounts.DELIVERED || 0) / total) * 100 : 0 
    },
    { 
      status: 'İptal', 
      count: statusCounts.CANCELLED || 0, 
      color: 'bg-red-500', 
      percentage: total > 0 ? ((statusCounts.CANCELLED || 0) / total) * 100 : 0 
    }
  ]

  if (total === 0) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
        <p className="text-center text-orange-800 dark:text-orange-200">Henüz sevkiyat verisi yok</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
      <div className="space-y-4">
        {statusData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">{item.status}</span>
              </div>
              <span className="text-sm font-bold text-orange-900 dark:text-orange-100">{item.count}</span>
            </div>
            <div className="w-full bg-orange-200 dark:bg-orange-800/30 rounded-full h-2">
              <div 
                className={`${item.color} h-2 rounded-full transition-all duration-1000`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{total}</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">Toplam</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {total > 0 ? Math.round(((statusCounts.DELIVERED || 0) / total) * 100) : 0}%
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">Başarı</p>
        </div>
      </div>
    </div>
  )
}