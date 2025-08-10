import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'

const prisma = new PrismaClient()

function getStockStatus(quantity: number, minQuantity: number): string {
  if (quantity === 0) return 'Tükendi'
  if (quantity < minQuantity) return 'Az Stok'
  if (quantity > minQuantity * 3) return 'Fazla Stok'
  return 'Stokta'
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

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        userId: userId
      },
      include: {
        stock: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }

    const transformedProduct = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock?.quantity || 0,
      status: getStockStatus(product.stock?.quantity || 0, product.stock?.minQuantity || 0),
      features: product.features || [],
      description: product.description
    }

    return NextResponse.json({
      success: true,
      data: transformedProduct
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
    const { name, category, price, description, features, initialStock, minStock } = body

    // Input validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Ürün adı gereklidir' },
        { status: 400 }
      )
    }

    if (!category?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Kategori gereklidir' },
        { status: 400 }
      )
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir fiyat giriniz' },
        { status: 400 }
      )
    }

    // Check if product exists and belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        userId: userId
      },
      include: {
        stock: true
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }

    // Update product with stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update product
      const product = await tx.product.update({
        where: { id: params.id },
        data: {
          name: name.trim(),
          category: category.trim(),
          price: parseFloat(price),
          description: description?.trim() || null,
          features: Array.isArray(features) ? features.filter(f => f.trim()) : []
        }
      })

      // Update stock if provided
      let stock = existingProduct.stock
      if (initialStock !== undefined || minStock !== undefined) {
        if (stock) {
          stock = await tx.stock.update({
            where: { id: stock.id },
            data: {
              ...(initialStock !== undefined && { quantity: parseInt(initialStock) }),
              ...(minStock !== undefined && { minQuantity: parseInt(minStock) }),
              ...(minStock !== undefined && { maxQuantity: parseInt(minStock) * 5 })
            }
          })
        } else {
          // Create stock record if it doesn't exist
          stock = await tx.stock.create({
            data: {
              productId: product.id,
              quantity: parseInt(initialStock) || 0,
              minQuantity: parseInt(minStock) || 5,
              maxQuantity: (parseInt(minStock) || 5) * 5
            }
          })
        }
      }

      return { product, stock }
    })

    // Return formatted response
    const updatedProduct = {
      id: result.product.id,
      name: result.product.name,
      category: result.product.category,
      price: result.product.price,
      stock: result.stock?.quantity || 0,
      status: getStockStatus(result.stock?.quantity || 0, result.stock?.minQuantity || 0),
      features: result.product.features,
      description: result.product.description
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

    // Check if product exists and belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        userId: userId
      },
      include: {
        stock: true,
        shipmentItems: true
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }

    // Check if product is used in any shipments
    if (existingProduct.shipmentItems.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu ürün sevkiyatlarda kullanıldığı için silinemez' },
        { status: 400 }
      )
    }

    // Delete product and related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete stock records
      if (existingProduct.stock) {
        await tx.stock.delete({
          where: { id: existingProduct.stock.id }
        })
      }

      // Delete product
      await tx.product.delete({
        where: { id: params.id }
      })
    })

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