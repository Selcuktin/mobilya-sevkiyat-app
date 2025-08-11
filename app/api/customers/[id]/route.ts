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

    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        userId: userId
      },
      include: {
        shipments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    const transformedCustomer = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      totalOrders: customer.shipments.length,
      totalSpent: customer.shipments.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
      lastOrderDate: customer.shipments.length > 0 
        ? customer.shipments[0].createdAt.toISOString()
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

    const body = await _request.json()
    const { name, email, phone, address, city } = body

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: name || '',
        email: email || '',
        phone: phone || '',
        address: address || null,
        city: city || null
      },
      include: {
        shipments: true
      }
    })

    const transformedCustomer = {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      address: updatedCustomer.address,
      city: updatedCustomer.city,
      totalOrders: updatedCustomer.shipments.length,
      totalSpent: updatedCustomer.shipments.reduce((sum: number, s: any) => sum + s.totalAmount, 0),
      lastOrderDate: updatedCustomer.shipments.length > 0 
        ? updatedCustomer.shipments[0].createdAt.toISOString()
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

    // Delete customer
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