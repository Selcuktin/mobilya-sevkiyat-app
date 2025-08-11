import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'
import { withRateLimit, apiRateLimit } from '@/lib/rateLimit'
import { getPaginationParams, createPaginatedResponse, buildPaginatedQuery } from '@/lib/pagination'
import { validateProduct, sanitizeString } from '@/lib/validation'

const prisma = new PrismaClient()

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const paginationParams = getPaginationParams(searchParams)
    
    // Build query with pagination and search
    const query = buildPaginatedQuery(
      paginationParams,
      ['name', 'category', 'description'], // searchable fields
      'createdAt'
    )

    // Add user filter
    const where = {
      userId: userId,
      ...query.where
    }

    // Get total count for pagination
    const totalCount = await prisma.product.count({ where })

    // Get paginated products
    const products = await prisma.product.findMany({
      where,
      include: {
        stock: true
      },
      orderBy: query.orderBy,
      skip: query.skip,
      take: query.take
    })

    // Transform data to match frontend expectations
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock?.quantity || 0,
      status: getStockStatus(product.stock?.quantity || 0, product.stock?.minQuantity || 0),
      features: product.features || [],
      description: product.description
    }))

    // Create paginated response
    const paginatedResponse = createPaginatedResponse(
      transformedProducts,
      totalCount,
      paginationParams
    )

    return NextResponse.json({
      success: true,
      ...paginatedResponse
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

    // Create product with stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create product
      const product = await tx.product.create({
        data: {
          name: sanitizedData.name,
          category: sanitizedData.category,
          price: parseFloat(sanitizedData.price),
          description: sanitizedData.description || null,
          features: sanitizedData.features.filter((f: string) => f.trim()),
          userId: userId
        }
      })

      // Create initial stock record
      const stock = await tx.stock.create({
        data: {
          productId: product.id,
          quantity: Number(sanitizedData.initialStock) || 0,
          minQuantity: Number(sanitizedData.minStock) || 0,
          maxQuantity: (Number(sanitizedData.minStock) || 0) * 5 // Default max is 5x min
        }
      })

      return { product, stock }
    })

    // Return formatted response
    const newProduct = {
      id: result.product.id,
      name: result.product.name,
      category: result.product.category,
      price: result.product.price,
      stock: result.stock.quantity,
      status: getStockStatus(result.stock.quantity, result.stock.minQuantity),
      features: result.product.features,
      description: result.product.description
    }
    
    return NextResponse.json({
      success: true,
      data: newProduct
    })
  } catch (error) {
    console.error('Product POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Ürün eklenirken hata oluştu' },
      { status: 500 }
    )
  }
})