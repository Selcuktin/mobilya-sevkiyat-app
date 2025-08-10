'use client'

import { useState } from 'react'
import { FileText, Download, Calendar, Filter, BarChart3, FileSpreadsheet, Printer } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

interface ReportFilters {
  startDate: string
  endDate: string
  reportType: 'sales' | 'inventory' | 'shipments' | 'customers'
  format: 'pdf' | 'excel' | 'csv'
}

export function ReportGenerator() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    reportType: 'sales',
    format: 'pdf'
  })
  const [generating, setGenerating] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()

  const generateReport = async (format: 'pdf' | 'excel' | 'csv', action: 'download' | 'print' = 'download') => {
    if (!filters.startDate || !filters.endDate) {
      showError('Eksik bilgi', 'Başlangıç ve bitiş tarihlerini seçin')
      return
    }

    setGenerating(format)
    try {
      const reportData = {
        ...filters,
        format
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        if (action === 'print' && format === 'pdf') {
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
          const reportTypeNames = {
            sales: 'satis',
            inventory: 'stok',
            shipments: 'sevkiyat',
            customers: 'musteri'
          }
          const fileName = `${reportTypeNames[filters.reportType]}-raporu-${filters.startDate}-${filters.endDate}.${format === 'excel' ? 'xlsx' : format}`
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          
          const formatNames = {
            pdf: 'PDF',
            excel: 'Excel',
            csv: 'CSV'
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
      setGenerating(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <BarChart3 className="h-6 w-6 text-indigo-600 mr-3" />
        <h2 className="text-xl font-bold text-gray-900">Rapor Oluşturucu</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bitiş Tarihi
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rapor Türü
          </label>
          <select
            value={filters.reportType}
            onChange={(e) => setFilters({...filters, reportType: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="sales">Satış Raporu</option>
            <option value="inventory">Stok Raporu</option>
            <option value="shipments">Sevkiyat Raporu</option>
            <option value="customers">Müşteri Raporu</option>
          </select>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Rapor İşlemleri
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Excel İndir */}
          <button
            onClick={() => generateReport('excel')}
            disabled={generating !== null || !filters.startDate || !filters.endDate}
            className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {generating === 'excel' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Excel Hazırlanıyor...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel İndir
              </>
            )}
          </button>

          {/* PDF İndir */}
          <button
            onClick={() => generateReport('pdf')}
            disabled={generating !== null || !filters.startDate || !filters.endDate}
            className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {generating === 'pdf' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                PDF Hazırlanıyor...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                PDF İndir
              </>
            )}
          </button>

          {/* Yazdır */}
          <button
            onClick={() => generateReport('pdf', 'print')}
            disabled={generating !== null || !filters.startDate || !filters.endDate}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {generating === 'pdf' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Yazdırılıyor...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Yazdır
              </>
            )}
          </button>
        </div>

        {/* CSV İndir (Ek Seçenek) */}
        <button
          onClick={() => generateReport('csv')}
          disabled={generating !== null || !filters.startDate || !filters.endDate}
          className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          {generating === 'csv' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              CSV Hazırlanıyor...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              CSV İndir
            </>
          )}
        </button>
      </div>
    </div>
  )
}