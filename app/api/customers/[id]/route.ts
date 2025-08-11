import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'

const prisma = new PrismaClient()

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // Use raw query to avoid type issues
    const customer = await prisma.$queryRaw`
      SELECT id, name, email, phone, address, city, "createdAt", "updatedAt"
      FROM customers 
      WHERE id = ${params.id} AND "userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!customer || customer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    const customerData = customer[0]

    // Get shipments separately
    const shipments = await prisma.$queryRaw`
      SELECT id, "totalAmount", "createdAt"
      FROM shipments 
      WHERE "customerId" = ${params.id} AND "userId" = ${userId}
      ORDER BY "createdAt" DESC
    ` as any[]

    const transformedCustomer = {
      id: customerData.id,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      city: customerData.city,
      totalOrders: shipments.length,
      totalSpent: shipments.reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || 0), 0),
      lastOrderDate: shipments.length > 0 
        ? new Date(shipments[0].createdAt).toISOString().split('T')[0]
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
    const existingCustomer = await prisma.$queryRaw`
      SELECT id FROM customers 
      WHERE id = ${params.id} AND "userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!existingCustomer || existingCustomer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Update using raw query to avoid type issues
    await prisma.$executeRaw`
      UPDATE customers 
      SET 
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        address = COALESCE(${address}, address),
        city = COALESCE(${city}, city),
        "updatedAt" = NOW()
      WHERE id = ${params.id} AND "userId" = ${userId}
    `

    // Get updated customer
    const updatedCustomer = await prisma.$queryRaw`
      SELECT id, name, email, phone, address, city
      FROM customers 
      WHERE id = ${params.id} AND "userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!updatedCustomer || updatedCustomer.length === 0) {
      throw new Error('Customer not found after update')
    }

    const customerData = updatedCustomer[0]

    // Get shipments
    const shipments = await prisma.$queryRaw`
      SELECT id, "totalAmount", "createdAt"
      FROM shipments 
      WHERE "customerId" = ${params.id} AND "userId" = ${userId}
      ORDER BY "createdAt" DESC
    ` as any[]

    const transformedCustomer = {
      id: customerData.id,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      city: customerData.city,
      totalOrders: shipments.length,
      totalSpent: shipments.reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || 0), 0),
      lastOrderDate: shipments.length > 0 
        ? new Date(shipments[0].createdAt).toISOString().split('T')[0]
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
    const existingCustomer = await prisma.$queryRaw`
      SELECT id FROM customers 
      WHERE id = ${params.id} AND "userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!existingCustomer || existingCustomer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Check if customer has shipments
    const shipmentCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM shipments 
      WHERE "customerId" = ${params.id} AND "userId" = ${userId}
    ` as any[]

    const count = Number(shipmentCount[0]?.count || 0)

    if (count > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu müşterinin sevkiyatları olduğu için silinemez' },
        { status: 400 }
      )
    }

    // Delete customer
    await prisma.$executeRaw`
      DELETE FROM customers 
      WHERE id = ${params.id} AND "userId" = ${userId}
    `

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