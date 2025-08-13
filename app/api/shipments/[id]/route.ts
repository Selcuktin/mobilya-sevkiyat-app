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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const prismaClient = await getPrismaClient()

    // Get shipment with customer and items using raw SQL
    const shipmentResult = await prismaClient.$queryRaw`
      SELECT 
        s.id,
        s.address,
        s.city,
        s.status,
        s."totalAmount",
        s."deliveryDate",
        s."createdAt",
        c.name as "customerName",
        c.email as "customerEmail",
        c.phone as "customerPhone"
      FROM shipments s
      INNER JOIN customers c ON s."customerId" = c.id
      WHERE s.id = ${params.id} AND s."userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!shipmentResult || shipmentResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sevkiyat bulunamadı' },
        { status: 404 }
      )
    }

    const shipmentData = shipmentResult[0]

    // Get shipment items separately
    const itemsResult = await prismaClient.$queryRaw`
      SELECT 
        si.id,
        si.quantity,
        si."unitPrice",
        p.name as "productName"
      FROM shipment_items si
      INNER JOIN products p ON si."productId" = p.id
      WHERE si."shipmentId" = ${params.id}
      ORDER BY si.id
    ` as any[]

    const transformedShipment = {
      id: shipmentData.id,
      orderNumber: `SHP-${shipmentData.id.toString().padStart(4, '0')}`,
      customerName: shipmentData.customerName,
      customerEmail: shipmentData.customerEmail,
      customerPhone: shipmentData.customerPhone,
      address: shipmentData.address,
      city: shipmentData.city,
      status: shipmentData.status,
      totalAmount: Number(shipmentData.totalAmount) || 0,
      itemCount: itemsResult.length,
      items: itemsResult.map((item: any) => ({
        id: item.id,
        productName: item.productName,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        totalPrice: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
      })),
      createdAt: new Date(shipmentData.createdAt).toISOString().split('T')[0],
      deliveryDate: shipmentData.deliveryDate 
        ? new Date(shipmentData.deliveryDate).toISOString().split('T')[0] 
        : null
    }

    return NextResponse.json({
      success: true,
      data: transformedShipment
    })
  } catch (error) {
    console.error('Shipment GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Sevkiyat yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status, address, city, deliveryDate } = body

    const prismaClient = await getPrismaClient()

    // Check if shipment exists and belongs to user
    const existingShipment = await prismaClient.$queryRaw`
      SELECT id FROM shipments 
      WHERE id = ${params.id} AND "userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!existingShipment || existingShipment.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sevkiyat bulunamadı' },
        { status: 404 }
      )
    }

    // Update shipment using raw SQL
    await prismaClient.$executeRaw`
      UPDATE shipments 
      SET 
        status = COALESCE(${status}, status),
        address = COALESCE(${address}, address),
        city = COALESCE(${city}, city),
        "deliveryDate" = COALESCE(${deliveryDate ? new Date(deliveryDate) : null}, "deliveryDate"),
        "updatedAt" = NOW()
      WHERE id = ${params.id} AND "userId" = ${userId}
    `

    // Get updated shipment with customer data
    const updatedShipmentResult = await prismaClient.$queryRaw`
      SELECT 
        s.id,
        s.status,
        s."totalAmount",
        s."createdAt",
        s."deliveryDate",
        c.name as "customerName"
      FROM shipments s
      INNER JOIN customers c ON s."customerId" = c.id
      WHERE s.id = ${params.id} AND s."userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!updatedShipmentResult || updatedShipmentResult.length === 0) {
      throw new Error('Shipment not found after update')
    }

    const updatedData = updatedShipmentResult[0]

    const transformedShipment = {
      id: updatedData.id,
      orderNumber: `SHP-${updatedData.id.toString().padStart(4, '0')}`,
      customerName: updatedData.customerName,
      status: updatedData.status,
      totalAmount: Number(updatedData.totalAmount) || 0,
      createdAt: new Date(updatedData.createdAt).toISOString().split('T')[0],
      deliveryDate: updatedData.deliveryDate 
        ? new Date(updatedData.deliveryDate).toISOString().split('T')[0] 
        : null
    }

    return NextResponse.json({
      success: true,
      data: transformedShipment
    })
  } catch (error) {
    console.error('Shipment PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Sevkiyat güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const prismaClient = await getPrismaClient()

    // Check if shipment exists and belongs to user
    const existingShipment = await prismaClient.$queryRaw`
      SELECT id FROM shipments 
      WHERE id = ${params.id} AND "userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!existingShipment || existingShipment.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sevkiyat bulunamadı' },
        { status: 404 }
      )
    }

    // Delete shipment items first
    await prismaClient.$executeRaw`
      DELETE FROM shipment_items WHERE "shipmentId" = ${params.id}
    `

    // Delete shipment
    await prismaClient.$executeRaw`
      DELETE FROM shipments 
      WHERE id = ${params.id} AND "userId" = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: 'Sevkiyat başarıyla silindi'
    })
  } catch (error) {
    console.error('Shipment DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Sevkiyat silinirken hata oluştu' },
      { status: 500 }
    )
  }
}