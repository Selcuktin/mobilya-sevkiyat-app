'use client'

import { BarChart3, TrendingUp } from 'lucide-react'

interface ChartDataProps {
  chartData: Array<{
    date: string
    shipments: number
    revenue: number
  }>
}

export function ChartData({ chartData }: ChartDataProps) {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Henüz analitik veri yok</p>
        <p className="text-sm text-gray-400 mt-1">Veriler birikmeye başladığında burada görünecek</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...chartData.map(d => d.revenue))
  const maxShipments = Math.max(...chartData.map(d => d.shipments))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Revenue Chart */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Son 7 Gün Gelir</h3>
        <div className="h-32 flex items-end justify-between space-x-1">
          {chartData.map((data, index) => {
            const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 80 : 8
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full bg-blue-200 dark:bg-blue-800/30 rounded-t-sm relative overflow-hidden">
                  <div 
                    className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-1000 ease-out"
                    style={{ 
                      height: `${height}px`,
                      minHeight: '8px'
                    }}
                  />
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {new Date(data.date).getDate()}
                </p>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Toplam: {chartData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString('tr-TR')} ₺
          </p>
          <div className="flex items-center text-xs text-emerald-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            Son 7 gün
          </div>
        </div>
      </div>

      {/* Shipments Chart */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Son 7 Gün Sevkiyat</h3>
        <div className="h-32 flex items-end justify-between space-x-1">
          {chartData.map((data, index) => {
            const height = maxShipments > 0 ? (data.shipments / maxShipments) * 80 : 8
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full bg-green-200 dark:bg-green-800/30 rounded-t-sm relative overflow-hidden">
                  <div 
                    className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-sm transition-all duration-1000 ease-out"
                    style={{ 
                      height: `${height}px`,
                      minHeight: '8px'
                    }}
                  />
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {new Date(data.date).getDate()}
                </p>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-green-600 dark:text-green-400">
            Toplam: {chartData.reduce((sum, d) => sum + d.shipments, 0)} sevkiyat
          </p>
          <div className="flex items-center text-xs text-emerald-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            Son 7 gün
          </div>
        </div>
      </div>
    </div>
  )
}