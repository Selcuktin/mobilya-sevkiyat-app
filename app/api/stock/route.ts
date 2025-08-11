import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'

const prisma = new PrismaClient()

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const stockData = await prisma.stock.findMany({
      include: {
        product: true
      },
      where: {
        product: {
          userId: userId
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform data to match frontend expectations
    const transformedStock = stockData.map(stock => ({
      id: stock.id,
      productName: stock.product.name,
      code: `PRD-${stock.product.id.toString().padStart(3, '0')}`,
      category: stock.product.category,
      currentStock: stock.quantity,
      minStock: stock.minQuantity,
      maxStock: stock.maxQuantity,
      unitPrice: stock.product.price,
      totalValue: stock.quantity * stock.product.price,
      status: getStockStatus(stock.quantity, stock.minQuantity, stock.maxQuantity),
      lastUpdated: stock.updatedAt.toISOString().split('T')[0]
    }))

    return NextResponse.json({
      success: true,
      data: transformedStock
    })
  } catch (error) {
    console.error('Stock GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Stok verileri yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

function getStockStatus(quantity: number, minQuantity: number, maxQuantity: number): string {
  if (quantity === 0) return 'Tükendi'
  if (quantity < minQuantity) return 'Az Stok'
  if (quantity > maxQuantity) return 'Fazla Stok'
  return 'Stokta'
}

export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, currentStock } = body
    
    // Validation
    if (!id || currentStock === undefined) {
      return NextResponse.json(
        { success: false, error: 'ID ve stok miktarı gereklidir' },
        { status: 400 }
      )
    }

    // Update stock in database (only if user owns the product)
    const updatedStock = await prisma.stock.update({
      where: { 
        id: id,
        product: {
          userId: userId
        }
      },
      data: { 
        quantity: Number(currentStock) || 0,
        updatedAt: new Date()
      },
      include: {
        product: true
      }
    })

    // Transform response
    const transformedStock = {
      id: updatedStock.id,
      productName: updatedStock.product.name,
      code: `PRD-${updatedStock.product.id.toString().padStart(3, '0')}`,
      category: updatedStock.product.category,
      currentStock: updatedStock.quantity,
      minStock: updatedStock.minQuantity,
      maxStock: updatedStock.maxQuantity,
      unitPrice: updatedStock.product.price,
      totalValue: updatedStock.quantity * updatedStock.product.price,
      status: getStockStatus(updatedStock.quantity, updatedStock.minQuantity, updatedStock.maxQuantity),
      lastUpdated: updatedStock.updatedAt.toISOString().split('T')[0]
    }
    
    return NextResponse.json({
      success: true,
      data: transformedStock
    })
  } catch (error) {
    console.error('Stock PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Stok güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}