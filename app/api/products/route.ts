import { NextResponse } from 'next/server'

// Mock data - gerçek uygulamada database'den gelecek
const mockProducts = [
  {
    id: 1,
    name: 'Ada Yatak Odası Takımı',
    category: 'Yatak Odası',
    price: 15000,
    stock: 15,
    status: 'Stokta',
    features: ['Masif ahşap', 'Yatak 160*200', 'Fırçalı görünüm']
  },
  {
    id: 2,
    name: 'Sandal Oturma Odası Takımı',
    category: 'Oturma Odası',
    price: 12000,
    stock: 3,
    status: 'Stokta',
    features: ['Gerçek deri', '3+2+1 koltuk', 'Yıkanabilir kumaş']
  },
  {
    id: 3,
    name: 'Klasik Yemek Odası Takımı',
    category: 'Yemek Odası',
    price: 18000,
    stock: 0,
    status: 'Tükendi',
    features: ['Masif meşe', '6 kişilik masa', 'El işçiliği']
  },
  {
    id: 4,
    name: 'Modern TV Ünitesi',
    category: 'Oturma Odası',
    price: 3500,
    stock: 25,
    status: 'Fazla Stok',
    features: ['Ceviz kaplama', 'LED ışık', 'Kapaklı bölme']
  }
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockProducts
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Ürünler yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Yeni ürün ekleme logic'i burada olacak
    const newProduct = {
      id: mockProducts.length + 1,
      ...body,
      createdAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: newProduct
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Ürün eklenirken hata oluştu' },
      { status: 500 }
    )
  }
}