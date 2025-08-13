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

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const prismaClient = await getPrismaClient()

    // Get customers with shipment data using raw SQL
    const customers = await prismaClient.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.city,
        c."createdAt",
        COUNT(s.id) as "totalOrders",
        COALESCE(SUM(s."totalAmount"), 0) as "totalSpent",
        MAX(s."createdAt") as "lastOrderDate"
      FROM customers c
      LEFT JOIN shipments s ON c.id = s."customerId" AND s."userId" = ${userId}
      WHERE c."userId" = ${userId}
      GROUP BY c.id, c.name, c.email, c.phone, c.address, c.city, c."createdAt"
      ORDER BY c."createdAt" DESC
    ` as any[]

    // Transform data to match frontend expectations
    const transformedCustomers = customers.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      totalOrders: Number(customer.totalOrders) || 0,
      totalSpent: Number(customer.totalSpent) || 0,
      lastOrderDate: customer.lastOrderDate 
        ? new Date(customer.lastOrderDate).toISOString().split('T')[0]
        : null,
      status: Number(customer.totalOrders) > 0 ? 'Aktif' : 'Pasif'
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

    const prismaClient = await getPrismaClient()

    while (emailExists) {
      const existingCustomer = await prismaClient.$queryRaw`
        SELECT id FROM customers 
        WHERE email = ${finalEmail} AND "userId" = ${userId}
        LIMIT 1
      ` as any[]

      if (!existingCustomer || existingCustomer.length === 0) {
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

    // Create customer using raw SQL
    const newCustomers = await prismaClient.$queryRaw`
      INSERT INTO customers (id, name, email, phone, address, city, "userId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${finalEmail}, ${phone || null}, ${address || null}, ${city || null}, ${userId}, NOW(), NOW())
      RETURNING id, name, email, phone, address, city
    ` as any[]

    if (!newCustomers || newCustomers.length === 0) {
      throw new Error('Customer creation failed')
    }

    const customer = newCustomers[0]

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