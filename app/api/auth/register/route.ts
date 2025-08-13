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
    console.log('Registration request received')
    
    const body = await request.json()
    console.log('Request body parsed:', { ...body, password: '[HIDDEN]' })
    
    const { name, email, password } = body

    // Validation
    if (!name || !email || !password) {
      console.log('Validation failed: missing fields')
      return NextResponse.json(
        { message: 'Tüm alanlar gereklidir' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.log('Validation failed: password too short')
      return NextResponse.json(
        { message: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      )
    }

    console.log('Getting Prisma client...')
    const prismaClient = await getPrismaClient()
    console.log('Prisma client obtained')

    // Check if user already exists using raw SQL
    console.log('Checking if user exists...')
    const existingUsers = await prismaClient.$queryRaw`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    ` as any[]

    if (existingUsers && existingUsers.length > 0) {
      console.log('User already exists')
      return NextResponse.json(
        { message: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Hash password
    console.log('Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('Password hashed')

    // Create user using raw SQL
    console.log('Creating user...')
    const newUsers = await prismaClient.$queryRaw`
      INSERT INTO users (id, name, email, password, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${email}, ${hashedPassword}, NOW(), NOW())
      RETURNING id, name, email
    ` as any[]

    if (!newUsers || newUsers.length === 0) {
      console.log('User creation failed: no user returned')
      throw new Error('User creation failed')
    }

    const user = newUsers[0]
    console.log('User created successfully:', { id: user.id, email: user.email })

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
    console.error('Registration error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    
    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        return NextResponse.json(
          { message: 'Veritabanı bağlantı hatası' },
          { status: 500 }
        )
      }
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponse.json(
          { message: 'Bu email adresi zaten kullanılıyor' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { message: 'Sunucu hatası. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}