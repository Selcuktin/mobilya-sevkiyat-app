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

    // Get all statistics using raw SQL queries
    const results = await Promise.all([
      // Total customers
      prismaClient.$queryRaw`
        SELECT COUNT(*) as count FROM customers WHERE "userId" = ${userId}
      `,
      
      // Total products
      prismaClient.$queryRaw`
        SELECT COUNT(*) as count FROM products WHERE "userId" = ${userId}
      `,
      
      // Total shipments
      prismaClient.$queryRaw`
        SELECT COUNT(*) as count FROM shipments WHERE "userId" = ${userId}
      `,
      
      // Pending shipments
      prismaClient.$queryRaw`
        SELECT COUNT(*) as count FROM shipments 
        WHERE "userId" = ${userId} AND status = 'PENDING'
      `,
      
      // Completed shipments
      prismaClient.$queryRaw`
        SELECT COUNT(*) as count FROM shipments 
        WHERE "userId" = ${userId} AND status = 'DELIVERED'
      `,
      
      // Low stock products
      prismaClient.$queryRaw`
        SELECT COUNT(*) as count FROM stock s
        INNER JOIN products p ON s."productId" = p.id
        WHERE p."userId" = ${userId} AND s.quantity <= 5
      `,
      
      // Total revenue
      prismaClient.$queryRaw`
        SELECT COALESCE(SUM("totalAmount"), 0) as total FROM shipments 
        WHERE "userId" = ${userId} AND status = 'DELIVERED'
      `,
      
      // Recent shipments for chart data
      prismaClient.$queryRaw`
        SELECT "createdAt", "totalAmount", status FROM shipments 
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT 30
      `
    ])

    // Type assert the results
    const [
      totalCustomersResult,
      totalProductsResult,
      totalShipmentsResult,
      pendingShipmentsResult,
      completedShipmentsResult,
      lowStockProductsResult,
      totalRevenueResult,
      recentShipmentsResult
    ] = results as any[]

    // Extract values from query results
    const totalCustomers = Number(totalCustomersResult[0]?.count || 0)
    const totalProducts = Number(totalProductsResult[0]?.count || 0)
    const totalShipments = Number(totalShipmentsResult[0]?.count || 0)
    const pendingShipments = Number(pendingShipmentsResult[0]?.count || 0)
    const completedShipments = Number(completedShipmentsResult[0]?.count || 0)
    const lowStockProducts = Number(lowStockProductsResult[0]?.count || 0)
    const totalRevenue = Number(totalRevenueResult[0]?.total || 0)

    // Process chart data - group by date
    const chartData = processChartData(recentShipmentsResult)
    
    // Calculate growth percentages (mock for now)
    const stats = {
      totalCustomers: {
        value: totalCustomers,
        growth: calculateGrowth(totalCustomers, 'customers')
      },
      totalProducts: {
        value: totalProducts,
        growth: calculateGrowth(totalProducts, 'products')
      },
      totalShipments: {
        value: totalShipments,
        growth: calculateGrowth(totalShipments, 'shipments')
      },
      pendingShipments: {
        value: pendingShipments,
        growth: 0
      },
      completedShipments: {
        value: completedShipments,
        growth: calculateGrowth(completedShipments, 'completed')
      },
      lowStockProducts: {
        value: lowStockProducts,
        growth: 0
      },
      totalRevenue: {
        value: totalRevenue,
        growth: calculateGrowth(totalRevenue, 'revenue')
      },
      chartData
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Dashboard GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Dashboard verileri yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

function processChartData(shipments: any[]) {
  // Group shipments by date for the last 7 days
  const last7Days = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayShipments = shipments.filter((s: any) => {
      const shipmentDate = new Date(s.createdAt).toISOString().split('T')[0]
      return shipmentDate === dateStr
    })
    
    last7Days.push({
      date: dateStr,
      shipments: dayShipments.length,
      revenue: dayShipments.reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || 0), 0)
    })
  }
  
  return last7Days
}

function calculateGrowth(currentValue: number, type: string): number {
  // Mock growth calculation - in real app, compare with previous period
  const growthRates: { [key: string]: number } = {
    customers: 12.5,
    products: 8.3,
    shipments: 15.7,
    completed: 18.2,
    revenue: 22.1
  }
  
  return growthRates[type] || 0
}