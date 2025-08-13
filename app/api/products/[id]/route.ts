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

    const prismaClient = await getPrismaClient()

    // Get product with stock using raw SQL
    const productResult = await prismaClient.$queryRaw`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.image,
        p.features,
        p.description,
        p."createdAt",
        p."updatedAt",
        s.id as "stockId",
        s.quantity as "stockQuantity",
        s."minQuantity" as "stockMinQuantity",
        s."maxQuantity" as "stockMaxQuantity"
      FROM products p
      LEFT JOIN stock s ON p.id = s."productId"
      WHERE p.id = ${params.id} AND p."userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!productResult || productResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }

    const productData = productResult[0]

    // Transform data to match expected format
    const product = {
      id: productData.id,
      name: productData.name,
      category: productData.category,
      price: Number(productData.price),
      image: productData.image,
      features: productData.features || [],
      description: productData.description,
      createdAt: productData.createdAt,
      updatedAt: productData.updatedAt,
      stock: productData.stockId ? {
        id: productData.stockId,
        quantity: Number(productData.stockQuantity) || 0,
        minQuantity: Number(productData.stockMinQuantity) || 0,
        maxQuantity: Number(productData.stockMaxQuantity) || 0
      } : null
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Ürün yüklenirken hata oluştu' },
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
    const { name, price, description, category } = body

    const prismaClient = await getPrismaClient()

    // Check if product exists and belongs to user
    const existingProduct = await prismaClient.$queryRaw`
      SELECT id FROM products 
      WHERE id = ${params.id} AND "userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!existingProduct || existingProduct.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }

    // Update product using raw SQL
    await prismaClient.$executeRaw`
      UPDATE products 
      SET 
        name = COALESCE(${name}, name),
        price = COALESCE(${price ? Number(price) : null}, price),
        description = COALESCE(${description}, description),
        category = COALESCE(${category}, category),
        "updatedAt" = NOW()
      WHERE id = ${params.id} AND "userId" = ${userId}
    `

    // Get updated product
    const updatedProductResult = await prismaClient.$queryRaw`
      SELECT id, name, category, price, image, features, description, "createdAt", "updatedAt"
      FROM products 
      WHERE id = ${params.id} AND "userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!updatedProductResult || updatedProductResult.length === 0) {
      throw new Error('Product not found after update')
    }

    const updatedProduct = {
      id: updatedProductResult[0].id,
      name: updatedProductResult[0].name,
      category: updatedProductResult[0].category,
      price: Number(updatedProductResult[0].price),
      image: updatedProductResult[0].image,
      features: updatedProductResult[0].features || [],
      description: updatedProductResult[0].description,
      createdAt: updatedProductResult[0].createdAt,
      updatedAt: updatedProductResult[0].updatedAt
    }

    return NextResponse.json({
      success: true,
      data: updatedProduct
    })
  } catch (error) {
    console.error('Product PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Ürün güncellenirken hata oluştu' },
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

    const prismaClient = await getPrismaClient()

    // Check if product exists and belongs to user
    const existingProduct = await prismaClient.$queryRaw`
      SELECT id FROM products 
      WHERE id = ${params.id} AND "userId" = ${userId}
      LIMIT 1
    ` as any[]

    if (!existingProduct || existingProduct.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }

    // Delete related stock first (if exists)
    await prismaClient.$executeRaw`
      DELETE FROM stock WHERE "productId" = ${params.id}
    `

    // Delete product
    await prismaClient.$executeRaw`
      DELETE FROM products 
      WHERE id = ${params.id} AND "userId" = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla silindi'
    })
  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Ürün silinirken hata oluştu' },
      { status: 500 }
    )
  }
}