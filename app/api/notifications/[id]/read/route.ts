import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Mock notification storage (in production, use database)
const notifications = new Map<string, any[]>()

export async function PUT(
  request: NextRequest,
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

    const userNotifications = notifications.get(userId.toString()) || []
    const notificationIndex = userNotifications.findIndex(n => n.id === params.id)
    
    if (notificationIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Bildirim bulunamadı' },
        { status: 404 }
      )
    }

    userNotifications[notificationIndex].read = true
    notifications.set(userId.toString(), userNotifications)

    return NextResponse.json({
      success: true,
      data: userNotifications[notificationIndex]
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Bildirim güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}