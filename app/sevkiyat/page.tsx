'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Plus, Eye, Edit, Trash2, Truck, Calendar, MapPin, Package, User } from 'lucide-react'
import Navigation from '../../components/Layout/Navigation'
import Header from '../../components/Layout/Header'
import { Loading } from '../../components/ui/Loading'
import { useToast } from '../../contexts/ToastContext'

interface Shipment {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  city: string
  status: string
  totalAmount: number
  itemCount: number
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  createdAt: string
  deliveryDate: string | null
}

export default function SevkiyatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Tümü')
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/auth/signin')
    else fetchShipments()
  }, [session, status, router])

  const fetchShipments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shipments')
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

  const deleteShipment = async (id: string) => {
    if (!confirm('Bu sevkiyatı silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/shipments/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        showSuccess('Sevkiyat silindi', 'Sevkiyat başarıyla silindi')
        fetchShipments()
      } else {
        showError('Silme hatası', data.error)
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Sevkiyat silinirken hata oluştu')
    }
  }

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customerPhone.includes(searchTerm)
    
    const matchesStatus = selectedStatus === 'Tümü' || shipment.status === selectedStatus

    return matchesSearch && matchesStatus
  })

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

  const toggleShipmentDetails = (shipmentId: string) => {
    const newExpanded = new Set(expandedShipments)
    if (newExpanded.has(shipmentId)) {
      newExpanded.delete(shipmentId)
    } else {
      newExpanded.add(shipmentId)
    }
    setExpandedShipments(newExpanded)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading size="lg" text="Sevkiyatlar yükleniyor..." />
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <Navigation />
      
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg mr-3">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Sevkiyat Takip Sistemi
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Sevkiyat süreçlerini takip edin ve yönetin
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/sevkiyat/yeni')}
              className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Sevkiyat
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🔍 Filtreleme ve Arama</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Sevkiyat kodu, müşteri adı..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="Tümü">Tüm Durumlar</option>
              <option value="PENDING">Hazırlanıyor</option>
              <option value="SHIPPED">Yolda</option>
              <option value="DELIVERED">Teslim Edildi</option>
              <option value="CANCELLED">İptal</option>
            </select>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Filter className="h-4 w-4 mr-2" />
              {filteredShipments.length} sevkiyat bulundu
            </div>
          </div>
        </div>

        {/* Shipments List */}
        {filteredShipments.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || selectedStatus !== 'Tümü' ? 'Sevkiyat bulunamadı' : 'Henüz sevkiyat yok'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || selectedStatus !== 'Tümü' 
                ? 'Arama kriterlerinizi değiştirmeyi deneyin' 
                : 'İlk sevkiyatınızı oluşturun'
              }
            </p>
            {!searchTerm && selectedStatus === 'Tümü' && (
              <button 
                onClick={() => router.push('/sevkiyat/yeni')}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Yeni Sevkiyat Oluştur
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShipments.map((shipment) => (
              <div key={shipment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Compact Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-white">
                      <Truck className="h-6 w-6 mr-3" />
                      <div>
                        <h3 className="text-lg font-bold">{shipment.orderNumber}</h3>
                        <p className="text-blue-100 text-sm">{shipment.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(shipment.status)}`}>
                        {getStatusText(shipment.status)}
                      </span>
                      <button 
                        onClick={() => toggleShipmentDetails(shipment.id)}
                        className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-white text-sm font-medium"
                      >
                        {expandedShipments.has(shipment.id) ? "Detayları Gizle" : "Detayları Göster"}
                      </button>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => router.push(`/sevkiyat/${shipment.id}/duzenle`)}
                          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          title="Sevkiyat Düzenle"
                        >
                          <Edit className="h-4 w-4 text-white" />
                        </button>
                        <button 
                          onClick={() => deleteShipment(shipment.id)}
                          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          title="Sevkiyat Sil"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Summary */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-red-500 dark:text-red-400" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{shipment.customerName}</p>
                        <p className="text-gray-700 dark:text-gray-200 font-medium">{shipment.customerPhone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {new Date(shipment.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                        <p className="text-gray-700 dark:text-gray-200 font-medium">Oluşturulma</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2 text-green-500 dark:text-green-400" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{shipment.itemCount} Ürün</p>
                        <p className="text-gray-700 dark:text-gray-200 font-medium">
                          {shipment.items[0]?.productName || 'Ürün bilgisi yok'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="h-4 w-4 mr-2 text-emerald-500 dark:text-emerald-400">₺</div>
                      <div>
                        <p className="font-bold text-emerald-600 dark:text-emerald-300 text-lg">
                          {shipment.totalAmount.toLocaleString('tr-TR')} ₺
                        </p>
                        <p className="text-gray-700 dark:text-gray-200 font-medium">Toplam Tutar</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Content - Expandable */}
                {expandedShipments.has(shipment.id) && (
                  <div className="p-6 animate-in slide-in-from-top duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Teslimat Bilgileri */}
                      <div className="space-y-4">
                        <div className="flex items-center text-gray-700 dark:text-gray-300 mb-3">
                          <MapPin className="h-5 w-5 mr-2 text-red-500" />
                          <h4 className="font-semibold">Teslimat Bilgileri</h4>
                        </div>
                        
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 space-y-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-red-600" />
                            <span className="font-medium text-red-900 dark:text-red-100">{shipment.customerName}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-red-600 mr-2">📞</span>
                            <span className="text-red-800 dark:text-red-200">{shipment.customerPhone}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-red-600 mr-2">✉️</span>
                            <span className="text-red-800 dark:text-red-200">{shipment.customerEmail}</span>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-2 text-red-600 mt-0.5" />
                            <span className="text-red-800 dark:text-red-200 leading-relaxed text-sm">
                              {shipment.address}, {shipment.city}
                            </span>
                          </div>
                        </div>

                        {shipment.deliveryDate && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Teslim Tarihi</span>
                              <span className="font-bold text-purple-900 dark:text-purple-100">
                                {new Date(shipment.deliveryDate).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Ürün Bilgileri */}
                      <div className="space-y-4">
                        <div className="flex items-center text-gray-700 dark:text-gray-300 mb-3">
                          <Package className="h-5 w-5 mr-2 text-green-500" />
                          <h4 className="font-semibold">Ürünler</h4>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <div className="space-y-3">
                            {shipment.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-700 last:border-b-0">
                                <div>
                                  <p className="font-medium text-green-900 dark:text-green-100">{item.productName}</p>
                                  <p className="text-sm text-green-700 dark:text-green-300">
                                    {item.quantity} adet × {item.unitPrice.toLocaleString('tr-TR')} ₺
                                  </p>
                                </div>
                                <span className="font-bold text-green-800 dark:text-green-200">
                                  {item.totalPrice.toLocaleString('tr-TR')} ₺
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-700">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-green-800 dark:text-green-200">Toplam</span>
                              <span className="text-xl font-bold text-green-900 dark:text-green-100">
                                {shipment.totalAmount.toLocaleString('tr-TR')} ₺
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}