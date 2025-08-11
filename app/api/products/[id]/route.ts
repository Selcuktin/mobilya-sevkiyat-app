import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'

const prisma = new PrismaClient()

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

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: name || '',
        price: price || 0,
        description: description || null,
        category: category || null
      }
    })

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

    await prisma.product.delete({
      where: { id: params.id }
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