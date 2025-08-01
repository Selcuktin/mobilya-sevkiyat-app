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
  Zap
} from 'lucide-react'
import Navigation from '../../components/Layout/Navigation'
import Header from '../../components/Layout/Header'

// Real data from other pages
const realShipments = [
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
    city: 'İstanbul',
    category: 'Yatak Odası'
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
    city: 'Ankara',
    category: 'Oturma Odası'
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
    city: 'İzmir',
    category: 'Yemek Odası'
  }
]

const realCustomers = [
  {
    id: 1,
    name: 'Esra Yılmaz',
    phone: '0532 123 45 67',
    city: 'İstanbul',
    orderCount: 3,
    totalAmount: 45000,
    lastOrder: '2024-01-15'
  },
  {
    id: 2,
    name: 'Mehmet Kaya',
    phone: '0533 987 65 43',
    city: 'Ankara',
    orderCount: 2,
    totalAmount: 28000,
    lastOrder: '2024-01-12'
  },
  {
    id: 3,
    name: 'Ayşe Demir',
    phone: '0534 555 44 33',
    city: 'İzmir',
    orderCount: 1,
    totalAmount: 15000,
    lastOrder: '2024-01-10'
  }
]

const realProducts = [
  {
    id: 1,
    name: 'Ada Yatak Odası Takımı',
    category: 'Yatak Odası',
    price: 15000,
    stock: 15
  },
  {
    id: 2,
    name: 'Sandal Oturma Odası Takımı',
    category: 'Oturma Odası',
    price: 12000,
    stock: 3
  },
  {
    id: 3,
    name: 'Klasik Yemek Odası Takımı',
    category: 'Yemek Odası',
    price: 18000,
    stock: 0
  },
  {
    id: 4,
    name: 'Modern TV Ünitesi',
    category: 'Oturma Odası',
    price: 3500,
    stock: 25
  }
]

// Calculate real report data
const calculateReportData = () => {
  // Toplam satış ve sevkiyat
  const totalSales = realShipments.reduce((sum, shipment) => sum + shipment.amount, 0)
  const totalShipments = realShipments.length
  const activeCustomers = realCustomers.length
  const averageOrder = totalSales / totalShipments

  // Şehir bazında performans
  const cityPerformance = realShipments.reduce((acc: any[], shipment) => {
    const existingCity = acc.find(city => city.city === shipment.city)
    if (existingCity) {
      existingCity.shipments += 1
      existingCity.revenue += shipment.amount
    } else {
      acc.push({
        city: shipment.city,
        shipments: 1,
        revenue: shipment.amount,
        growth: Math.random() * 15 + 5 // Simulated growth
      })
    }
    return acc
  }, []).sort((a, b) => b.revenue - a.revenue)

  // Kategori analizi
  const categoryTotals = realShipments.reduce((acc: any, shipment) => {
    if (!acc[shipment.category]) {
      acc[shipment.category] = 0
    }
    acc[shipment.category] += shipment.amount
    return acc
  }, {})

  const categoryAnalysis = Object.entries(categoryTotals).map(([category, value]: [string, any]) => ({
    category,
    value,
    percentage: Math.round((value / totalSales) * 100)
  })).sort((a, b) => b.value - a.value)

  // Aylık trend (simulated data based on real totals)
  const monthlyTrend = [
    { month: 'Ocak', sales: Math.round(totalSales * 0.8), shipments: Math.round(totalShipments * 0.7) },
    { month: 'Şubat', sales: Math.round(totalSales * 0.6), shipments: Math.round(totalShipments * 0.8) },
    { month: 'Mart', sales: Math.round(totalSales * 0.9), shipments: Math.round(totalShipments * 0.9) },
    { month: 'Nisan', sales: Math.round(totalSales * 0.85), shipments: Math.round(totalShipments * 0.85) },
    { month: 'Mayıs', sales: Math.round(totalSales * 0.95), shipments: Math.round(totalShipments * 0.95) },
    { month: 'Haziran', sales: totalSales, shipments: totalShipments }
  ]

  return {
    summary: {
      totalSales,
      totalShipments,
      activeCustomers,
      averageOrder,
      trends: {
        sales: 15.2,
        shipments: 8.4,
        customers: 12.1,
        revenue: 6.8
      }
    },
    monthlyTrend,
    cityPerformance,
    categoryAnalysis,
    detailedMetrics: [
      { title: 'Genel Analiz', value: `${(totalSales / 1000).toFixed(0)}K ₺`, change: '+15.2%', positive: true },
      { title: 'Satış Raporları', value: `${totalShipments} Adet`, change: '+8.4%', positive: true },
      { title: 'Performans', value: `${(averageOrder / 1000).toFixed(1)}K ₺`, change: '+12.1%', positive: true },
      { title: 'Finansal', value: `${activeCustomers} Müşteri`, change: '+6.8%', positive: true }
    ]
  }
}

const reportData = calculateReportData()

export default function RaporlarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState('Son 6 Ay')
  const [showExportMenu, setShowExportMenu] = useState(false)

  const exportToExcel = () => {
    try {
      // Detaylı Excel export logic
      const data = [
        ['MOBILYA SATIŞ RAPORU - ' + selectedPeriod.toUpperCase()],
        ['Rapor Tarihi: ' + new Date().toLocaleDateString('tr-TR')],
        [],
        ['ÖZET BİLGİLER'],
        ['Rapor Türü', 'Değer', 'Değişim', 'Durum'],
        ['Toplam Satış', reportData.summary.totalSales.toLocaleString('tr-TR') + ' ₺', '+15.2%', 'Artış'],
        ['Toplam Sevkiyat', reportData.summary.totalShipments + ' Adet', '+8.4%', 'Artış'],
        ['Aktif Müşteri', reportData.summary.activeCustomers + ' Kişi', '+12.1%', 'Artış'],
        ['Ortalama Sipariş', Math.round(reportData.summary.averageOrder).toLocaleString('tr-TR') + ' ₺', '+6.8%', 'Artış'],
        [],
        ['AYLIK TREND ANALİZİ'],
        ['Ay', 'Satış (₺)', 'Sevkiyat (Adet)', 'Büyüme (%)'],
        ...reportData.monthlyTrend.map((month, index) => [
          month.month,
          month.sales.toLocaleString('tr-TR') + ' ₺',
          month.shipments + ' Adet',
          index > 0 ? '+' + (((month.sales - reportData.monthlyTrend[index-1].sales) / reportData.monthlyTrend[index-1].sales) * 100).toFixed(1) + '%' : '0%'
        ]),
        [],
        ['ŞEHİR BAZINDA PERFORMANS'],
        ['Şehir', 'Sevkiyat (Adet)', 'Gelir (₺)', 'Büyüme (%)', 'Pazar Payı (%)'],
        ...reportData.cityPerformance.map(city => [
          city.city,
          city.shipments + ' Adet',
          city.revenue.toLocaleString('tr-TR') + ' ₺',
          '+' + city.growth.toFixed(1) + '%',
          ((city.revenue / reportData.summary.totalSales) * 100).toFixed(1) + '%'
        ]),
        [],
        ['KATEGORİ ANALİZİ'],
        ['Kategori', 'Yüzde (%)', 'Değer (₺)', 'Hedef (%)', 'Performans'],
        ...reportData.categoryAnalysis.map(cat => [
          cat.category,
          cat.percentage + '%',
          cat.value.toLocaleString('tr-TR') + ' ₺',
          '33%', // Hedef yüzde (3 kategori için)
          cat.percentage >= 33 ? 'Hedef Üstü' : 'Hedef Altı'
        ]),
        [],
        ['DETAYLI METRİKLER'],
        ['Metrik', 'Değer', 'Değişim', 'Trend'],
        ...reportData.detailedMetrics.map(metric => [
          metric.title,
          metric.value,
          metric.change,
          metric.positive ? 'Pozitif' : 'Negatif'
        ])
      ]
      
      // UTF-8 BOM ekleyerek Türkçe karakterleri destekle
      const BOM = '\uFEFF'
      const csvContent = BOM + data.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n')
      
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      })
      
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `Mobilya_Detayli_Rapor_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setShowExportMenu(false)
      
      // Başarı mesajı
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center'
      successDiv.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        Excel raporu başarıyla indirildi!
      `
      document.body.appendChild(successDiv)
      setTimeout(() => {
        document.body.removeChild(successDiv)
      }, 3000)
      
    } catch (error) {
      console.error('Excel export error:', error)
      alert('Rapor indirme sırasında bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  const exportToPDF = () => {
    try {
      // PDF için HTML içeriği oluştur
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Mobilya Satış Raporu</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; }
            .positive { color: green; }
            .negative { color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Mobilya Satış Raporu</h1>
            <p>Dönem: ${selectedPeriod} | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
          </div>
          
          <div class="summary">
            <div class="card">
              <h3>Toplam Satış</h3>
              <p style="font-size: 24px; font-weight: bold;">${(reportData.summary.totalSales / 1000).toFixed(0)}K ₺</p>
              <p class="positive">+15.2% bu ay</p>
            </div>
            <div class="card">
              <h3>Toplam Sevkiyat</h3>
              <p style="font-size: 24px; font-weight: bold;">${reportData.summary.totalShipments}</p>
              <p class="positive">+8.4% bu ay</p>
            </div>
          </div>
          
          <h2>Şehir Bazında Performans</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Şehir</th>
                <th>Sevkiyat</th>
                <th>Gelir</th>
                <th>Büyüme</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.cityPerformance.map(city => `
                <tr>
                  <td>${city.city}</td>
                  <td>${city.shipments}</td>
                  <td>${city.revenue.toLocaleString('tr-TR')} ₺</td>
                  <td class="positive">+${city.growth.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Kategori Analizi</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Yüzde</th>
                <th>Değer</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.categoryAnalysis.map(cat => `
                <tr>
                  <td>${cat.category}</td>
                  <td>${cat.percentage}%</td>
                  <td>${cat.value.toLocaleString('tr-TR')} ₺</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `
      
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }
      
      setShowExportMenu(false)
      
    } catch (error) {
      console.error('PDF export error:', error)
      alert('PDF raporu oluşturma sırasında bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  const printReport = () => {
    try {
      window.print()
      setShowExportMenu(false)
    } catch (error) {
      console.error('Print error:', error)
      alert('Yazdırma sırasında bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/auth/signin')
  }, [session, status, router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

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

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K'
    }
    return num.toString()
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
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg mr-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Detaylı Raporlama</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Kapsamlı analiz raporları ve performans metrikleri
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option>Son 6 Ay</option>
                <option>Son 3 Ay</option>
                <option>Bu Yıl</option>
                <option>Geçen Yıl</option>
              </select>
              
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Rapor İndir
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                    <div className="py-1">
                      <button
                        onClick={exportToExcel}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-3 text-green-600" />
                        Excel Tablosu (.csv)
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FileText className="h-4 w-4 mr-3 text-red-600" />
                        PDF Raporu
                      </button>
                      <button
                        onClick={printReport}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Printer className="h-4 w-4 mr-3 text-gray-600" />
                        Yazdır
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Toplam Satış</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatNumber(reportData.summary.totalSales)} ₺</p>
                <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{reportData.summary.trends.sales}% bu ay
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-green-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Toplam Sevkiyat</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{reportData.summary.totalShipments}</p>
                <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{reportData.summary.trends.shipments}% bu ay
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <Package className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-orange-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Aktif Müşteri</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{reportData.summary.activeCustomers}</p>
                <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{reportData.summary.trends.customers}% bu ay
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-purple-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Ortalama Sipariş</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{formatNumber(reportData.summary.averageOrder)} ₺</p>
                <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{reportData.summary.trends.revenue}% bu ay
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {reportData.detailedMetrics.map((metric, index) => {
            const icons = [Activity, Target, Zap, BarChart]
            const IconComponent = icons[index]
            const gradients = [
              'from-cyan-500 to-blue-600',
              'from-emerald-500 to-teal-600', 
              'from-amber-500 to-orange-600',
              'from-rose-500 to-pink-600'
            ]
            
            return (
              <div key={index} className="group bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-br ${gradients[index]} rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    metric.positive 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {metric.positive ? 'Pozitif' : 'Negatif'}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{metric.value}</p>
                  <div className={`flex items-center text-sm font-medium ${
                    metric.positive ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {metric.positive ? 
                      <TrendingUp className="h-4 w-4 mr-1" /> : 
                      <TrendingDown className="h-4 w-4 mr-1" />
                    }
                    {metric.change}
                    <span className="ml-2 text-xs text-gray-500">bu dönem</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Advanced Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trend Chart */}
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mr-3">
                  <BarChart className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Aylık Satış Trendi</h3>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Son 6 Ay</div>
            </div>
            
            <div className="h-80 flex items-end justify-between space-x-3 mb-4">
              {reportData.monthlyTrend.map((data, index) => {
                const maxValue = Math.max(...reportData.monthlyTrend.map(d => d.sales))
                const height = (data.sales / maxValue) * 240
                const isHighest = data.sales === maxValue
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full">
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        {(data.sales / 1000000).toFixed(1)}M ₺
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                      
                      <div className="w-full bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-t-xl relative overflow-hidden">
                        <div 
                          className={`bg-gradient-to-t ${
                            isHighest 
                              ? 'from-emerald-500 via-blue-500 to-indigo-500' 
                              : 'from-blue-400 via-blue-500 to-blue-600'
                          } rounded-t-xl transition-all duration-1000 ease-out relative group-hover:shadow-lg`}
                          style={{ 
                            height: `${height}px`,
                            minHeight: '24px'
                          }}
                        >
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-3 text-center">{data.month}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{data.shipments} sevkiyat</p>
                  </div>
                )
              })}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Toplam:</span> 17.98M ₺
              </div>
              <div className="flex items-center text-sm text-emerald-600 font-medium">
                <TrendingUp className="h-4 w-4 mr-1" />
                +28.4% büyüme
              </div>
            </div>
          </div>

          {/* City Performance */}
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg mr-3">
                  <PieChart className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Şehir Performansı</h3>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Top 6</div>
            </div>
            
            <div className="space-y-4">
              {reportData.cityPerformance.map((city, index) => {
                const maxRevenue = Math.max(...reportData.cityPerformance.map(c => c.revenue))
                const percentage = (city.revenue / maxRevenue) * 100
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-emerald-500 to-emerald-600', 
                  'from-orange-500 to-orange-600',
                  'from-purple-500 to-purple-600',
                  'from-pink-500 to-pink-600',
                  'from-gray-500 to-gray-600'
                ]
                
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 bg-gradient-to-br ${colors[index]} rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                          <span className="text-sm font-bold text-white">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">{city.city}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{city.shipments} sevkiyat</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {city.revenue.toLocaleString('tr-TR')} ₺
                        </p>
                        <div className="flex items-center text-sm text-emerald-600 font-medium">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{city.growth}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div 
                        className={`bg-gradient-to-r ${colors[index]} h-2 rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Toplam Gelir:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {reportData.cityPerformance.reduce((sum, city) => sum + city.revenue, 0).toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category & Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Enhanced Pie Chart */}
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg mr-3">
                  <PieChart className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Kategori Dağılımı</h3>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Ürün Bazlı</div>
            </div>
            
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-72 h-72">
                <svg className="w-72 h-72 transform -rotate-90" viewBox="0 0 100 100">
                  {reportData.categoryAnalysis.map((category, index) => {
                    const startAngle = reportData.categoryAnalysis
                      .slice(0, index)
                      .reduce((sum, cat) => sum + (cat.percentage * 3.6), 0)
                    const endAngle = startAngle + (category.percentage * 3.6)
                    const largeArcFlag = category.percentage > 50 ? 1 : 0
                    const x1 = 50 + 35 * Math.cos((startAngle * Math.PI) / 180)
                    const y1 = 50 + 35 * Math.sin((startAngle * Math.PI) / 180)
                    const x2 = 50 + 35 * Math.cos((endAngle * Math.PI) / 180)
                    const y2 = 50 + 35 * Math.sin((endAngle * Math.PI) / 180)
                    
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
                    const gradients = [
                      'url(#gradient1)', 'url(#gradient2)', 'url(#gradient3)', 'url(#gradient4)'
                    ]
                    
                    return (
                      <g key={index}>
                        <defs>
                          <linearGradient id={`gradient${index + 1}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colors[index]} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={colors[index]} stopOpacity="1" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={gradients[index]}
                          className="hover:opacity-80 transition-all duration-300 drop-shadow-lg"
                          style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                        />
                      </g>
                    )
                  })}
                  {/* Center circle */}
                  <circle cx="50" cy="50" r="15" fill="white" className="dark:fill-gray-800" />
                  <text x="50" y="48" textAnchor="middle" className="text-xs font-bold fill-gray-700 dark:fill-gray-300">
                    Toplam
                  </text>
                  <text x="50" y="56" textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400">
                    100%
                  </text>
                </svg>
              </div>
            </div>
            
            <div className="space-y-4">
              {reportData.categoryAnalysis.map((category, index) => {
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-emerald-500 to-emerald-600', 
                  'from-orange-500 to-orange-600',
                  'from-purple-500 to-purple-600'
                ]
                
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 bg-gradient-to-r ${colors[index]} rounded-full mr-3 shadow-sm group-hover:shadow-md transition-all duration-300`} />
                        <div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{category.category}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({category.percentage}%)</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {category.value.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`bg-gradient-to-r ${colors[index]} h-1.5 rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Revenue Trend Analysis */}
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg mr-3">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Gelir Analizi</h3>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Şehir Bazlı</div>
            </div>
            
            <div className="h-80 flex items-end justify-between space-x-2 mb-6">
              {reportData.cityPerformance.map((city, index) => {
                const maxRevenue = Math.max(...reportData.cityPerformance.map(c => c.revenue))
                const height = (city.revenue / maxRevenue) * 240
                const colors = [
                  'from-blue-400 to-blue-600',
                  'from-emerald-400 to-emerald-600', 
                  'from-orange-400 to-orange-600',
                  'from-purple-400 to-purple-600',
                  'from-pink-400 to-pink-600',
                  'from-gray-400 to-gray-600'
                ]
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full">
                      {/* Tooltip */}
                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        <div className="text-center">
                          <div className="font-semibold">{city.city}</div>
                          <div>{city.revenue.toLocaleString('tr-TR')} ₺</div>
                          <div className="text-green-400">+{city.growth}%</div>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                      
                      <div className="w-full bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-t-xl relative overflow-hidden">
                        <div 
                          className={`bg-gradient-to-t ${colors[index]} rounded-t-xl transition-all duration-1000 ease-out relative group-hover:shadow-lg`}
                          style={{ 
                            height: `${height}px`,
                            minHeight: '20px'
                          }}
                        >
                          {/* Animated shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          
                          {/* Growth indicator */}
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            +{city.growth}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-3 text-center transform group-hover:scale-110 transition-transform duration-300">
                      {city.city}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      {(city.revenue / 1000).toFixed(0)}K ₺
                    </p>
                  </div>
                )
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">En Yüksek</div>
                <div className="text-lg font-bold text-emerald-600">İstanbul</div>
                <div className="text-xs text-gray-500">850K ₺</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ortalama Büyüme</div>
                <div className="text-lg font-bold text-blue-600">+10.2%</div>
                <div className="text-xs text-gray-500">tüm şehirler</div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">📊 Rapor Özeti</h3>
            <p className="text-indigo-100">Seçilen dönem için genel performans değerlendirmesi</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">🎯</div>
              <div className="text-lg font-semibold">Hedef Başarısı</div>
              <div className="text-sm text-indigo-100">%87 hedef tamamlandı</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">📈</div>
              <div className="text-lg font-semibold">Büyüme Trendi</div>
              <div className="text-sm text-indigo-100">Pozitif yönde artış</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">⭐</div>
              <div className="text-lg font-semibold">Genel Durum</div>
              <div className="text-sm text-indigo-100">Çok iyi performans</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}