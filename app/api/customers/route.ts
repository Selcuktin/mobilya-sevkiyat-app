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

    const customers = await prisma.customer.findMany({
      where: {
        userId: userId
      },
      include: {
        shipments: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data to match frontend expectations
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      totalOrders: customer.shipments.length,
      totalSpent: customer.shipments.reduce((sum, shipment) => sum + shipment.totalAmount, 0),
      lastOrderDate: customer.shipments.length > 0 
        ? customer.shipments[0].createdAt?.toISOString().split('T')[0] 
        : null,
      status: customer.shipments.length > 0 ? 'Aktif' : 'Pasif'
    }))

    return NextResponse.json({
      success: true,
      data: transformedCustomers
    })
  } catch (error) {
    console.error('Customers GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Müşteriler yüklenirken hata oluştu' },
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
    const { name, email, phone, address, city } = body

    // Minimal validation - only name is required
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Müşteri adı gereklidir' },
        { status: 400 }
      )
    }

    // Generate unique email if not provided
    let customerEmail = email
    if (!customerEmail) {
      const timestamp = Date.now()
      const randomNum = Math.floor(Math.random() * 1000)
      customerEmail = `musteri_${timestamp}_${randomNum}@temp.local`
    }

    // Check if email already exists and generate new one if needed
    let emailExists = true
    let counter = 1
    let finalEmail = customerEmail

    while (emailExists) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          email: finalEmail,
          userId: userId
        }
      })

      if (!existingCustomer) {
        emailExists = false
      } else {
        // If original email was provided, add counter
        if (email) {
          const [localPart, domain] = email.split('@')
          finalEmail = `${localPart}_${counter}@${domain}`
        } else {
          // If auto-generated, create new one
          const timestamp = Date.now()
          const randomNum = Math.floor(Math.random() * 1000)
          finalEmail = `musteri_${timestamp}_${randomNum}_${counter}@temp.local`
        }
        counter++
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        email: finalEmail,
        phone: phone || null,
        address: address || null,
        city: city || null,
        userId: userId
      }
    })

    // Return formatted response
    const newCustomer = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      status: 'Pasif'
    }
    
    return NextResponse.json({
      success: true,
      data: newCustomer
    })
  } catch (error) {
    console.error('Customer POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Müşteri eklenirken hata oluştu' },
      { status: 500 }
    )
  }
}