'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Plus, Edit, Trash2, Package } from 'lucide-react'
import Image from 'next/image'
import Navigation from '../../components/Layout/Navigation'
import Header from '../../components/Layout/Header'
import { Loading } from '../../components/ui/Loading'
import { useToast } from '../../contexts/ToastContext'

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: string
  features: string[]
  description?: string
}

export default function KatalogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tüm Kategoriler')
  const [selectedStock, setSelectedStock] = useState('Tüm Stoklar')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Yatak Odası',
    price: '',
    description: '',
    features: '',
    initialStock: '0',
    minStock: '5'
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
      } else {
        showError('Veri yüklenemedi', data.error)
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Ürün verileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/auth/signin')
    else fetchProducts()
  }, [session, status, router, fetchProducts])

  

  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      category: 'Yatak Odası',
      price: '',
      description: '',
      features: '',
      initialStock: '0',
      minStock: '5'
    })
    setSelectedImage(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      description: product.description || '',
      features: product.features.join('\n'),
      initialStock: product.stock.toString(),
      minStock: '5'
    })
    setSelectedImage(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Dosya çok büyük', 'Fotoğraf boyutu 5MB\'dan küçük olmalıdır')
        return
      }

      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        showError('Geçersiz dosya', 'Sadece resim dosyaları yükleyebilirsiniz')
        return
      }

      setSelectedImage(file)
      
      // Önizleme oluştur
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name.trim() || !formData.price.trim()) {
      showError('Eksik bilgi', 'Ürün adı ve fiyat alanları gereklidir')
      return
    }

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const requestData = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        features: formData.features.split('\n').filter(f => f.trim()),
        initialStock: parseInt(formData.initialStock),
        minStock: parseInt(formData.minStock)
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      
      if (data.success) {
        showSuccess(
          editingProduct ? 'Ürün güncellendi' : 'Ürün eklendi',
          editingProduct ? 'Ürün bilgileri başarıyla güncellendi' : 'Yeni ürün başarıyla eklendi'
        )
        setShowModal(false)
        setEditingProduct(null)
        fetchProducts()
      } else {
        showError('İşlem hatası', data.error)
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Ürün kaydedilirken hata oluştu')
    }
  }

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`${name} ürünü silinecek. Emin misiniz?`)) return

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        showSuccess('Ürün silindi', 'Ürün başarıyla silindi')
        fetchProducts()
      } else {
        showError('Silme hatası', data.error)
      }
    } catch (error) {
      showError('Bağlantı hatası', 'Ürün silinirken hata oluştu')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading size="lg" text="Ürünler yükleniyor..." />
        </div>
      </div>
    )
  }

  if (!session) return null

  const categories = ['Tüm Kategoriler', 'Yatak Odası', 'Oturma Odası', 'Yemek Odası']
  const stockOptions = ['Tüm Stoklar', 'Stokta', 'Az Stok', 'Tükendi', 'Fazla Stok']

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Tüm Kategoriler' || product.category === selectedCategory
    const matchesStock = selectedStock === 'Tüm Stoklar' || product.status === selectedStock
    return matchesSearch && matchesCategory && matchesStock
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Stokta': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Az Stok': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Tükendi': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'Fazla Stok': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
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
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mr-3">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Ürün Kataloğu
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Mobilya ürünlerinizi yönetin ve düzenleyin
                </p>
              </div>
            </div>
            <button 
              onClick={handleAddProduct}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ürün
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🔍 Arama ve Filtreleme</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Ürün adı, açıklama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {stockOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Filter className="h-4 w-4 mr-2" />
              {filteredProducts.length} ürün bulundu
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || selectedCategory !== 'Tüm Kategoriler' || selectedStock !== 'Tüm Stoklar' 
                ? 'Ürün bulunamadı' 
                : 'Henüz ürün yok'
              }
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || selectedCategory !== 'Tüm Kategoriler' || selectedStock !== 'Tüm Stoklar'
                ? 'Arama kriterlerinizi değiştirmeyi deneyin' 
                : 'İlk ürününüzü ekleyin'
              }
            </p>
            {!searchTerm && selectedCategory === 'Tüm Kategoriler' && selectedStock === 'Tüm Stoklar' && (
              <button 
                onClick={handleAddProduct}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Yeni Ürün Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                {/* Product Image with Initial Letter */}
                <div className="h-48 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-t-lg relative overflow-hidden flex items-center justify-center">
                  {/* Product Initial Letter */}
                  <div className="text-6xl font-bold text-white opacity-90">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                    {product.category}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button 
                      onClick={() => handleEditProduct(product)}
                      className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full shadow hover:bg-white/30 transition-colors"
                      title="Ürünü Düzenle"
                    >
                      <Edit className="h-4 w-4 text-white" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full shadow hover:bg-white/30 transition-colors"
                      title="Ürünü Sil"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  
                  {/* Decorative Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white rounded-full"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-white rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white rounded-full opacity-30"></div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{product.category}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {product.price.toLocaleString('tr-TR')} ₺
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Stok: {product.stock}
                    </span>
                  </div>

                  {/* Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Özellikler:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {product.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                        {product.features.length > 3 && (
                          <li className="text-blue-600 dark:text-blue-400 text-xs">
                            +{product.features.length - 3} özellik daha
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Description */}
                  {product.description && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ada Yatak Odası Takımı"
                  required
                />
              </div>

              {/* Ürün Fotoğrafı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ürün Fotoğrafı
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="product-image"
                  />
                  <label 
                    htmlFor="product-image" 
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <Image 
                          src={imagePreview} 
                          alt="Ürün önizleme" 
                          width={96}
                          height={96}
                          className="h-24 w-24 object-cover rounded-lg mb-2"
                        />
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
                             onClick={(e) => {
                               e.preventDefault()
                               setSelectedImage(null)
                               setImagePreview(null)
                             }}>
                          ×
                        </div>
                      </div>
                    ) : (
                      <>
                        <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Fotoğraf seçmek için tıklayın
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          PNG, JPG, JPEG (Max 5MB)
                        </span>
                      </>
                    )}
                  </label>
                  {selectedImage && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      ✓ {selectedImage.name} seçildi
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori *
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option>Yatak Odası</option>
                    <option>Oturma Odası</option>
                    <option>Yemek Odası</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="15000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Başlangıç Stok
                  </label>
                  <input
                    type="number"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({...formData, initialStock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Stok
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Ürün açıklaması..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Özellikler (Her satırda bir özellik)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={4}
                  placeholder="Masif ahşap&#10;Yatak 160*200&#10;Fırçalı görünüm&#10;5 yıl garanti"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProduct ? 'Güncelle' : 'Ürün Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}