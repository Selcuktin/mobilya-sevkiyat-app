import { NextResponse } from 'next/server'
import { getHealthStatus } from '@/lib/monitoring'

export async function GET() {
  try {
    const healthStatus = await getHealthStatus()
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503
    
    return NextResponse.json(healthStatus, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    )
  }
}