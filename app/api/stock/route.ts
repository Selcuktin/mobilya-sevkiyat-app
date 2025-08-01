import { NextResponse } from 'next/server'

// Mock data - gerçek uygulamada database'den gelecek
const mockStockData = [
  {
    id: 1,
    productName: 'Ada Yatak Odası Takımı',
    code: 'YOT-001',
    category: 'Yatak Odası',
    currentStock: 15,
    minStock: 5,
    maxStock: 30,
    unitPrice: 15000,
    totalValue: 225000,
    status: 'Stokta',
    lastUpdated: '2024-01-15'
  },
  {
    id: 2,
    productName: 'Sandal Oturma Odası Takımı',
    code: 'OTS-002',
    category: 'Oturma Odası',
    currentStock: 3,
    minStock: 5,
    maxStock: 20,
    unitPrice: 12000,
    totalValue: 36000,
    status: 'Az Stok',
    lastUpdated: '2024-01-14'
  },
  {
    id: 3,
    productName: 'Klasik Yemek Odası Takımı',
    code: 'YEM-003',
    category: 'Yemek Odası',
    currentStock: 0,
    minStock: 3,
    maxStock: 15,
    unitPrice: 18000,
    totalValue: 0,
    status: 'Tükendi',
    lastUpdated: '2024-01-13'
  },
  {
    id: 4,
    productName: 'Modern TV Ünitesi',
    code: 'TVU-004',
    category: 'Oturma Odası',
    currentStock: 25,
    minStock: 8,
    maxStock: 20,
    unitPrice: 3500,
    totalValue: 87500,
    status: 'Fazla Stok',
    lastUpdated: '2024-01-16'
  }
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockStockData
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Stok verileri yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, currentStock } = body
    
    // Stok güncelleme logic'i burada olacak
    const updatedItem = mockStockData.find(item => item.id === id)
    if (updatedItem) {
      updatedItem.currentStock = currentStock
      updatedItem.totalValue = currentStock * updatedItem.unitPrice
      updatedItem.lastUpdated = new Date().toISOString().split('T')[0]
      
      // Stok durumunu güncelle
      if (currentStock === 0) {
        updatedItem.status = 'Tükendi'
      } else if (currentStock < updatedItem.minStock) {
        updatedItem.status = 'Az Stok'
      } else if (currentStock > updatedItem.maxStock) {
        updatedItem.status = 'Fazla Stok'
      } else {
        updatedItem.status = 'Stokta'
      }
    }
    
    return NextResponse.json({
      success: true,
      data: updatedItem
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Stok güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}