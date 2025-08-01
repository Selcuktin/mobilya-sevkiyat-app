'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Package, BarChart3, ShoppingCart, Users, TrendingUp, DollarSign, FileText } from 'lucide-react'
import Navigation from '../components/Layout/Navigation'
import Header from '../components/Layout/Header'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/auth/signin')
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to signin
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 relative overflow-hidden">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
      {/* Header */}
      <Header />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Toplam Satış</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">3.58M ₺</p>
                <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15.2% bu ay
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-green-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Toplam Sevkiyat</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">196</p>
                <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.4% bu ay
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-orange-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Aktif Müşteri</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">103</p>
                <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.1% bu ay
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-purple-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Ortalama Sipariş</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">18.3K ₺</p>
                <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +6.8% bu ay
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Section */}
        <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-3">
                <ShoppingCart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Son Sevkiyatlar</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Güncel sevkiyat durumları ve takip bilgileri</p>
              </div>
            </div>
            <Link 
              href="/sevkiyat"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              Tüm Sevkiyatları Görüntüle →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Shipments */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Son Sevkiyatlar</h3>
              
              {[
                {
                  code: 'SVK-2024-001',
                  customer: 'Ahmet Yılmaz',
                  product: 'Ada Yatak Odası Takımı',
                  purchaseDate: '2024-01-15',
                  status: 'Teslim Edildi',
                  date: '2024-01-18',
                  amount: '15.000 ₺',
                  statusColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                },
                {
                  code: 'SVK-2024-002',
                  customer: 'Fatma Demir',
                  product: 'Sandal Oturma Odası',
                  purchaseDate: '2024-01-16',
                  status: 'Yolda',
                  date: '2024-01-19',
                  amount: '12.000 ₺',
                  statusColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                },
                {
                  code: 'SVK-2024-003',
                  customer: 'Mehmet Kaya',
                  product: 'Klasik Yemek Odası',
                  purchaseDate: '2024-01-17',
                  status: 'Hazırlanıyor',
                  date: '2024-01-20',
                  amount: '18.000 ₺',
                  statusColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }
              ].map((shipment, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mr-3">
                        <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{shipment.code}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{shipment.customer}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{shipment.product}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Alım: {shipment.purchaseDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${shipment.statusColor}`}>
                        {shipment.status}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{shipment.date}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{shipment.amount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipment Status Overview */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Sevkiyat Durumu</h3>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
                <div className="space-y-4">
                  {[
                    { status: 'Hazırlanıyor', count: 8, color: 'bg-yellow-500', percentage: 40 },
                    { status: 'Yolda', count: 5, color: 'bg-blue-500', percentage: 25 },
                    { status: 'Teslim Edildi', count: 6, color: 'bg-green-500', percentage: 30 },
                    { status: 'İptal', count: 1, color: 'bg-red-500', percentage: 5 }
                  ].map((item, index) => (
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
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">20</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Bu Hafta</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">85%</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Başarı Oranı</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <Link href="/katalog" className="group block">
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 hover:rotate-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mr-4">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all">
                      Katalog & Stok
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                    Ürünlerinizi ve stoklarınızı yönetin
                  </p>
                  <div className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    Katalog Sayfasına Git →
                  </div>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/musteriler" className="group block">
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-purple-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 hover:rotate-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg mr-4">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-violet-700 transition-all">
                      Müşteri Yönetimi
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                    Müşteri bilgilerini kaydedin ve yönetin
                  </p>
                  <div className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-900/30 px-4 py-2 rounded-full group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                    Müşteriler Sayfasına Git →
                  </div>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/sevkiyat" className="group block">
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-orange-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 hover:rotate-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg mr-4">
                      <ShoppingCart className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent group-hover:from-orange-700 group-hover:to-amber-700 transition-all">
                      Sevkiyat Takip
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                    Sevkiyat süreçlerini takip edin ve yönetin
                  </p>
                  <div className="inline-flex items-center text-sm text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-900/30 px-4 py-2 rounded-full group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
                    Sevkiyat Sayfasına Git →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Reports Section */}
        <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Detaylı Raporlar</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Performans analizi ve iş zekası</p>
              </div>
            </div>
            <Link 
              href="/raporlar"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Tüm Raporları Görüntüle →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Monthly Sales Chart */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Aylık Satış Trendi</h3>
              <div className="h-32 flex items-end justify-between space-x-1">
                {[2.8, 2.2, 2.9, 3.1, 3.4, 3.58].map((value, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full bg-blue-200 dark:bg-blue-800/30 rounded-t-sm relative overflow-hidden">
                      <div 
                        className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-1000 ease-out"
                        style={{ 
                          height: `${(value / 4) * 80}px`,
                          minHeight: '8px'
                        }}
                      />
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{value}M</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 text-center mt-2">Son 6 ay satış performansı</p>
            </div>

            {/* Top Cities */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Şehir Performansı</h3>
              <div className="space-y-2">
                {[
                  { city: 'İstanbul', value: 850, percentage: 35 },
                  { city: 'Ankara', value: 620, percentage: 25 },
                  { city: 'İzmir', value: 480, percentage: 20 },
                  { city: 'Diğer', value: 530, percentage: 20 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-green-800 dark:text-green-200">{item.city}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-green-900 dark:text-green-100">{item.value}K ₺</span>
                      <div className="w-16 bg-green-200 dark:bg-green-800/30 rounded-full h-1 mt-1">
                        <div 
                          className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">Kategori Dağılımı</h3>
              <div className="space-y-3">
                {[
                  { category: 'Yatak Odası', percentage: 35, color: 'bg-purple-500' },
                  { category: 'Oturma Grubu', percentage: 28, color: 'bg-purple-400' },
                  { category: 'Yemek Odası', percentage: 22, color: 'bg-purple-300' },
                  { category: 'Diğer', percentage: 15, color: 'bg-purple-200' }
                ].map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-800 dark:text-purple-200">{item.category}</span>
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-100">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-purple-200 dark:bg-purple-800/30 rounded-full h-2">
                      <div 
                        className={`${item.color} h-2 rounded-full transition-all duration-1000`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}