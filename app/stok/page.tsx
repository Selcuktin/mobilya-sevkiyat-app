'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, Eye, Edit, Trash2, AlertTriangle, TrendingUp, Package, BarChart3 } from 'lucide-react'
import Navigation from '../../components/Layout/Navigation'
import Header from '../../components/Layout/Header'

// Mock data - gerçek uygulamada database'den gelecek
const initialStockData = [
  {
    id: 1,
    productName: 'Ada Yatak Odası Takımı',
    code: 'YOT-001',
    category: 'Yatak Odası',
    currentStock: 15,
    minStock: 5,
    maxStock: 30,
    unitPrice: 15000,
    totalValue: 225000,
    status: 'Stokta',
    lastUpdated: '2024-01-15'
  },
  {
    id: 2,
    productName: 'Sandal Oturma Odası Takımı',
    code: 'OTS-002',
    category: 'Oturma Odası',
    currentStock: 3,
    minStock: 5,
    maxStock: 20,
    unitPrice: 12000,
    totalValue: 36000,
    status: 'Az Stok',
    lastUpdated: '2024-01-14'
  },
  {
    id: 3,
    productName: 'Klasik Yemek Odası Takımı',
    code: 'YEM-003',
    category: 'Yemek Odası',
    currentStock: 0,
    minStock: 3,
    maxStock: 15,
    unitPrice: 18000,
    totalValue: 0,
    status: 'Tükendi',
    lastUpdated: '2024-01-13'
  },
  {
    id: 4,
    productName: 'Modern TV Ünitesi',
    code: 'TVU-004',
    category: 'Oturma Odası',
    currentStock: 25,
    minStock: 8,
    maxStock: 20,
    unitPrice: 3500,
    totalValue: 87500,
    status: 'Fazla Stok',
    lastUpdated: '2024-01-16'
  }
]

export default function StokPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stockData, setStockData] = useState(initialStockData)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tüm Kategoriler')
  const [selectedStatus, setSelectedStatus] = useState('Tüm Durumlar')

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

  const categories = ['Tüm Kategoriler', 'Yatak Odası', 'Oturma Odası', 'Yemek Odası']
  const statusOptions = ['Tüm Durumlar', 'Stokta', 'Az Stok', 'Tükendi', 'Fazla Stok']

  const filteredData = stockData.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Tüm Kategoriler' || item.category === selectedCategory
    const matchesStatus = selectedStatus === 'Tüm Durumlar' || item.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const updateStockStatus = (currentStock: number, minStock: number, maxStock: number) => {
    if (currentStock === 0) return 'Tükendi'
    if (currentStock < minStock) return 'Az Stok'
    if (currentStock > maxStock) return 'Fazla Stok'
    return 'Stokta'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Stokta': return 'bg-green-100 text-green-800'
      case 'Az Stok': return 'bg-yellow-100 text-yellow-800'
      case 'Tükendi': return 'bg-red-100 text-red-800'
      case 'Fazla Stok': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Az Stok': return <AlertTriangle className="h-4 w-4" />
      case 'Tükendi': return <AlertTriangle className="h-4 w-4" />
      case 'Fazla Stok': return <TrendingUp className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const totalValue = filteredData.reduce((sum, item) => sum + item.totalValue, 0)

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
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg mr-3">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Stok Yönetimi</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Ürün stoklarını takip edin ve yönetin
                </p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              Yeni Ürün
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Az Stok</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tükenen</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Değer</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalValue.toLocaleString('tr-TR')} ₺
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Arama ve Filtreleme</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ürün adı, stok kodu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              {filteredData.length} ürün bulundu
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Stok Listesi</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok Kodu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mevcut Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min/Max
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Birim Fiyat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.productName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.currentStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.minStock} / {item.maxStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.unitPrice.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1">{item.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          title="Stok Detayları"
                          onClick={() => alert(`${item.productName} detayları görüntüleniyor`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          title="Stok Düzenle"
                          onClick={() => {
                            const newStock = prompt(`${item.productName} için yeni stok miktarı:`, item.currentStock.toString())
                            if (newStock && !isNaN(Number(newStock))) {
                              const newStockNum = Number(newStock)
                              const newTotalValue = newStockNum * item.unitPrice
                              const newStatus = updateStockStatus(newStockNum, item.minStock, item.maxStock)
                              
                              setStockData(stockData.map(stock => 
                                stock.id === item.id 
                                  ? {
                                      ...stock,
                                      currentStock: newStockNum,
                                      totalValue: newTotalValue,
                                      status: newStatus,
                                      lastUpdated: new Date().toISOString().split('T')[0]
                                    }
                                  : stock
                              ))
                              alert('Stok başarıyla güncellendi!')
                            }
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          title="Ürünü Sil"
                          onClick={() => {
                            if (confirm(`${item.productName} ürünü silinecek. Emin misiniz?`)) {
                              setStockData(stockData.filter(stock => stock.id !== item.id))
                              alert('Ürün başarıyla silindi!')
                            }
                          }}
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

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">Stok verisi bulunamadı</div>
              <p className="text-gray-600">Arama kriterlerinizi değiştirmeyi deneyin</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}