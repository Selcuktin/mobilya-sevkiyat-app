'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, Plus, Eye, Edit, Trash2, Truck, Calendar, MapPin, Package, User, Fuel, DollarSign } from 'lucide-react'
import Navigation from '../../components/Layout/Navigation'
import Header from '../../components/Layout/Header'

// Mock data
const initialShipments = [
  {
    id: 1,
    shipmentCode: 'SVK-2024-001',
    customerName: 'Ahmet Yılmaz',
    customerPhone: '0532 123 45 67',
    address: 'Kadıköy Mah. Bağdat Cad. No:123 Kadıköy/İstanbul',
    shipmentDate: '2024-01-15',
    deliveryDate: '2024-01-18',
    status: 'Teslim Edildi',
    amount: 15000,
    products: ['Ada Yatak Odası Takımı', 'Komodin (2 adet)'],
    notes: 'Müşteri evde, teslim edildi',
    vehicle: {
      plate: '34 ABC 123',
      type: 'Kamyonet',
      driver: 'Ali Veli',
      driverPhone: '0532 111 22 33'
    },
    fuel: {
      cost: 450,
      distance: 85,
      consumption: '12.5 L/100km'
    }
  },
  {
    id: 2,
    shipmentCode: 'SVK-2024-002',
    customerName: 'Fatma Demir',
    customerPhone: '0533 987 65 43',
    address: 'Çankaya Mah. Atatürk Blv. No:456 Çankaya/Ankara',
    shipmentDate: '2024-01-16',
    deliveryDate: '2024-01-19',
    status: 'Yolda',
    amount: 12000,
    products: ['Sandal Oturma Odası', 'Sehpa'],
    notes: 'Kargo şirketine teslim edildi',
    vehicle: {
      plate: '06 XYZ 789',
      type: 'Kamyon',
      driver: 'Mehmet Özkan',
      driverPhone: '0533 444 55 66'
    },
    fuel: {
      cost: 680,
      distance: 450,
      consumption: '18.2 L/100km'
    }
  },
  {
    id: 3,
    shipmentCode: 'SVK-2024-003',
    customerName: 'Mehmet Kaya',
    customerPhone: '0534 555 44 33',
    address: 'Konak Mah. Cumhuriyet Cad. No:789 Konak/İzmir',
    shipmentDate: '2024-01-17',
    deliveryDate: '2024-01-20',
    status: 'Hazırlanıyor',
    amount: 18000,
    products: ['Klasik Yemek Odası', 'Büfe', 'Vitrin'],
    notes: 'Ürün ambalajlanıyor',
    vehicle: {
      plate: '35 DEF 456',
      type: 'Tır',
      driver: 'Hasan Yılmaz',
      driverPhone: '0534 777 88 99'
    },
    fuel: {
      cost: 850,
      distance: 520,
      consumption: '22.8 L/100km'
    }
  }
]

export default function SevkiyatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [shipments, setShipments] = useState(initialShipments)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingShipment, setEditingShipment] = useState<any>(null)
  const [expandedShipments, setExpandedShipments] = useState<Set<number>>(new Set())
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    shipmentDate: '',
    deliveryDate: '',
    status: 'Hazırlanıyor',
    amount: '',
    notes: '',
    products: '',
    vehiclePlate: '',
    vehicleType: 'Kamyonet',
    driverName: '',
    driverPhone: '',
    fuelCost: '',
    distance: '',
    consumption: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/auth/signin')
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const filteredShipments = shipments.filter(shipment =>
    shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.shipmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.customerPhone.includes(searchTerm)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Teslim Edildi': return 'bg-green-100 text-green-800'
      case 'Yolda': return 'bg-blue-100 text-blue-800'
      case 'Hazırlanıyor': return 'bg-yellow-100 text-yellow-800'
      case 'İptal': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleShipmentDetails = (shipmentId: number) => {
    const newExpanded = new Set(expandedShipments)
    if (newExpanded.has(shipmentId)) {
      newExpanded.delete(shipmentId)
    } else {
      newExpanded.add(shipmentId)
    }
    setExpandedShipments(newExpanded)
  }

  const handleAddShipment = () => {
    setEditingShipment(null)
    setFormData({
      customerName: '',
      customerPhone: '',
      address: '',
      shipmentDate: '',
      deliveryDate: '',
      status: 'Hazırlanıyor',
      amount: '',
      notes: '',
      products: '',
      vehiclePlate: '',
      vehicleType: 'Kamyonet',
      driverName: '',
      driverPhone: '',
      fuelCost: '',
      distance: '',
      consumption: ''
    })
    setShowModal(true)
  }

  const handleEditShipment = (shipment: any) => {
    setEditingShipment(shipment)
    setFormData({
      customerName: shipment.customerName,
      customerPhone: shipment.customerPhone,
      address: shipment.address,
      shipmentDate: shipment.shipmentDate,
      deliveryDate: shipment.deliveryDate,
      status: shipment.status,
      amount: shipment.amount.toString(),
      notes: shipment.notes,
      products: shipment.products.join('\n'),
      vehiclePlate: shipment.vehicle.plate,
      vehicleType: shipment.vehicle.type,
      driverName: shipment.vehicle.driver,
      driverPhone: shipment.vehicle.driverPhone,
      fuelCost: shipment.fuel.cost.toString(),
      distance: shipment.fuel.distance.toString(),
      consumption: shipment.fuel.consumption
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Shipment form submitted:', formData)
    
    if (editingShipment) {
      // Sevkiyat güncelleme
      setShipments(shipments.map(shipment => 
        shipment.id === editingShipment.id 
          ? {
              ...shipment,
              customerName: formData.customerName,
              customerPhone: formData.customerPhone,
              address: formData.address,
              shipmentDate: formData.shipmentDate,
              deliveryDate: formData.deliveryDate,
              status: formData.status,
              amount: parseInt(formData.amount) || shipment.amount,
              notes: formData.notes,
              products: formData.products.split('\n').filter(p => p.trim()),
              vehicle: {
                plate: formData.vehiclePlate,
                type: formData.vehicleType,
                driver: formData.driverName,
                driverPhone: formData.driverPhone
              },
              fuel: {
                cost: parseInt(formData.fuelCost) || 0,
                distance: parseInt(formData.distance) || 0,
                consumption: formData.consumption
              }
            }
          : shipment
      ))
      alert('Sevkiyat başarıyla güncellendi!')
    } else {
      // Yeni sevkiyat ekleme
      const newShipment = {
        id: Math.max(...shipments.map(s => s.id)) + 1,
        shipmentCode: `SVK-2024-${String(Math.max(...shipments.map(s => s.id)) + 1).padStart(3, '0')}`,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        address: formData.address,
        shipmentDate: formData.shipmentDate,
        deliveryDate: formData.deliveryDate,
        status: formData.status,
        amount: parseInt(formData.amount) || 0,
        products: formData.products ? formData.products.split('\n').filter(p => p.trim()) : ['Yeni Ürün'],
        notes: formData.notes,
        vehicle: {
          plate: formData.vehiclePlate,
          type: formData.vehicleType,
          driver: formData.driverName,
          driverPhone: formData.driverPhone
        },
        fuel: {
          cost: parseInt(formData.fuelCost) || 0,
          distance: parseInt(formData.distance) || 0,
          consumption: formData.consumption
        }
      }
      setShipments([...shipments, newShipment])
      alert('Sevkiyat başarıyla eklendi!')
    }
    
    setShowModal(false)
    setEditingShipment(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />

      {/* Navigation */}
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Sevkiyat Takip Sistemi</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Sevkiyat süreçlerini takip edin ve yönetin
                </p>
              </div>
            </div>
            <button 
              onClick={handleAddShipment}
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
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option>Sevkiyat Durumu</option>
              <option>Hazırlanıyor</option>
              <option>Yolda</option>
              <option>Teslim Edildi</option>
              <option>İptal</option>
            </select>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option>Tarih Aralığı</option>
              <option>Bugün</option>
              <option>Bu Hafta</option>
              <option>Bu Ay</option>
            </select>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Filter className="h-4 w-4 mr-2" />
              {filteredShipments.length} sevkiyat bulundu
            </div>
          </div>
        </div>

        {/* Compact Shipment Cards */}
        <div className="space-y-4">
          {filteredShipments.map((shipment) => (
            <div key={shipment.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Compact Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-white">
                    <Truck className="h-6 w-6 mr-3" />
                    <div>
                      <h3 className="text-lg font-bold">{shipment.shipmentCode}</h3>
                      <p className="text-blue-100 text-sm">{shipment.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(shipment.status)}`}>
                      {shipment.status}
                    </span>
                    <button 
                      onClick={() => toggleShipmentDetails(shipment.id)}
                      className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-white text-sm font-medium"
                      title={expandedShipments.has(shipment.id) ? "Detayları Gizle" : "Detayları Göster"}
                    >
                      {expandedShipments.has(shipment.id) ? "Detayları Gizle" : "Detayları Göster"}
                    </button>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditShipment(shipment)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        title="Sevkiyat Düzenle"
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Bu sevkiyatı silmek istediğinizden emin misiniz?')) {
                            setShipments(shipments.filter(s => s.id !== shipment.id))
                            alert('Sevkiyat başarıyla silindi!')
                          }
                        }}
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
                    <Truck className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{shipment.vehicle.plate}</p>
                      <p className="text-gray-700 dark:text-gray-200 font-medium">{shipment.vehicle.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-green-500 dark:text-green-400" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{shipment.products.length} Ürün</p>
                      <p className="text-gray-700 dark:text-gray-200 font-medium truncate">{shipment.products[0]}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-emerald-500 dark:text-emerald-400" />
                    <div>
                      <p className="font-bold text-emerald-600 dark:text-emerald-300 text-lg">{shipment.amount.toLocaleString('tr-TR')} ₺</p>
                      <p className="text-gray-700 dark:text-gray-200 font-medium">Toplam Tutar</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Content - Expandable */}
              {expandedShipments.has(shipment.id) && (
                <div className="p-6 animate-in slide-in-from-top duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Teslimat Bilgileri */}
                    <div className="space-y-4">
                      <div className="flex items-center text-gray-700 mb-3">
                        <MapPin className="h-5 w-5 mr-2 text-red-500" />
                        <h4 className="font-semibold">Teslimat Bilgileri</h4>
                      </div>
                      
                      <div className="bg-red-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-red-600" />
                          <span className="font-medium text-red-900">{shipment.customerName}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-red-600 mr-2">📞</span>
                          <span className="text-red-800">{shipment.customerPhone}</span>
                        </div>
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 text-red-600 mt-0.5" />
                          <span className="text-red-800 leading-relaxed text-sm">{shipment.address}</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-emerald-700">Toplam Tutar</span>
                          <span className="text-xl font-bold text-emerald-800">
                            {shipment.amount.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Araç ve Şoför Bilgileri */}
                    <div className="space-y-4">
                      <div className="flex items-center text-gray-700 mb-3">
                        <Truck className="h-5 w-5 mr-2 text-blue-500" />
                        <h4 className="font-semibold">Araç & Şoför</h4>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Araç Plakası</span>
                          <span className="font-mono font-bold text-blue-900">{shipment.vehicle.plate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Araç Tipi</span>
                          <span className="font-medium text-blue-900">{shipment.vehicle.type}</span>
                        </div>
                        <div className="border-t border-blue-200 pt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-blue-700">Şoför</span>
                            <span className="font-medium text-blue-900">{shipment.vehicle.driver}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-700">Telefon</span>
                            <span className="text-sm text-blue-800">{shipment.vehicle.driverPhone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Yakıt Bilgileri */}
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <Fuel className="h-4 w-4 mr-2 text-orange-500" />
                          <span className="font-medium text-orange-800">Yakıt Bilgileri</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-orange-700">Mesafe</span>
                            <span className="font-medium text-orange-900">{shipment.fuel.distance} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700">Tüketim</span>
                            <span className="font-medium text-orange-900">{shipment.fuel.consumption}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-orange-200">
                            <span className="text-orange-700 font-medium">Yakıt Maliyeti</span>
                            <span className="font-bold text-orange-900">{shipment.fuel.cost} ₺</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ürün ve Tarih Bilgileri */}
                    <div className="space-y-4">
                      <div className="flex items-center text-gray-700 mb-3">
                        <Package className="h-5 w-5 mr-2 text-green-500" />
                        <h4 className="font-semibold">Ürünler & Tarihler</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-green-50 rounded-lg p-4">
                          <h5 className="font-medium text-green-800 mb-2">Sevk Edilen Ürünler</h5>
                          <ul className="space-y-1">
                            {shipment.products.map((product, index) => (
                              <li key={index} className="flex items-center text-sm text-green-700">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                {product}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="text-sm font-medium text-blue-800">Sevkiyat</span>
                            </div>
                            <span className="text-sm font-bold text-blue-900">{shipment.shipmentDate}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                              <span className="text-sm font-medium text-purple-800">Teslim</span>
                            </div>
                            <span className="text-sm font-bold text-purple-900">{shipment.deliveryDate}</span>
                          </div>
                        </div>

                        {shipment.notes && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h6 className="text-xs font-medium text-gray-600 mb-1">Notlar</h6>
                            <p className="text-sm text-gray-700">{shipment.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Add Shipment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingShipment ? 'Sevkiyat Düzenle' : 'Yeni Sevkiyat Ekle'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Müşteri Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Müşteri adı soyadı"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="05XX XXX XX XX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sevkiyat Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.shipmentDate}
                    onChange={(e) => setFormData({...formData, shipmentDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teslim Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sevkiyat Durumu
                </label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Hazırlanıyor</option>
                  <option>Yolda</option>
                  <option>Teslim Edildi</option>
                  <option>İptal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar (₺)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teslimat Adresi
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Teslimat adresi detayları"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ürünler (Her satırda bir ürün)
                </label>
                <textarea
                  value={formData.products}
                  onChange={(e) => setFormData({...formData, products: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Ada Yatak Odası Takımı&#10;Komodin (2 adet)&#10;Şifonyer"
                />
              </div>

              {/* Araç ve Şoför Bilgileri */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-blue-600" />
                  Araç ve Şoför Bilgileri
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Araç Plakası
                    </label>
                    <input
                      type="text"
                      value={formData.vehiclePlate}
                      onChange={(e) => setFormData({...formData, vehiclePlate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="34 ABC 123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Araç Tipi
                    </label>
                    <select 
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>Kamyonet</option>
                      <option>Kamyon</option>
                      <option>Tır</option>
                      <option>Minibüs</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şoför Adı
                    </label>
                    <input
                      type="text"
                      value={formData.driverName}
                      onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ali Veli"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şoför Telefonu
                    </label>
                    <input
                      type="tel"
                      value={formData.driverPhone}
                      onChange={(e) => setFormData({...formData, driverPhone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>

              {/* Yakıt Bilgileri */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <Fuel className="h-5 w-5 mr-2 text-orange-600" />
                  Yakıt ve Mesafe Bilgileri
                </h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mesafe (km)
                    </label>
                    <input
                      type="number"
                      value={formData.distance}
                      onChange={(e) => setFormData({...formData, distance: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="85"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tüketim
                    </label>
                    <input
                      type="text"
                      value={formData.consumption}
                      onChange={(e) => setFormData({...formData, consumption: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12.5 L/100km"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yakıt Maliyeti (₺)
                    </label>
                    <input
                      type="number"
                      value={formData.fuelCost}
                      onChange={(e) => setFormData({...formData, fuelCost: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="450"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Ek notlar ve açıklamalar"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingShipment ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  )
}