'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart,
  FileSpreadsheet,
  FileText,
  Printer,
  BarChart,
  PieChart,
  Activity,
  Target,
  Calendar
} from 'lucide-react'
import Navigation from '../../components/Layout/Navigation'
import Header from '../../components/Layout/Header'
import { Loading } from '../../components/ui/Loading'
import { useToast } from '../../contexts/ToastContext'
import { ReportGenerator } from '../../components/Reports/ReportGenerator'

interface ReportData {
  totalSales: number
  totalShipments: number
  activeCustomers: number
  averageOrder: number
  salesGrowth: number
  shipmentGrowth: number
  customerGrowth: number
  orderGrowth: number
  monthlyData: Array<{
    month: string
    sales: number
    shipments: number
  }>
  cityPerformance: Array<{
    city: string
    sales: number
    shipments: number
    percentage: number
  }>
  categoryAnalysis: Array<{
    category: string
    sales: number
    percentage: number
  }>
  recentActivity: Array<{
    type: string
    description: string
    amount?: number
    date: string
  }>
}

export default function RaporlarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showError, showSuccess } = useToast()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30') // days
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/auth/signin')
    else fetchReportData()
  }, [session, status, router, selectedPeriod])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Fetch data from multiple endpoints
      const [dashboardResponse, shipmentsResponse, customersResponse, productsResponse] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/shipments'),
        fetch('/api/customers'),
        fetch('/api/products')
      ])

      const [dashboardData, shipmentsData, customersData, productsData] = await Promise.all([
        dashboardResponse.json(),
        shipmentsResponse.json(),
        customersResponse.json(),
        productsResponse.json()
      ])

      if (dashboardData.success && shipmentsData.success && customersData.success && productsData.success) {
        // Process the data for reports
        const processedData = processReportData(
          dashboardData.data,
          shipmentsData.data,
          customersData.data,
          productsData.data
        )
        setReportData(processedData)
      } else {
        showError('Veri yüklenemedi', 'Rapor verileri yüklenirken hata oluştu')
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Rapor verileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const processReportData = (dashboard: any, shipments: any[], customers: any[], products: any[]): ReportData => {
    // Calculate totals
    const totalSales = dashboard.totalRevenue?.value || 0
    const totalShipments = dashboard.totalShipments?.value || 0
    const activeCustomers = customers.filter(c => c.status === 'Aktif').length
    const averageOrder = totalShipments > 0 ? totalSales / totalShipments : 0

    // Calculate growth (mock for now - in real app, compare with previous period)
    const salesGrowth = dashboard.totalRevenue?.growth || 0
    const shipmentGrowth = dashboard.totalShipments?.growth || 0
    const customerGrowth = dashboard.totalCustomers?.growth || 0
    const orderGrowth = 8.5 // Mock

    // Process monthly data (last 6 months)
    const monthlyData = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('tr-TR', { month: 'short' })
      
      // Filter shipments for this month
      const monthShipments = shipments.filter(s => {
        const shipmentDate = new Date(s.createdAt)
        return shipmentDate.getMonth() === date.getMonth() && 
               shipmentDate.getFullYear() === date.getFullYear()
      })
      
      monthlyData.push({
        month: monthName,
        sales: monthShipments.reduce((sum, s) => sum + s.totalAmount, 0),
        shipments: monthShipments.length
      })
    }

    // City performance analysis
    const cityStats: { [key: string]: { sales: number, shipments: number } } = {}
    shipments.forEach(shipment => {
      const city = shipment.city || 'Belirtilmemiş'
      if (!cityStats[city]) {
        cityStats[city] = { sales: 0, shipments: 0 }
      }
      cityStats[city].sales += shipment.totalAmount
      cityStats[city].shipments += 1
    })

    const cityPerformance = Object.entries(cityStats)
      .map(([city, stats]) => ({
        city,
        sales: stats.sales,
        shipments: stats.shipments,
        percentage: totalSales > 0 ? (stats.sales / totalSales) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5) // Top 5 cities

    // Category analysis
    const categoryStats: { [key: string]: number } = {}
    products.forEach(product => {
      const category = product.category || 'Diğer'
      if (!categoryStats[category]) {
        categoryStats[category] = 0
      }
      // Estimate sales based on stock difference (mock calculation)
      categoryStats[category] += product.price * Math.max(0, 10 - product.stock)
    })

    const totalCategorySales = Object.values(categoryStats).reduce((sum, val) => sum + val, 0)
    const categoryAnalysis = Object.entries(categoryStats)
      .map(([category, sales]) => ({
        category,
        sales,
        percentage: totalCategorySales > 0 ? (sales / totalCategorySales) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales)

    // Recent activity
    const recentActivity = [
      ...shipments.slice(0, 3).map(s => ({
        type: 'shipment',
        description: `${s.customerName} - ${s.orderNumber}`,
        amount: s.totalAmount,
        date: s.createdAt
      })),
      ...customers.slice(0, 2).map(c => ({
        type: 'customer',
        description: `Yeni müşteri: ${c.name}`,
        date: new Date().toISOString()
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return {
      totalSales,
      totalShipments,
      activeCustomers,
      averageOrder,
      salesGrowth,
      shipmentGrowth,
      customerGrowth,
      orderGrowth,
      monthlyData,
      cityPerformance,
      categoryAnalysis,
      recentActivity
    }
  }

  const handleQuickReport = async (format: 'excel' | 'pdf' | 'print' = 'pdf') => {
    setDownloadingReport(format)
    try {
      // Calculate date range based on selected period
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - parseInt(selectedPeriod))

      const reportFilters = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reportType: 'sales',
        format: format === 'print' ? 'pdf' : format
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportFilters)
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        if (format === 'print') {
          // PDF yazdırma için yeni pencere aç
          const printWindow = window.open(url, '_blank')
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print()
            }
          }
          showSuccess('Yazdırma başlatıldı', 'Rapor yazdırma için hazırlandı')
        } else {
          // Dosya indirme
          const a = document.createElement('a')
          a.href = url
          const fileExtension = format === 'excel' ? 'xlsx' : 'pdf'
          a.download = `satis-raporu-${reportFilters.startDate}-${reportFilters.endDate}.${fileExtension}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          
          const formatNames = {
            excel: 'Excel',
            pdf: 'PDF'
          }
          showSuccess('Rapor indirildi', `${formatNames[format]} raporu başarıyla indirildi`)
        }
        
        window.URL.revokeObjectURL(url)
      } else {
        const errorData = await response.json()
        showError('Rapor oluşturulamadı', errorData.error || 'Lütfen tekrar deneyin')
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Rapor oluşturulurken hata oluştu')
    } finally {
      setDownloadingReport(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading size="lg" text="Raporlar yükleniyor..." />
        </div>
      </div>
    )
  }

  if (!session || !reportData) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <div className={`flex items-center ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        <span className="text-xs font-medium">
          {isPositive ? '+' : ''}{growth.toFixed(1)}% bu ay
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <Navigation />
      
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg mr-3">
                <BarChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Detaylı Raporlama
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Kapsamlı analiz raporları ve performans metrikleri
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="7">Son 7 Gün</option>
                <option value="30">Son 30 Gün</option>
                <option value="90">Son 3 Ay</option>
                <option value="365">Son 1 Yıl</option>
              </select>
              
              {/* Excel İndir */}
              <button 
                onClick={() => handleQuickReport('excel')}
                disabled={downloadingReport === 'excel'}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center text-sm"
                title="Excel İndir"
              >
                {downloadingReport === 'excel' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
              </button>

              {/* PDF İndir */}
              <button 
                onClick={() => handleQuickReport('pdf')}
                disabled={downloadingReport === 'pdf'}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center text-sm"
                title="PDF İndir"
              >
                {downloadingReport === 'pdf' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </button>

              {/* Yazdır */}
              <button 
                onClick={() => handleQuickReport('print')}
                disabled={downloadingReport === 'print'}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center text-sm"
                title="Yazdır"
              >
                {downloadingReport === 'print' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Printer className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-blue-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Satış</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.floor(reportData.totalSales / 1000)}K ₺
                </p>
                {formatGrowth(reportData.salesGrowth)}
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-green-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Sevkiyat</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {reportData.totalShipments}
                </p>
                {formatGrowth(reportData.shipmentGrowth)}
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-orange-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Müşteri</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {reportData.activeCustomers}
                </p>
                {formatGrowth(reportData.customerGrowth)}
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-purple-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Sipariş</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.floor(reportData.averageOrder / 1000)}K ₺
                </p>
                {formatGrowth(reportData.orderGrowth)}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Sales Trend */}
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Aylık Satış Trendi</h3>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Son 6 Ay</span>
            </div>
            
            <div className="h-64 flex items-end justify-between space-x-2">
              {reportData.monthlyData.map((data, index) => {
                const maxSales = Math.max(...reportData.monthlyData.map(d => d.sales))
                const height = maxSales > 0 ? (data.sales / maxSales) * 200 : 20
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-lg relative overflow-hidden">
                      <div 
                        className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-1000 ease-out flex items-end justify-center"
                        style={{ height: `${height}px`, minHeight: '20px' }}
                      >
                        <span className="text-white text-xs font-medium mb-1">
                          {data.sales > 0 ? `${Math.floor(data.sales / 1000)}K` : '0'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                      {data.month}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* City Performance */}
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Şehir Performansı</h3>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Top 5</span>
            </div>
            
            <div className="space-y-4">
              {reportData.cityPerformance.length > 0 ? (
                reportData.cityPerformance.map((city, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{city.city}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {city.shipments} sevkiyat
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(city.sales)}
                      </p>
                      <div className="w-20 bg-green-100 dark:bg-green-900/30 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${city.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz şehir verisi yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Analysis & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Analysis */}
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Kategori Dağılımı</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              {reportData.categoryAnalysis.length > 0 ? (
                reportData.categoryAnalysis.map((category, index) => {
                  const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500']
                  const color = colors[index % colors.length]
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {category.category}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`${color} h-2 rounded-full transition-all duration-1000`}
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <PieChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz kategori verisi yok</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Son Aktiviteler</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              {reportData.recentActivity.length > 0 ? (
                reportData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'shipment' 
                        ? 'bg-blue-100 dark:bg-blue-900/30' 
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      {activity.type === 'shipment' ? (
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.date).toLocaleDateString('tr-TR')}
                        </p>
                        {activity.amount && (
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(activity.amount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz aktivite yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Generator */}
        <ReportGenerator />
      </main>
    </div>
  )
}