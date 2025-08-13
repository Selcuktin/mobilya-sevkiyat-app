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

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reportType, startDate, endDate, format = 'json' } = body

    if (!reportType) {
      return NextResponse.json(
        { success: false, error: 'Rapor tipi gereklidir' },
        { status: 400 }
      )
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    let reportData: any = {}
    let fileName = ''

    switch (reportType) {
      case 'sales':
        reportData = await generateSalesReport(userId, start, end)
        fileName = `satis-raporu-${startDate}-${endDate}`
        break
      case 'inventory':
        reportData = await generateInventoryReport(userId)
        fileName = `stok-raporu-${new Date().toISOString().split('T')[0]}`
        break
      case 'customers':
        reportData = await generateCustomersReport(userId)
        fileName = `musteri-raporu-${new Date().toISOString().split('T')[0]}`
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Geçersiz rapor tipi' },
          { status: 400 }
        )
    }

    if (format === 'csv') {
      const csv = convertToCSV(reportData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      fileName: fileName
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Rapor oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

async function generateSalesReport(userId: string, start: Date, end: Date) {
  const prismaClient = await getPrismaClient()
  
  // Get shipments with customer data using raw SQL
  const shipments = await prismaClient.$queryRaw`
    SELECT 
      s.id,
      s."totalAmount",
      s.status,
      s."createdAt",
      c.name as "customerName",
      (
        SELECT COUNT(*) FROM shipment_items si WHERE si."shipmentId" = s.id
      ) as "itemCount"
    FROM shipments s
    INNER JOIN customers c ON s."customerId" = c.id
    WHERE s."userId" = ${userId}
      AND s."createdAt" >= ${start}
      AND s."createdAt" <= ${end}
    ORDER BY s."createdAt" DESC
  ` as any[]

  const totalSales = shipments.reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || 0), 0)
  const totalOrders = shipments.length

  return {
    summary: {
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    },
    details: shipments.map((shipment: any) => ({
      orderNumber: `SHP-${shipment.id.toString().padStart(4, '0')}`,
      customerName: shipment.customerName,
      totalAmount: Number(shipment.totalAmount) || 0,
      status: shipment.status,
      date: new Date(shipment.createdAt).toISOString().split('T')[0],
      itemCount: Number(shipment.itemCount) || 0
    }))
  }
}

async function generateInventoryReport(userId: string) {
  const prismaClient = await getPrismaClient()
  
  // Get products with stock data using raw SQL
  const products = await prismaClient.$queryRaw`
    SELECT 
      p.id,
      p.name,
      p.category,
      p.price,
      s.quantity as "stockQuantity",
      s."minQuantity" as "stockMinQuantity"
    FROM products p
    LEFT JOIN stock s ON p.id = s."productId"
    WHERE p."userId" = ${userId}
    ORDER BY p.name
  ` as any[]

  const lowStockItems = products.filter((p: any) => {
    const quantity = Number(p.stockQuantity) || 0
    const minQuantity = Number(p.stockMinQuantity) || 10
    return quantity < minQuantity
  }).length

  const outOfStockItems = products.filter((p: any) => {
    const quantity = Number(p.stockQuantity) || 0
    return quantity === 0
  }).length

  return {
    summary: {
      totalProducts: products.length,
      lowStockItems,
      outOfStockItems
    },
    details: products.map((product: any) => ({
      name: product.name,
      category: product.category,
      price: Number(product.price) || 0,
      currentStock: Number(product.stockQuantity) || 0,
      minStock: Number(product.stockMinQuantity) || 0,
      status: getStockStatus(Number(product.stockQuantity) || 0, Number(product.stockMinQuantity) || 10)
    }))
  }
}

async function generateCustomersReport(userId: string) {
  const prismaClient = await getPrismaClient()
  
  // Get customers with shipment data using raw SQL
  const customers = await prismaClient.$queryRaw`
    SELECT 
      c.id,
      c.name,
      c.email,
      c.phone,
      c.city,
      COUNT(s.id) as "totalOrders",
      COALESCE(SUM(s."totalAmount"), 0) as "totalSpent",
      MAX(s."createdAt") as "lastOrderDate"
    FROM customers c
    LEFT JOIN shipments s ON c.id = s."customerId" AND s."userId" = ${userId}
    WHERE c."userId" = ${userId}
    GROUP BY c.id, c.name, c.email, c.phone, c.city
    ORDER BY c.name
  ` as any[]

  const activeCustomers = customers.filter((c: any) => Number(c.totalOrders) > 0).length

  return {
    summary: {
      totalCustomers: customers.length,
      activeCustomers
    },
    details: customers.map((customer: any) => ({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      totalOrders: Number(customer.totalOrders) || 0,
      totalSpent: Number(customer.totalSpent) || 0,
      lastOrderDate: customer.lastOrderDate 
        ? new Date(customer.lastOrderDate).toISOString().split('T')[0]
        : null
    }))
  }
}

function getStockStatus(currentStock: number, minStock: number): string {
  if (currentStock === 0) return 'Tükendi'
  if (currentStock <= minStock) return 'Az Stok'
  return 'Stokta'
}

function convertToCSV(data: any): string {
  if (!data.details || !Array.isArray(data.details)) {
    return 'No data available'
  }

  const headers = Object.keys(data.details[0] || {})
  const csvHeaders = headers.join(',')
  
  const csvRows = data.details.map((row: any) => 
    headers.map(header => `"${row[header] || ''}"`).join(',')
  )

  return [csvHeaders, ...csvRows].join('\n')
}