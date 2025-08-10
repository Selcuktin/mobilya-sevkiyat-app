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
        id: parseInt(params.id),
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
      id: customer.id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      status: customer.status,
      totalOrders: customer.shipments.length,
      totalSpent: customer.shipments.reduce((sum, s) => sum + s.totalAmount, 0),
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

    // Input validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Müşteri adı gereklidir' },
        { status: 400 }
      )
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email adresi gereklidir' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir email adresi giriniz' },
        { status: 400 }
      )
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gereklidir' },
        { status: 400 }
      )
    }

    // Phone format validation (Turkish format)
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/
    const cleanPhone = phone.replace(/\s/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir telefon numarası giriniz (05XX XXX XX XX)' },
        { status: 400 }
      )
    }

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: parseInt(params.id),
        userId: userId
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Check for duplicate email (excluding current customer)
    const duplicateEmail = await prisma.customer.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        userId: userId,
        NOT: {
          id: parseInt(params.id)
        }
      }
    })

    if (duplicateEmail) {
      return NextResponse.json(
        { success: false, error: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(params.id) },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        address: address?.trim() || null,
        city: city?.trim() || null
      },
      include: {
        shipments: true
      }
    })

    // Return formatted response
    const transformedCustomer = {
      id: updatedCustomer.id.toString(),
      name: updatedCustomer.name,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      address: updatedCustomer.address,
      city: updatedCustomer.city,
      status: updatedCustomer.status,
      totalOrders: updatedCustomer.shipments.length,
      totalSpent: updatedCustomer.shipments.reduce((sum, s) => sum + s.totalAmount, 0),
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
        id: parseInt(params.id),
        userId: userId
      },
      include: {
        shipments: true
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Check if customer has any shipments
    if (existingCustomer.shipments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu müşterinin sevkiyatları olduğu için silinemez' },
        { status: 400 }
      )
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id: parseInt(params.id) }
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