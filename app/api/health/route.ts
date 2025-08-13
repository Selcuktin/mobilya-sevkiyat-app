import { NextResponse } from 'next/server'

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

export async function GET() {
  try {
    console.log('Health check started')
    
    // Test database connection
    const prismaClient = await getPrismaClient()
    console.log('Prisma client obtained')
    
    // Test simple query
    const result = await prismaClient.$queryRaw`SELECT 1 as test`
    console.log('Database query successful:', result)
    
    // Test users table exists
    const userCount = await prismaClient.$queryRaw`
      SELECT COUNT(*) as count FROM users
    ` as any[]
    console.log('Users table query successful:', userCount)
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      usersTable: 'exists',
      userCount: Number(userCount[0]?.count || 0)
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        database: 'disconnected'
      },
      { status: 503 }
    )
  }
}