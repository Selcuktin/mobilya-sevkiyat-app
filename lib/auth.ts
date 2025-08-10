import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return (session?.user as any)?.id || null
}