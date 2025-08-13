import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

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

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Tüm alanlar gereklidir' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      )
    }

    const prismaClient = await getPrismaClient()

    // Check if user already exists using raw SQL
    const existingUsers = await prismaClient.$queryRaw`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    ` as any[]

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { message: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user using raw SQL
    const newUsers = await prismaClient.$queryRaw`
      INSERT INTO users (id, name, email, password, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${email}, ${hashedPassword}, NOW(), NOW())
      RETURNING id, name, email
    ` as any[]

    if (!newUsers || newUsers.length === 0) {
      throw new Error('User creation failed')
    }

    const user = newUsers[0]

    // Return success (don't send password back)
    return NextResponse.json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}