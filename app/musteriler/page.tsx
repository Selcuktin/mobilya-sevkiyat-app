'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Plus, Edit, Trash2, User, Package } from 'lucide-react'
import Navigation from '../../components/Layout/Navigation'
import Header from '../../components/Layout/Header'
import { Loading } from '../../components/ui/Loading'
import { useToast } from '../../contexts/ToastContext'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string | null
  status: string
}

export default function MusterilerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  })

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      const data = await response.json()
      
      if (data.success) {
        setCustomers(data.data)
      } else {
        showError('Veri yüklenemedi', data.error)
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Müşteri verileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/auth/signin')
    else fetchCustomers()
  }, [session, status, router, fetchCustomers])

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    setFormData({ name: '', email: '', phone: '', address: '', city: '' })
    setShowModal(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || '',
      city: customer.city || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      showError('Eksik bilgi', 'Ad, email ve telefon alanları gereklidir')
      return
    }

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (data.success) {
        showSuccess(
          editingCustomer ? 'Müşteri güncellendi' : 'Müşteri eklendi',
          editingCustomer ? 'Müşteri bilgileri başarıyla güncellendi' : 'Yeni müşteri başarıyla eklendi'
        )
        setShowModal(false)
        setEditingCustomer(null)
        fetchCustomers()
      } else {
        showError('İşlem hatası', data.error)
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Müşteri kaydedilirken hata oluştu')
    }
  }

  const deleteCustomer = async (id: string, name: string) => {
    if (!confirm(`${name} müşterisini silmek istediğinizden emin misiniz?`)) return

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        showSuccess('Müşteri silindi', 'Müşteri başarıyla silindi')
        fetchCustomers()
      } else {
        showError('Silme hatası', data.error)
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Müşteri silinirken hata oluştu')
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading size="lg" text="Müşteriler yükleniyor..." />
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
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg mr-3">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  Müşteri Yönetimi
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Müşteri bilgilerini yönetin ve düzenleyin
                </p>
              </div>
            </div>
            <button 
              onClick={handleAddCustomer}
              className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Müşteri
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🔍 Müşteri Arama</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Müşteri adı, telefon, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Filter className="h-4 w-4 mr-2" />
              {filteredCustomers.length} müşteri bulundu
            </div>
          </div>
        </div>

        {/* Customer Table */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'Müşteri bulunamadı' : 'Henüz müşteri yok'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm 
                ? 'Arama kriterlerinizi değiştirmeyi deneyin' 
                : 'İlk müşterinizi ekleyin'
              }
            </p>
            {!searchTerm && (
              <button 
                onClick={handleAddCustomer}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Yeni Müşteri Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Müşteri Listesi</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Müşteri
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İletişim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Konum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sipariş Bilgisi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {customer.city || 'Belirtilmemiş'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {customer.totalOrders} sipariş
                          </div>
                          <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {customer.totalSpent.toLocaleString('tr-TR')} ₺
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.status === 'Aktif' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditCustomer(customer)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                            title="Müşteri Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteCustomer(customer.id, customer.name)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                            title="Müşteri Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Müşteri adı soyadı"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="05XX XXX XX XX"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Şehir
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="İstanbul"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adres
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Müşteri adresi detayları"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingCustomer ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}