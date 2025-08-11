import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'

const prisma = new PrismaClient()

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

    const shipment = await prisma.shipment.findFirst({
      where: {
        id: params.id,
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
      items: shipment.items.map((item: any) => ({
        id: item.id,
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

    const updatedShipment = await prisma.shipment.update({
      where: { id: params.id },
      data: {
        status: status || 'PENDING',
        address: address || '',
        city: city || '',
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null
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

    const transformedShipment = {
      id: updatedShipment.id,
      orderNumber: `SHP-${updatedShipment.id.toString().padStart(4, '0')}`,
      customerName: updatedShipment.customer.name,
      status: updatedShipment.status,
      totalAmount: updatedShipment.totalAmount,
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

    await prisma.shipment.delete({
      where: { id: params.id }
    })

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