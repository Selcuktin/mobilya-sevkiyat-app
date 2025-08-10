'use client'

import { useState } from 'react'
import { Search, Filter, X, Calendar, DollarSign } from 'lucide-react'

interface SearchFilters {
  query: string
  category: string
  status: string
  priceMin: string
  priceMax: string
  dateFrom: string
  dateTo: string
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  categories: string[]
  statusOptions: string[]
  placeholder?: string
}

export function AdvancedSearch({ onSearch, categories, statusOptions, placeholder = "Ara..." }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    status: '',
    priceMin: '',
    priceMax: '',
    dateFrom: '',
    dateTo: ''
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSearch = () => {
    onSearch(filters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      query: '',
      category: '',
      status: '',
      priceMin: '',
      priceMax: '',
      dateFrom: '',
      dateTo: ''
    }
    setFilters(emptyFilters)
    onSearch(emptyFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Basic Search */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={filters.query}
            onChange={(e) => setFilters({...filters, query: e.target.value})}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-3 rounded-lg border transition-colors ${
            showAdvanced 
              ? 'bg-blue-50 border-blue-200 text-blue-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-4 w-4" />
        </button>

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ara
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700 p-2"
            title="Filtreleri Temizle"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Durumlar</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiyat Aralığı
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.query && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Arama: &ldquo;{filters.query}&rdquo;
            </span>
          )}
          {filters.category && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Kategori: {filters.category}
            </span>
          )}
          {filters.status && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              Durum: {filters.status}
            </span>
          )}
          {(filters.priceMin || filters.priceMax) && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              Fiyat: {filters.priceMin || '0'} - {filters.priceMax || '∞'} ₺
            </span>
          )}
        </div>
      )}
    </div>
  )
}