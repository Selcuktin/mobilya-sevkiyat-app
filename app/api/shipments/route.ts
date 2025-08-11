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

    // Get shipments with customer and items data using raw SQL
    const shipments = await prisma.$queryRaw`
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
        c.phone as "customerPhone",
        (
          SELECT COUNT(*) FROM shipment_items si WHERE si."shipmentId" = s.id
        ) as "itemCount"
      FROM shipments s
      INNER JOIN customers c ON s."customerId" = c.id
      WHERE s."userId" = ${userId}
      ORDER BY s."createdAt" DESC
    ` as any[]

    // Transform data to match frontend expectations
    const transformedShipments = shipments.map((shipment: any) => ({
      id: shipment.id,
      orderNumber: `SHP-${shipment.id.toString().padStart(4, '0')}`,
      customerName: shipment.customerName,
      customerEmail: shipment.customerEmail,
      customerPhone: shipment.customerPhone,
      address: shipment.address,
      city: shipment.city,
      status: shipment.status,
      totalAmount: Number(shipment.totalAmount) || 0,
      itemCount: Number(shipment.itemCount) || 0,
      items: [], // Items will be loaded separately if needed
      createdAt: new Date(shipment.createdAt).toISOString().split('T')[0],
      deliveryDate: shipment.deliveryDate 
        ? new Date(shipment.deliveryDate).toISOString().split('T')[0] 
        : null
    }))

    return NextResponse.json({
      success: true,
      data: transformedShipments
    })
  } catch (error) {
    console.error('Shipments GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Sevkiyatlar yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

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
    const { customerId, address, city, items, deliveryDate } = body

    // Minimal validation - no strict requirements
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Müşteri gereklidir' },
        { status: 400 }
      )
    }

    // Calculate total amount (handle empty items array)
    let totalAmount = 0
    if (items && items.length > 0) {
      for (const item of items) {
        const productResult = await prisma.$queryRaw`
          SELECT price FROM products WHERE id = ${item.productId} LIMIT 1
        ` as any[]
        
        if (productResult && productResult.length > 0) {
          totalAmount += item.quantity * Number(productResult[0].price)
        }
      }
    }

    // Generate shipment ID
    const shipmentId = `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Start transaction
      await prisma.$executeRaw`BEGIN`

      // Create shipment
      await prisma.$executeRaw`
        INSERT INTO shipments (id, "customerId", address, city, status, "totalAmount", "deliveryDate", "userId", "createdAt", "updatedAt")
        VALUES (
          ${shipmentId},
          ${customerId},
          ${address || ''},
          ${city || ''},
          'PENDING',
          ${totalAmount},
          ${deliveryDate ? new Date(deliveryDate) : null},
          ${userId},
          NOW(),
          NOW()
        )
      `

      // Create shipment items and update stock (only if items exist)
      if (items && items.length > 0) {
        for (const item of items) {
          const productResult = await prisma.$queryRaw`
            SELECT price FROM products WHERE id = ${item.productId} LIMIT 1
          ` as any[]

          if (!productResult || productResult.length === 0) {
            throw new Error(`Ürün bulunamadı: ${item.productId}`)
          }

          const productPrice = Number(productResult[0].price)

          // Create shipment item
          await prisma.$executeRaw`
            INSERT INTO shipment_items (id, "shipmentId", "productId", quantity, "unitPrice")
            VALUES (
              gen_random_uuid(),
              ${shipmentId},
              ${item.productId},
              ${item.quantity},
              ${productPrice}
            )
          `

          // Update stock
          await prisma.$executeRaw`
            UPDATE stock 
            SET quantity = GREATEST(0, quantity - ${item.quantity})
            WHERE "productId" = ${item.productId}
          `
        }
      }

      // Commit transaction
      await prisma.$executeRaw`COMMIT`

      // Get the created shipment with customer data
      const createdShipmentResult = await prisma.$queryRaw`
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
          c.phone as "customerPhone",
          (
            SELECT COUNT(*) FROM shipment_items si WHERE si."shipmentId" = s.id
          ) as "itemCount"
        FROM shipments s
        INNER JOIN customers c ON s."customerId" = c.id
        WHERE s.id = ${shipmentId}
        LIMIT 1
      ` as any[]

      if (!createdShipmentResult || createdShipmentResult.length === 0) {
        throw new Error('Sevkiyat oluşturulamadı')
      }

      const shipmentData = createdShipmentResult[0]

      // Return formatted response
      const newShipment = {
        id: shipmentData.id,
        orderNumber: `SHP-${shipmentData.id.toString().padStart(4, '0')}`,
        customerName: shipmentData.customerName,
        customerEmail: shipmentData.customerEmail,
        customerPhone: shipmentData.customerPhone,
        address: shipmentData.address,
        city: shipmentData.city,
        status: shipmentData.status,
        totalAmount: Number(shipmentData.totalAmount) || 0,
        itemCount: Number(shipmentData.itemCount) || 0,
        items: [], // Items can be loaded separately if needed
        createdAt: new Date(shipmentData.createdAt).toISOString().split('T')[0],
        deliveryDate: shipmentData.deliveryDate 
          ? new Date(shipmentData.deliveryDate).toISOString().split('T')[0] 
          : null
      }
      
      return NextResponse.json({
        success: true,
        data: newShipment
      })

    } catch (transactionError) {
      // Rollback on error
      await prisma.$executeRaw`ROLLBACK`
      throw transactionError
    }

  } catch (error) {
    console.error('Shipment POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Sevkiyat oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}