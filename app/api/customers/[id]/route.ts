import { NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'

const prisma = new PrismaClient()

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getShipmentAmount(shipment: any): number {
  if (typeof shipment?.totalAmount === 'number') return shipment.totalAmount
  if (typeof shipment?.amount === 'number') return shipment.amount
  return 0
}

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

    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        userId: userId
      }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Get shipments separately to avoid type issues
    const shipments = await prisma.shipment.findMany({
      where: {
        customerId: customer.id,
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const transformedCustomer = {
      id: customer.id,
      name: customer.name,
      email: ('email' in customer ? (customer as any).email : null) as string | null,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      totalOrders: shipments.length,
      totalSpent: shipments.reduce((sum, shipment) => sum + getShipmentAmount(shipment), 0),
      lastOrderDate: shipments.length > 0 
        ? shipments[0].createdAt.toISOString()
        : null
    }

    return NextResponse.json({
      success: true,
      data: transformedCustomer
    })
  } catch (error) {
    console.error('Customer GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Müşteri yüklenirken hata oluştu' },
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
    const { name, email, phone, address, city } = body

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        userId: userId
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    const dataToUpdate: Prisma.CustomerUpdateInput = {}
    if (name) dataToUpdate.name = name
    if (email) dataToUpdate.email = email
    if (phone) dataToUpdate.phone = phone
    if (address !== undefined) dataToUpdate.address = address
    if (city !== undefined) dataToUpdate.city = city

    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: dataToUpdate,
    })

    // Get shipments separately
    const shipments = await prisma.shipment.findMany({
      where: {
        customerId: updatedCustomer.id,
        userId: userId
      }
    })

    const transformedCustomer = {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      email: ('email' in updatedCustomer ? (updatedCustomer as any).email : null) as string | null,
      phone: updatedCustomer.phone,
      address: updatedCustomer.address,
      city: updatedCustomer.city,
      totalOrders: shipments.length,
      totalSpent: shipments.reduce((sum, shipment) => sum + getShipmentAmount(shipment), 0),
      lastOrderDate: shipments.length > 0 
        ? shipments[0].createdAt.toISOString()
        : null
    }
    
    return NextResponse.json({
      success: true,
      data: transformedCustomer
    })
  } catch (error) {
    console.error('Customer PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Müşteri güncellenirken hata oluştu' },
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

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        userId: userId
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Check if customer has shipments
    const shipmentCount = await prisma.shipment.count({
      where: {
        customerId: params.id,
        userId: userId
      }
    })

    if (shipmentCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu müşterinin sevkiyatları olduğu için silinemez' },
        { status: 400 }
      )
    }

    await prisma.customer.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Müşteri başarıyla silindi'
    })
  } catch (error) {
    console.error('Customer DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Müşteri silinirken hata oluştu' },
      { status: 500 }
    )
  }
}