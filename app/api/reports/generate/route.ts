import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'

const prisma = new PrismaClient()

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
  const shipments = await prisma.shipment.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: start,
        lte: end
      }
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    }
  })

  const totalSales = shipments.reduce((sum, s) => sum + s.totalAmount, 0)
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
    details: shipments.map(shipment => ({
      orderNumber: `SHP-${shipment.id.toString().padStart(4, '0')}`,
      customerName: shipment.customer.name,
      totalAmount: shipment.totalAmount,
      status: shipment.status,
      date: shipment.createdAt.toISOString().split('T')[0],
      itemCount: shipment.items.length
    }))
  }
}

async function generateInventoryReport(userId: string) {
  const products = await prisma.product.findMany({
    where: { userId: userId },
    include: {
      stock: true
    }
  })

  return {
    summary: {
      totalProducts: products.length,
      lowStockItems: products.filter(p => p.stock && p.stock.quantity < (p.stock.minQuantity || 10)).length,
      outOfStockItems: products.filter(p => !p.stock || p.stock.quantity === 0).length
    },
    details: products.map(product => ({
      name: product.name,
      category: product.category,
      price: product.price,
      currentStock: product.stock?.quantity || 0,
      minStock: product.stock?.minQuantity || 0,
      status: getStockStatus(product.stock?.quantity || 0, product.stock?.minQuantity || 10)
    }))
  }
}

async function generateCustomersReport(userId: string) {
  const customers = await prisma.customer.findMany({
    where: { userId: userId },
    include: {
      shipments: true
    }
  })

  return {
    summary: {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.shipments.length > 0).length
    },
    details: customers.map(customer => ({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      totalOrders: customer.shipments.length,
      totalSpent: customer.shipments.reduce((sum, s) => sum + s.totalAmount, 0),
      lastOrderDate: customer.shipments.length > 0 
        ? customer.shipments[customer.shipments.length - 1].createdAt.toISOString().split('T')[0]
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