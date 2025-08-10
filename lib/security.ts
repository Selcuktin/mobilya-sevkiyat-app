// Enhanced security utilities for production

import crypto from 'crypto'
import { NextRequest } from 'next/server'

// CSRF Protection
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(sessionToken, 'hex')
  )
}

// Content Security Policy
export const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.cloudinary.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim()

// Security Headers
export const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': CSP_HEADER
}

// IP Whitelist for admin functions
const ADMIN_IP_WHITELIST = process.env.ADMIN_IP_WHITELIST?.split(',') || []

export function isAdminIP(request: NextRequest): boolean {
  if (ADMIN_IP_WHITELIST.length === 0) return true // No restriction in dev
  
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  
  return ADMIN_IP_WHITELIST.includes(ip)
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0

  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Şifre küçük harf içermelidir')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre büyük harf içermelidir')
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    errors.push('Şifre rakam içermelidir')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Şifre özel karakter içermelidir')
  } else {
    score += 1
  }

  return {
    isValid: errors.length === 0,
    errors,
    score
  }
}

// Session security
export function generateSecureSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

// API Key validation
export function validateAPIKey(apiKey: string): boolean {
  const validKeys = process.env.API_KEYS?.split(',') || []
  return validKeys.includes(apiKey)
}

// Audit logging
export interface AuditLog {
  userId?: string
  action: string
  resource: string
  ip: string
  userAgent: string
  timestamp: Date
  success: boolean
  details?: any
}

export function createAuditLog(
  request: NextRequest,
  action: string,
  resource: string,
  success: boolean,
  userId?: string,
  details?: any
): AuditLog {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  
  return {
    userId,
    action,
    resource,
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date(),
    success,
    details
  }
}

// File upload security
export function validateFileUpload(file: File): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (file.size > maxSize) {
    errors.push('Dosya boyutu 5MB\'dan büyük olamaz')
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push('Sadece JPEG, PNG, WebP ve GIF dosyaları yüklenebilir')
  }

  // Check file signature (magic numbers)
  const reader = new FileReader()
  reader.onload = (e) => {
    const arr = new Uint8Array(e.target?.result as ArrayBuffer)
    const header = Array.from(arr.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('')
    
    const signatures = {
      'ffd8ffe0': 'image/jpeg',
      'ffd8ffe1': 'image/jpeg',
      '89504e47': 'image/png',
      '52494646': 'image/webp',
      '47494638': 'image/gif'
    }

    if (!Object.keys(signatures).some(sig => header.startsWith(sig))) {
      errors.push('Geçersiz dosya formatı')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}