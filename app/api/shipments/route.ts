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

    const shipments = await prisma.shipment.findMany({
      where: {
        userId: userId
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data to match frontend expectations
    const transformedShipments = shipments.map(shipment => ({
      id: shipment.id,
      orderNumber: `SHP-${shipment.id.toString().padStart(4, '0')}`,
      customerName: shipment.customer.name,
      customerEmail: shipment.customer.email,
      customerPhone: shipment.customer.phone,
      address: shipment.address,
      city: shipment.city,
      status: shipment.status,
      totalAmount: shipment.totalAmount,
      itemCount: shipment.items.length,
      items: shipment.items.map(item => ({
        id: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      })),
      createdAt: shipment.createdAt.toISOString().split('T')[0],
      deliveryDate: shipment.deliveryDate?.toISOString().split('T')[0] || null
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
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })
        if (product) {
          totalAmount += item.quantity * product.price
        }
      }
    }

    // Create shipment with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create shipment
      const shipment = await tx.shipment.create({
        data: {
          customerId: customerId,
          address: address || '',
          city: city || '',
          status: 'PENDING',
          totalAmount,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          userId: userId
        }
      })

      // Create shipment items and update stock (only if items exist)
      if (items && items.length > 0) {
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          })

          if (!product) {
            throw new Error(`Ürün bulunamadı: ${item.productId}`)
          }

          // Create shipment item
          await tx.shipmentItem.create({
            data: {
              shipmentId: shipment.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: product.price
            }
          })

          // Update stock
          const stock = await tx.stock.findFirst({
            where: { productId: item.productId }
          })

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: {
                quantity: Math.max(0, stock.quantity - item.quantity)
              }
            })
          }
        }
      }

      return shipment
    })

    // Get the created shipment with relations
    const createdShipment = await prisma.shipment.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!createdShipment) {
      throw new Error('Sevkiyat oluşturulamadı')
    }

    // Return formatted response
    const newShipment = {
      id: createdShipment.id,
      orderNumber: `SHP-${createdShipment.id.toString().padStart(4, '0')}`,
      customerName: createdShipment.customer.name,
      customerEmail: createdShipment.customer.email,
      customerPhone: createdShipment.customer.phone,
      address: createdShipment.address,
      city: createdShipment.city,
      status: createdShipment.status,
      totalAmount: createdShipment.totalAmount,
      itemCount: createdShipment.items.length,
      items: createdShipment.items.map(item => ({
        id: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      })),
      createdAt: createdShipment.createdAt.toISOString().split('T')[0],
      deliveryDate: createdShipment.deliveryDate?.toISOString().split('T')[0] || null
    }
    
    return NextResponse.json({
      success: true,
      data: newShipment
    })
  } catch (error) {
    console.error('Shipment POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Sevkiyat oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}