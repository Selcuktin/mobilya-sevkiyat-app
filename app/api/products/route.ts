import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'
import { withRateLimit } from '@/lib/rateLimit'
import { validateProduct, sanitizeString } from '@/lib/validation'

const prisma = new PrismaClient()

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    
    const offset = (page - 1) * limit

    // Build WHERE conditions
    let whereConditions = `p."userId" = '${userId}'`
    
    if (search) {
      whereConditions += ` AND (p.name ILIKE '%${search}%' OR p.description ILIKE '%${search}%')`
    }
    
    if (category) {
      whereConditions += ` AND p.category = '${category}'`
    }

    // Get total count for pagination
    const totalCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM products p WHERE ${prisma.$queryRawUnsafe(whereConditions)}
    ` as any[]
    
    const totalCount = Number(totalCountResult[0]?.count || 0)

    // Get paginated products with stock
    const products = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.image,
        p.features,
        p.description,
        p."createdAt",
        s.quantity as "stockQuantity",
        s."minQuantity" as "stockMinQuantity"
      FROM products p
      LEFT JOIN stock s ON p.id = s."productId"
      WHERE ${prisma.$queryRawUnsafe(whereConditions)}
      ORDER BY p."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as any[]

    // Transform data to match frontend expectations
    const transformedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      stock: Number(product.stockQuantity) || 0,
      status: getStockStatus(Number(product.stockQuantity) || 0, Number(product.stockMinQuantity) || 0),
      features: product.features || [],
      description: product.description
    }))

    // Create paginated response
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      success: true,
      data: transformedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext,
        hasPrev
      }
    })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Ürünler yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
})

function getStockStatus(quantity: number, minQuantity: number): string {
  if (quantity === 0) return 'Tükendi'
  if (quantity < minQuantity) return 'Az Stok'
  if (quantity > minQuantity * 3) return 'Fazla Stok'
  return 'Stokta'
}

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Sanitize input data
    const sanitizedData = {
      name: sanitizeString(body.name || ''),
      category: sanitizeString(body.category || ''),
      price: body.price,
      description: sanitizeString(body.description || ''),
      features: Array.isArray(body.features) ? body.features.map((f: string) => sanitizeString(f)) : [],
      initialStock: body.initialStock || 0,
      minStock: body.minStock || 5
    }

    // Enhanced validation
    const validation = validateProduct(sanitizedData)
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors[0] },
        { status: 400 }
      )
    }

    // Create product with stock using raw SQL transaction
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Start transaction
      await prisma.$executeRaw`BEGIN`

      // Create product
      await prisma.$executeRaw`
        INSERT INTO products (id, name, category, price, description, features, "userId", "createdAt", "updatedAt")
        VALUES (
          ${productId},
          ${sanitizedData.name},
          ${sanitizedData.category},
          ${Number(sanitizedData.price)},
          ${sanitizedData.description || null},
          ${JSON.stringify(sanitizedData.features.filter((f: string) => f.trim()))},
          ${userId},
          NOW(),
          NOW()
        )
      `

      // Create initial stock record
      await prisma.$executeRaw`
        INSERT INTO stock (id, "productId", quantity, "minQuantity", "maxQuantity", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          ${productId},
          ${Number(sanitizedData.initialStock)},
          ${Number(sanitizedData.minStock)},
          ${Number(sanitizedData.minStock) * 5},
          NOW(),
          NOW()
        )
      `

      // Commit transaction
      await prisma.$executeRaw`COMMIT`

      // Get created product with stock
      const createdProductResult = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.category,
          p.price,
          p.features,
          p.description,
          s.quantity as "stockQuantity",
          s."minQuantity" as "stockMinQuantity"
        FROM products p
        LEFT JOIN stock s ON p.id = s."productId"
        WHERE p.id = ${productId}
        LIMIT 1
      ` as any[]

      if (!createdProductResult || createdProductResult.length === 0) {
        throw new Error('Product creation failed')
      }

      const productData = createdProductResult[0]

      // Return formatted response
      const newProduct = {
        id: productData.id,
        name: productData.name,
        category: productData.category,
        price: Number(productData.price),
        stock: Number(productData.stockQuantity) || 0,
        status: getStockStatus(Number(productData.stockQuantity) || 0, Number(productData.stockMinQuantity) || 0),
        features: productData.features || [],
        description: productData.description
      }
      
      return NextResponse.json({
        success: true,
        data: newProduct
      })

    } catch (transactionError) {
      // Rollback on error
      await prisma.$executeRaw`ROLLBACK`
      throw transactionError
    }

  } catch (error) {
    console.error('Product POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Ürün eklenirken hata oluştu' },
      { status: 500 }
    )
  }
})