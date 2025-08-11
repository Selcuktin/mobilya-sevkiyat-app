'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X, Calendar } from 'lucide-react'
import Navigation from '../../../components/Layout/Navigation'
import Header from '../../../components/Layout/Header'
import { Loading } from '../../../components/ui/Loading'
import { useToast } from '../../../contexts/ToastContext'

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

export default function YeniSevkiyatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    city: '',
    customerName: '',
    deliveryDate: '',
    status: 'Hazırlanıyor',
    productId: '',
    quantity: 1,
    totalAmount: 0,
    address: ''
  })

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Ürünler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/auth/signin')
    else fetchProducts()
  }, [session, status, router, fetchProducts])

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setFormData({
        ...formData,
        productId,
        totalAmount: product.price * formData.quantity
      })
    } else {
      setFormData({
        ...formData,
        productId: '',
        totalAmount: 0
      })
    }
  }

  const handleQuantityChange = (quantity: number) => {
    const product = products.find(p => p.id === formData.productId)
    const totalAmount = product ? product.price * quantity : 0
    
    setFormData({
      ...formData,
      quantity,
      totalAmount
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      // Create customer first
      const customerData = {
        name: formData.customerName || 'Anonim Müşteri',
        email: null,
        phone: null,
        address: formData.address || null,
        city: formData.city || null
      }

      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      })

      const customerResult = await customerResponse.json()
      
      if (!customerResult.success) {
        showError('Müşteri oluşturma hatası', customerResult.error)
        return
      }
      
      // Create shipment
      const items = formData.productId ? [{
        productId: formData.productId,
        quantity: formData.quantity
      }] : []

      const shipmentData = {
        customerId: customerResult.data.id,
        address: formData.address || '',
        city: formData.city || '',
        deliveryDate: formData.deliveryDate || null,
        items: items
      }

      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData)
      })

      const data = await response.json()
      
      if (data.success) {
        showSuccess('Sevkiyat oluşturuldu', 'Yeni sevkiyat başarıyla oluşturuldu')
        router.push('/sevkiyat')
      } else {
        showError('Oluşturma hatası', data.error)
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Sevkiyat oluşturulurken hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading size="lg" text="Yükleniyor..." />
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modal-style Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Yeni Sevkiyat Ekle
            </h1>
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Row 1: Şehir & Alıcı Kişi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Şehir
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Şehir seçin</option>
                  <option value="İstanbul">İstanbul</option>
                  <option value="Ankara">Ankara</option>
                  <option value="İzmir">İzmir</option>
                  <option value="Bursa">Bursa</option>
                  <option value="Antalya">Antalya</option>
                  <option value="Adana">Adana</option>
                  <option value="Konya">Konya</option>
                  <option value="Gaziantep">Gaziantep</option>
                  <option value="Kayseri">Kayseri</option>
                  <option value="Mersin">Mersin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alıcı Kişi
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Alıcı kişi adı"
                />
              </div>
            </div>

            {/* Row 2: Sevkiyat Tarihi & Sevkiyat Durumu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sevkiyat Tarihi
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Tarih seçin"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sevkiyat Durumu
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Hazırlanıyor">Hazırlanıyor</option>
                  <option value="Yolda">Yolda</option>
                  <option value="Teslim Edildi">Teslim Edildi</option>
                  <option value="İptal">İptal</option>
                </select>
              </div>
            </div>

            {/* Row 3: Mobilya Takımı & Adet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mobilya Takımı
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Mobilya takımı seçin</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.price.toLocaleString('tr-TR')} ₺
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adet
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Toplam Tutar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Toplam Tutar (₺)
              </label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold text-lg"
                placeholder="0"
              />
            </div>

            {/* Teslimat Adresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teslimat Adresi
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Teslimat adresini girin"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Ekleniyor...
                  </>
                ) : (
                  'Ekle'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}