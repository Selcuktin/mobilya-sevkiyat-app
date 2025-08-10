import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
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

    const shipment = await prisma.shipment.findFirst({
      where: {
        id: parseInt(params.id),
        userId: userId
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

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Sevkiyat bulunamadı' },
        { status: 404 }
      )
    }

    const transformedShipment = {
      id: shipment.id.toString(),
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
        id: item.id.toString(),
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      })),
      createdAt: shipment.createdAt.toISOString().split('T')[0],
      deliveryDate: shipment.deliveryDate?.toISOString().split('T')[0] || null
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

    // Input validation
    const validStatuses = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz durum değeri' },
        { status: 400 }
      )
    }

    // Check if shipment exists and belongs to user
    const existingShipment = await prisma.shipment.findFirst({
      where: {
        id: parseInt(params.id),
        userId: userId
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

    if (!existingShipment) {
      return NextResponse.json(
        { success: false, error: 'Sevkiyat bulunamadı' },
        { status: 404 }
      )
    }

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(status && { status }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(deliveryDate !== undefined && { 
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null 
        })
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

    // Return formatted response
    const transformedShipment = {
      id: updatedShipment.id.toString(),
      orderNumber: `SHP-${updatedShipment.id.toString().padStart(4, '0')}`,
      customerName: updatedShipment.customer.name,
      customerEmail: updatedShipment.customer.email,
      customerPhone: updatedShipment.customer.phone,
      address: updatedShipment.address,
      city: updatedShipment.city,
      status: updatedShipment.status,
      totalAmount: updatedShipment.totalAmount,
      itemCount: updatedShipment.items.length,
      items: updatedShipment.items.map(item => ({
        id: item.id.toString(),
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      })),
      createdAt: updatedShipment.createdAt.toISOString().split('T')[0],
      deliveryDate: updatedShipment.deliveryDate?.toISOString().split('T')[0] || null
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

    // Check if shipment exists and belongs to user
    const existingShipment = await prisma.shipment.findFirst({
      where: {
        id: parseInt(params.id),
        userId: userId
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!existingShipment) {
      return NextResponse.json(
        { success: false, error: 'Sevkiyat bulunamadı' },
        { status: 404 }
      )
    }

    // Check if shipment can be deleted (only PENDING shipments)
    if (existingShipment.status === 'DELIVERED') {
      return NextResponse.json(
        { success: false, error: 'Teslim edilmiş sevkiyatlar silinemez' },
        { status: 400 }
      )
    }

    // Delete shipment and restore stock in a transaction
    await prisma.$transaction(async (tx) => {
      // Restore stock for each item
      for (const item of existingShipment.items) {
        const stock = await tx.stock.findFirst({
          where: { productId: item.productId }
        })

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantity: stock.quantity + item.quantity
            }
          })
        }
      }

      // Delete shipment items
      await tx.shipmentItem.deleteMany({
        where: { shipmentId: parseInt(params.id) }
      })

      // Delete shipment
      await tx.shipment.delete({
        where: { id: parseInt(params.id) }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Sevkiyat başarıyla silindi ve stok geri yüklendi'
    })
  } catch (error) {
    console.error('Shipment DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Sevkiyat silinirken hata oluştu' },
      { status: 500 }
    )
  }
}