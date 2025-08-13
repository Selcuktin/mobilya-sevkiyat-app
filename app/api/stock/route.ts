import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'

// Use dynamic import for Prisma to avoid build issues
let prisma: any = null

async function getPrismaClient() {
  if (!prisma) {
    try {
      const PrismaModule = await import('@prisma/client')
      const PrismaClient = (PrismaModule as any).PrismaClient || (PrismaModule as any).default?.PrismaClient
      prisma = new PrismaClient()
    } catch (error) {
      console.error('Failed to import Prisma Client:', error)
      throw error
    }
  }
  return prisma
}

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

    const prismaClient = await getPrismaClient()

    // Get stock data with product information using raw SQL
    const stockData = await prismaClient.$queryRaw`
      SELECT 
        s.id,
        s.quantity,
        s."minQuantity",
        s."maxQuantity",
        s."updatedAt",
        p.id as "productId",
        p.name as "productName",
        p.category,
        p.price
      FROM stock s
      INNER JOIN products p ON s."productId" = p.id
      WHERE p."userId" = ${userId}
      ORDER BY s."updatedAt" DESC
    ` as any[]

    // Transform data to match frontend expectations
    const transformedStock = stockData.map((stock: any) => ({
      id: stock.id,
      productName: stock.productName,
      code: `PRD-${stock.productId.toString().padStart(3, '0')}`,
      category: stock.category,
      currentStock: Number(stock.quantity) || 0,
      minStock: Number(stock.minQuantity) || 0,
      maxStock: Number(stock.maxQuantity) || 0,
      unitPrice: Number(stock.price) || 0,
      totalValue: (Number(stock.quantity) || 0) * (Number(stock.price) || 0),
      status: getStockStatus(Number(stock.quantity) || 0, Number(stock.minQuantity) || 0, Number(stock.maxQuantity) || 0),
      lastUpdated: new Date(stock.updatedAt).toISOString().split('T')[0]
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

    const prismaClient = await getPrismaClient()

    // Check if stock exists and user owns the product
    const existingStock = await prismaClient.$queryRaw`
      SELECT s.id, p."userId"
      FROM stock s
      INNER JOIN products p ON s."productId" = p.id
      WHERE s.id = ${id} AND p."userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!existingStock || existingStock.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Stok kaydı bulunamadı' },
        { status: 404 }
      )
    }

    // Update stock using raw SQL
    await prismaClient.$executeRaw`
      UPDATE stock 
      SET 
        quantity = ${Number(currentStock) || 0},
        "updatedAt" = NOW()
      WHERE id = ${id}
    `

    // Get updated stock with product data
    const updatedStockResult = await prismaClient.$queryRaw`
      SELECT 
        s.id,
        s.quantity,
        s."minQuantity",
        s."maxQuantity",
        s."updatedAt",
        p.id as "productId",
        p.name as "productName",
        p.category,
        p.price
      FROM stock s
      INNER JOIN products p ON s."productId" = p.id
      WHERE s.id = ${id}
      LIMIT 1
    ` as any[]

    if (!updatedStockResult || updatedStockResult.length === 0) {
      throw new Error('Stock not found after update')
    }

    const stockData = updatedStockResult[0]

    // Transform response
    const transformedStock = {
      id: stockData.id,
      productName: stockData.productName,
      code: `PRD-${stockData.productId.toString().padStart(3, '0')}`,
      category: stockData.category,
      currentStock: Number(stockData.quantity) || 0,
      minStock: Number(stockData.minQuantity) || 0,
      maxStock: Number(stockData.maxQuantity) || 0,
      unitPrice: Number(stockData.price) || 0,
      totalValue: (Number(stockData.quantity) || 0) * (Number(stockData.price) || 0),
      status: getStockStatus(Number(stockData.quantity) || 0, Number(stockData.minQuantity) || 0, Number(stockData.maxQuantity) || 0),
      lastUpdated: new Date(stockData.updatedAt).toISOString().split('T')[0]
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