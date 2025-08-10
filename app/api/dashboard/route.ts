import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all statistics in parallel for current user
    const [
      totalCustomers,
      totalProducts,
      totalShipments,
      pendingShipments,
      completedShipments,
      lowStockProducts,
      totalRevenue,
      recentShipments
    ] = await Promise.all([
      // Total customers
      prisma.customer.count({
        where: { userId: userId }
      }),
      
      // Total products
      prisma.product.count({
        where: { userId: userId }
      }),
      
      // Total shipments
      prisma.shipment.count({
        where: { userId: userId }
      }),
      
      // Pending shipments
      prisma.shipment.count({
        where: { 
          userId: userId,
          status: 'PENDING' 
        }
      }),
      
      // Completed shipments
      prisma.shipment.count({
        where: { 
          userId: userId,
          status: 'DELIVERED' 
        }
      }),
      
      // Low stock products
      prisma.stock.count({
        where: {
          product: {
            userId: userId
          },
          quantity: {
            lte: 5 // minQuantity comparison
          }
        }
      }),
      
      // Total revenue
      prisma.shipment.aggregate({
        _sum: {
          totalAmount: true
        },
        where: {
          userId: userId,
          status: 'DELIVERED'
        }
      }),
      
      // Recent shipments for chart data
      prisma.shipment.findMany({
        where: {
          userId: userId
        },
        take: 30,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          createdAt: true,
          totalAmount: true,
          status: true
        }
      })
    ])

    // Process chart data - group by date
    const chartData = processChartData(recentShipments)
    
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
        value: totalRevenue._sum.totalAmount || 0,
        growth: calculateGrowth(totalRevenue._sum.totalAmount || 0, 'revenue')
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
    
    const dayShipments = shipments.filter(s => 
      s.createdAt.toISOString().split('T')[0] === dateStr
    )
    
    last7Days.push({
      date: dateStr,
      shipments: dayShipments.length,
      revenue: dayShipments.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    })
  }
  
  return last7Days
}

function calculateGrowth(currentValue: number, type: string): number {
  // Mock growth calculation - in real app, compare with previous period
  const growthRates = {
    customers: 12.5,
    products: 8.3,
    shipments: 15.7,
    completed: 18.2,
    revenue: 22.1
  }
  
  return growthRates[type as keyof typeof growthRates] || 0
}