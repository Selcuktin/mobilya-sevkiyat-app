import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { SECURITY_HEADERS } from "./lib/security"

export default withAuth(
  function middleware(req) {
    // Add security headers
    const response = NextResponse.next()
    
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add request ID for tracing
    response.headers.set('x-request-id', crypto.randomUUID())
    
    // CORS headers for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow health check without auth
        if (req.nextUrl.pathname === '/api/health') {
          return true
        }
        
        // Allow public routes
        const publicRoutes = ['/api/auth', '/auth', '/_next', '/favicon.ico']
        if (publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
          return true
        }
        
        // Require auth for protected routes
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    // Protect all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ]
}