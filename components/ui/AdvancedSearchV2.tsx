'use client'

import { useState } from 'react'
import { Search, Filter, X, Calendar, DollarSign, Tag, MapPin, User } from 'lucide-react'

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  searchFields: SearchField[]
  placeholder?: string
  showQuickFilters?: boolean
  savedSearches?: SavedSearch[]
  onSaveSearch?: (search: SavedSearch) => void
}

interface SearchField {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'range' | 'multiselect'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  icon?: React.ReactNode
}

interface SearchFilters {
  query: string
  filters: Record<string, any>
  dateRange?: {
    start: string
    end: string
  }
  priceRange?: {
    min: number
    max: number
  }
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface SavedSearch {
  id: string
  name: string
  filters: SearchFilters
  createdAt: Date
}

interface QuickFilter {
  label: string
  filters: Record<string, any>
  icon?: React.ReactNode
  color?: string
}

export function AdvancedSearchV2({ 
  onSearch, 
  searchFields, 
  placeholder = "Ara...",
  showQuickFilters = true,
  savedSearches = [],
  onSaveSearch
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 })
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [searchName, setSearchName] = useState('')

  // Quick filters for common searches
  const quickFilters: QuickFilter[] = [
    {
      label: 'Bu Hafta',
      filters: { dateRange: { start: getDateDaysAgo(7), end: new Date().toISOString().split('T')[0] } },
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    },
    {
      label: 'Yüksek Fiyat',
      filters: { priceRange: { min: 10000, max: 999999 } },
      icon: <DollarSign className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    },
    {
      label: 'Az Stok',
      filters: { status: 'Az Stok' },
      icon: <Tag className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    },
    {
      label: 'İstanbul',
      filters: { city: 'İstanbul' },
      icon: <MapPin className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    }
  ]

  function getDateDaysAgo(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }

  const handleSearch = () => {
    const searchFilters: SearchFilters = {
      query: query.trim(),
      filters,
      ...(dateRange.start && dateRange.end ? { dateRange } : {}),
      ...((priceRange.min > 0 || priceRange.max > 0) ? { priceRange } : {}),
      ...(sortBy ? { sortBy, sortOrder } : {})
    }
    onSearch(searchFilters)
  }

  const clearFilters = () => {
    setQuery('')
    setFilters({})
    setDateRange({ start: '', end: '' })
    setPriceRange({ min: 0, max: 0 })
    setSortBy('')
    setSortOrder('desc')
    onSearch({ query: '', filters: {} })
  }

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    if (value === '' || value === null || value === undefined) {
      delete newFilters[key]
    }
    setFilters(newFilters)
  }

  const applyQuickFilter = (quickFilter: QuickFilter) => {
    if (quickFilter.filters.dateRange) {
      setDateRange(quickFilter.filters.dateRange)
    }
    if (quickFilter.filters.priceRange) {
      setPriceRange(quickFilter.filters.priceRange)
    }
    
    const newFilters = { ...filters, ...quickFilter.filters }
    delete newFilters.dateRange
    delete newFilters.priceRange
    setFilters(newFilters)
    
    // Auto-search after applying quick filter
    setTimeout(handleSearch, 100)
  }

  const applySavedSearch = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.filters.query)
    setFilters(savedSearch.filters.filters)
    if (savedSearch.filters.dateRange) {
      setDateRange(savedSearch.filters.dateRange)
    }
    if (savedSearch.filters.priceRange) {
      setPriceRange(savedSearch.filters.priceRange)
    }
    if (savedSearch.filters.sortBy) {
      setSortBy(savedSearch.filters.sortBy)
      setSortOrder(savedSearch.filters.sortOrder || 'desc')
    }
    handleSearch()
  }

  const saveCurrentSearch = () => {
    if (!searchName.trim()) return
    
    const searchFilters: SearchFilters = {
      query: query.trim(),
      filters,
      ...(dateRange.start && dateRange.end ? { dateRange } : {}),
      ...((priceRange.min > 0 || priceRange.max > 0) ? { priceRange } : {}),
      ...(sortBy ? { sortBy, sortOrder } : {})
    }

    const savedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      filters: searchFilters,
      createdAt: new Date()
    }

    onSaveSearch?.(savedSearch)
    setShowSaveDialog(false)
    setSearchName('')
  }

  const activeFiltersCount = Object.keys(filters).length + 
    (dateRange.start && dateRange.end ? 1 : 0) + 
    (priceRange.min > 0 || priceRange.max > 0 ? 1 : 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* Main Search Bar */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`relative px-4 py-2 border rounded-lg transition-colors ${
            showFilters || activeFiltersCount > 0
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Filter className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
        
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ara
        </button>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            title="Filtreleri Temizle"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {onSaveSearch && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            title="Aramayı Kaydet"
          >
            💾
          </button>
        )}
      </div>

      {/* Quick Filters */}
      {showQuickFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
            Hızlı Filtreler:
          </span>
          {quickFilters.map((filter, index) => (
            <button
              key={index}
              onClick={() => applyQuickFilter(filter)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${
                filter.color || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {filter.icon && <span className="mr-1">{filter.icon}</span>}
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
            Kayıtlı Aramalar:
          </span>
          {savedSearches.map((search) => (
            <button
              key={search.id}
              onClick={() => applySavedSearch(search)}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 hover:opacity-80 transition-colors"
            >
              <User className="h-3 w-3 mr-1" />
              {search.name}
            </button>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Gelişmiş Filtreler
            </h3>
            
            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Sıralama</option>
                <option value="createdAt">Tarih</option>
                <option value="name">Ad</option>
                <option value="price">Fiyat</option>
                <option value="status">Durum</option>
              </select>
              
              {sortBy && (
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="desc">Azalan</option>
                  <option value="asc">Artan</option>
                </select>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.icon && <span className="inline-block mr-1">{field.icon}</span>}
                  {field.label}
                </label>
                
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={filters[field.key] || ''}
                    onChange={(e) => updateFilter(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                )}
                
                {field.type === 'select' && (
                  <select
                    value={filters[field.key] || ''}
                    onChange={(e) => updateFilter(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Tümü</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {field.type === 'multiselect' && (
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                    {field.options?.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(filters[field.key] || []).includes(option.value)}
                          onChange={(e) => {
                            const currentValues = filters[field.key] || []
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter((v: string) => v !== option.value)
                            updateFilter(field.key, newValues.length > 0 ? newValues : undefined)
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={filters[field.key] || ''}
                    onChange={(e) => updateFilter(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                )}
                
                {field.type === 'number' && (
                  <input
                    type="number"
                    value={filters[field.key] || ''}
                    onChange={(e) => updateFilter(field.key, parseFloat(e.target.value) || 0)}
                    min={field.min}
                    max={field.max}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                )}
              </div>
            ))}
            
            {/* Date Range Filter */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tarih Aralığı
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Başlangıç"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Bitiş"
                />
              </div>
            </div>
            
            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Fiyat Aralığı (₺)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={priceRange.min || ''}
                  onChange={(e) => setPriceRange({ ...priceRange, min: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={priceRange.max || ''}
                  onChange={(e) => setPriceRange({ ...priceRange, max: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Aramayı Kaydet
            </h3>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Arama adı..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveCurrentSearch}
                disabled={!searchName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}