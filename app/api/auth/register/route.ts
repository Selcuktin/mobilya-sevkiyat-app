import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Mock user database - gerçek uygulamada Prisma/database kullanılacak
let users: any[] = [
  {
    id: '1',
    email: 'demo@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // secret123
    name: 'Demo User'
  }
]

export async function POST(request: Request) {
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

    // Check if user already exists
    const existingUser = users.find(user => user.email === email)
    if (existingUser) {
      return NextResponse.json(
        { message: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString()
    }

    users.push(newUser)

    return NextResponse.json(
      { message: 'Hesap başarıyla oluşturuldu' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}