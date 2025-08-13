'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Package, BarChart3, ShoppingCart, Users, TrendingUp, DollarSign, FileText } from 'lucide-react'
import Navigation from '../components/Layout/Navigation'
import Header from '../components/Layout/Header'
import { Loading } from '../components/ui/Loading'
import { useToast } from '../contexts/ToastContext'
import { RecentShipments } from '../components/Dashboard/RecentShipments'
import { ChartData } from '../components/Dashboard/ChartData'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showError } = useToast()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [recentShipments, setRecentShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/auth/signin')
  }, [session, status, router])

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats and recent shipments in parallel
      const [dashboardResponse, shipmentsResponse] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/shipments?limit=5')
      ])
      
      const dashboardData = await dashboardResponse.json()
      const shipmentsData = await shipmentsResponse.json()
      
      if (dashboardData.success) {
        setDashboardData(dashboardData.data)
      } else {
        showError('Dashboard verileri yüklenemedi', dashboardData.error)
      }
      
      if (shipmentsData.success) {
        setRecentShipments(shipmentsData.data.slice(0, 3)) // Show only 3 recent shipments
      }
      
    } catch (error) {
      showError('Bağlantı hatası', 'Dashboard verileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session, fetchDashboardData])

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
        {loading ? (
          <Loading size="lg" text="Dashboard yükleniyor..." />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Toplam Gelir</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {dashboardData?.totalRevenue?.value ? `${(dashboardData.totalRevenue.value / 1000).toFixed(1)}K ₺` : '0 ₺'}
                    </p>
                    <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{dashboardData?.totalRevenue?.growth || 0}% bu ay
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
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {dashboardData?.totalShipments?.value || 0}
                    </p>
                    <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{dashboardData?.totalShipments?.growth || 0}% bu ay
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
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Toplam Müşteri</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {dashboardData?.totalCustomers?.value || 0}
                    </p>
                    <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{dashboardData?.totalCustomers?.growth || 0}% bu ay
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
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Toplam Ürün</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {dashboardData?.totalProducts?.value || 0}
                    </p>
                    <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{dashboardData?.totalProducts?.growth || 0}% bu ay
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

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
              Tüm Sevkiyatları Görüntüle &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Shipments */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Son Sevkiyatlar</h3>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentShipments.length > 0 ? (
                recentShipments.map((shipment, index) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      case 'SHIPPED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }
                  }

                  const getStatusText = (status: string) => {
                    switch (status) {
                      case 'DELIVERED': return 'Teslim Edildi'
                      case 'PENDING': return 'Hazırlanıyor'
                      case 'SHIPPED': return 'Yolda'
                      default: return status
                    }
                  }

                  return (
                    <div key={shipment.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mr-3">
                            <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{shipment.orderNumber}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{shipment.customerName}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {shipment.itemCount} ürün
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Tarih: {shipment.createdAt}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                            {getStatusText(shipment.status)}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {shipment.deliveryDate || 'Tarih belirlenmedi'}
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {shipment.totalAmount.toLocaleString('tr-TR')} ₺
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz sevkiyat kaydı yok</p>
                  <Link 
                    href="/sevkiyat" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
                  >
                    İlk sevkiyatınızı oluşturun &rarr;
                  </Link>
                </div>
              )}
            </div>

            {/* Shipment Status Overview */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Sevkiyat Durumu</h3>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                            <div className="h-4 bg-gray-300 rounded w-20"></div>
                          </div>
                          <div className="h-4 bg-gray-300 rounded w-8"></div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gray-300 h-2 rounded-full w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const pendingCount = dashboardData?.pendingShipments?.value || 0
                      const completedCount = dashboardData?.completedShipments?.value || 0
                      const totalShipments = dashboardData?.totalShipments?.value || 1
                      
                      const statusData = [
                        { 
                          status: 'Hazırlanıyor', 
                          count: pendingCount, 
                          color: 'bg-yellow-500', 
                          percentage: Math.round((pendingCount / totalShipments) * 100) 
                        },
                        { 
                          status: 'Teslim Edildi', 
                          count: completedCount, 
                          color: 'bg-green-500', 
                          percentage: Math.round((completedCount / totalShipments) * 100) 
                        },
                        { 
                          status: 'Diğer', 
                          count: Math.max(0, totalShipments - pendingCount - completedCount), 
                          color: 'bg-blue-500', 
                          percentage: Math.max(0, 100 - Math.round((pendingCount / totalShipments) * 100) - Math.round((completedCount / totalShipments) * 100))
                        }
                      ]
                      
                      return statusData.map((item, index) => (
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
                      ))
                    })()}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {loading ? '...' : (dashboardData?.totalShipments?.value || 0)}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Toplam</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {loading ? '...' : `${Math.round(((dashboardData?.completedShipments?.value || 0) / (dashboardData?.totalShipments?.value || 1)) * 100)}%`}
                  </p>
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
                    Katalog Sayfasına Git &rarr;
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
                    Müşteriler Sayfasına Git &rarr;
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
                    Sevkiyat Sayfasına Git &rarr;
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Reports Section */}
        {!loading && dashboardData && (
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                  <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analitik Özet</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Son 7 günlük performans</p>
                </div>
              </div>
              <Link 
                href="/raporlar"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Detaylı Raporlar &rarr;
              </Link>
            </div>

            <ChartData chartData={dashboardData.chartData} />
          </div>
        )}

        {/* Detailed Reports Preview */}
        <div className="bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 rounded-2xl shadow-2xl border border-slate-700 dark:border-gray-700 p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg mr-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Detaylı Raporlar</h2>
                <p className="text-slate-300">Performans analizi ve iş zekası</p>
              </div>
            </div>
            <Link 
              href="/raporlar"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Tüm Raporları Görüntüle &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Aylık Satış Trendi */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Aylık Satış Trendi</h3>
              <div className="space-y-3">
                {dashboardData?.chartData && dashboardData.chartData.length > 0 ? dashboardData.chartData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-16 text-sm font-medium text-slate-300">
                      {new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (item.revenue / 50000) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400">
                      {item.revenue.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-slate-400">
                    <p>Henüz satış verisi yok</p>
                    <p className="text-xs mt-1">İlk sevkiyatınızı oluşturun</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">Son 7 gün satış performansı</p>
            </div>

            {/* Şehir Performansı */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Şehir Performansı</h3>
              <div className="space-y-4">
                {recentShipments && recentShipments.length > 0 ? (
                  (() => {
                    // Group shipments by city and calculate totals
                    const cityData: { [key: string]: number } = {}
                    recentShipments.forEach((shipment: any) => {
                      const city = shipment.city || 'Diğer'
                      cityData[city] = (cityData[city] || 0) + (shipment.totalAmount || 0)
                    })
                    
                    const cities = Object.entries(cityData)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 4)
                    
                    const colors = [
                      'from-emerald-400 to-green-500',
                      'from-blue-400 to-cyan-500', 
                      'from-purple-400 to-pink-500',
                      'from-orange-400 to-red-500'
                    ]
                    
                    return cities.map(([city, amount], index) => (
                      <div key={city} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[index]}`}></div>
                          <span className="text-slate-200 font-medium">{city}</span>
                        </div>
                        <span className="text-slate-100 font-semibold">
                          {amount.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                    ))
                  })()
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <p>Henüz şehir verisi yok</p>
                    <p className="text-xs mt-1">Sevkiyat ekleyince görünecek</p>
                  </div>
                )}
              </div>
            </div>

            {/* Kategori Dağılımı */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Kategori Dağılımı</h3>
              <div className="space-y-4">
                {dashboardData?.categoryDistribution && dashboardData.categoryDistribution.length > 0 ? (
                  dashboardData.categoryDistribution.map((item: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 font-medium text-sm">{item.category}</span>
                        <span className="text-white font-bold">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${
                            item.category === 'Yatak Odası' ? 'from-purple-500 to-pink-500' :
                            item.category === 'Oturma Odası' ? 'from-blue-500 to-cyan-500' :
                            'from-emerald-500 to-green-500'
                          } rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <p>Henüz kategori verisi yok</p>
                    <p className="text-xs mt-1">Ürün ekleyince görünecek</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                +{dashboardData?.totalRevenue?.growth || 0}%
              </div>
              <div className="text-sm text-slate-400">Aylık Büyüme</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {dashboardData?.totalShipments?.value > 0 
                  ? `${Math.round((dashboardData?.totalRevenue?.value || 0) / (dashboardData?.totalShipments?.value || 1)).toLocaleString('tr-TR')} ₺`
                  : '0 ₺'
                }
              </div>
              <div className="text-sm text-slate-400">Ortalama Sipariş</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {dashboardData?.completedShipments?.value > 0 
                  ? `${Math.round(((dashboardData?.completedShipments?.value || 0) / (dashboardData?.totalShipments?.value || 1)) * 100)}%`
                  : '0%'
                }
              </div>
              <div className="text-sm text-slate-400">Başarı Oranı</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {dashboardData?.totalCustomers?.value || 0}
              </div>
              <div className="text-sm text-slate-400">Aktif Müşteri</div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}