'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, Plus, Edit, Trash2, Package } from 'lucide-react'
import Navigation from '../../components/Layout/Navigation'
import Header from '../../components/Layout/Header'

// Mock data - gerçek uygulamada database'den gelecek
const initialProducts = [
  {
    id: 1,
    name: 'Ada Yatak Odası Takımı',
    category: 'Yatak Odası',
    price: 15000,
    stock: 15,
    status: 'Stokta',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    features: ['Masif ahşap', 'Yatak 160*200', 'Fırçalı görünüm']
  },
  {
    id: 2,
    name: 'Sandal Oturma Odası Takımı',
    category: 'Oturma Odası',
    price: 12000,
    stock: 3,
    status: 'Stokta',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    features: ['Gerçek deri', '3+2+1 koltuk', 'Yıkanabilir kumaş']
  },
  {
    id: 3,
    name: 'Klasik Yemek Odası Takımı',
    category: 'Yemek Odası',
    price: 18000,
    stock: 0,
    status: 'Tükendi',
    image: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=400&h=300&fit=crop',
    features: ['Masif meşe', '6 kişilik masa', 'El işçiliği']
  },
  {
    id: 4,
    name: 'Modern TV Ünitesi',
    category: 'Oturma Odası',
    price: 3500,
    stock: 25,
    status: 'Fazla Stok',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    features: ['Ceviz kaplama', 'LED ışık', 'Kapaklı bölme']
  }
]

export default function KatalogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tüm Kategoriler')
  const [selectedStock, setSelectedStock] = useState('Tüm Stoklar')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Yatak Odası',
    price: '',
    stock: '',
    description: '',
    features: '',
    image: ''
  })

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: `${product.category} takımı. Kaliteli malzeme ve işçilik.`,
      features: product.features.join('\n'),
      image: product.image
    })
    setShowModal(true)
  }

  const handleDeleteProduct = (productId: number) => {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      setProducts(products.filter(product => product.id !== productId))
      alert('Ürün başarıyla silindi!')
    }
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      category: 'Yatak Odası',
      price: '',
      stock: '',
      description: '',
      features: '',
      image: ''
    })
    setShowModal(true)
  }

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Product form submitted:', formData)
    
    if (editingProduct) {
      // Ürün güncelleme
      setProducts(products.map(product => 
        product.id === editingProduct.id 
          ? {
              ...product,
              name: formData.name,
              category: formData.category,
              price: parseInt(formData.price),
              stock: parseInt(formData.stock),
              features: formData.features.split('\n').filter(f => f.trim()),
              image: formData.image || product.image,
              status: parseInt(formData.stock) > 0 ? 'Stokta' : 'Tükendi'
            }
          : product
      ))
      alert('Ürün başarıyla güncellendi!')
    } else {
      // Yeni ürün ekleme
      const newProduct = {
        id: Math.max(...products.map(p => p.id)) + 1,
        name: formData.name,
        category: formData.category,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock),
        features: formData.features.split('\n').filter(f => f.trim()),
        image: formData.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        status: parseInt(formData.stock) > 0 ? 'Stokta' : 'Tükendi'
      }
      setProducts([...products, newProduct])
      alert('Ürün başarıyla eklendi!')
    }
    
    setShowModal(false)
    setEditingProduct(null)
  }

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
  const stockOptions = ['Tüm Stoklar', 'Stokta', 'Az Stok', 'Tükendi', 'Fazla Stok']

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Tüm Kategoriler' || product.category === selectedCategory
    const matchesStock = selectedStock === 'Tüm Stoklar' || product.status === selectedStock
    return matchesSearch && matchesCategory && matchesStock
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Stokta': return 'bg-green-100 text-green-800'
      case 'Az Stok': return 'bg-yellow-100 text-yellow-800'
      case 'Tükendi': return 'bg-red-100 text-red-800'
      case 'Fazla Stok': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mr-3">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Ürün Kataloğu</h1>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Arama ve Filtreleme</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Ürün adı, açıklama, özellık..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {stockOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Filter className="h-4 w-4 mr-2" />
              {filteredProducts.length} ürün bulundu
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              {/* Product Image */}
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-contain bg-white dark:bg-gray-600"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button 
                    onClick={() => handleEditProduct(product)}
                    className="p-1 bg-white/90 dark:bg-gray-800/90 rounded-full shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Ürünü Düzenle"
                  >
                    <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-1 bg-white/90 dark:bg-gray-800/90 rounded-full shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Ürünü Sil"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{product.name}</h3>
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
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Özellikler:</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">Ürün bulunamadı</div>
            <p className="text-gray-600">Arama kriterlerinizi değiştirmeyi deneyin</p>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ada Yatak Odası Takımı"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="15000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori *
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Yatak Odası</option>
                    <option>Oturma Odası</option>
                    <option>Yemek Odası</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Durumu
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>15 Stok</option>
                    <option>Az Stok</option>
                    <option>Tükendi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ürün Resmi
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {formData.image ? (
                    <div className="space-y-3">
                      <div className="w-full max-w-xs mx-auto">
                        <img 
                          src={formData.image} 
                          alt="Önizleme" 
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, image: ''})}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Görseli Kaldır
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <input
                        type="file"
                        id="product-image"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              setFormData({...formData, image: e.target?.result as string})
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      <label 
                        htmlFor="product-image"
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium cursor-pointer transition-colors"
                      >
                        Fotoğraf Seç
                      </label>
                      <p className="text-xs text-gray-500">JPG, PNG dosyaları desteklenir (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="6 kişilik klasik yatak odası takımı. Masif ve sağlam yapısıyla uzun yıllar kullanım."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Özellikler (Her satırda bir özellik)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="6 kişilik masa&#10;6 adet sandalye&#10;Masif meşe&#10;El işçiliği&#10;5 yıl garanti"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
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