import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { withRateLimit } from '@/lib/rateLimit'

// Mock notification storage (in production, use database)
const notifications = new Map<string, any[]>()

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userNotifications = notifications.get(userId.toString()) || []
    
    return NextResponse.json({
      success: true,
      data: userNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Bildirimler yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
})

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
    const { type, title, message, actionUrl, actionText } = body

    const notification = {
      id: Date.now().toString(),
      type: type || 'info',
      title,
      message,
      timestamp: new Date(),
      read: false,
      actionUrl,
      actionText
    }

    const userNotifications = notifications.get(userId.toString()) || []
    userNotifications.push(notification)
    notifications.set(userId.toString(), userNotifications)

    return NextResponse.json({
      success: true,
      data: notification
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Bildirim oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
})