// Enhanced form validation utilities with security features

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface ValidationErrors {
  [key: string]: string
}

export function validateForm(data: any, rules: ValidationRules): ValidationErrors {
  const errors: ValidationErrors = {}

  Object.keys(rules).forEach(field => {
    const value = data[field]
    const rule = rules[field]

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${getFieldName(field)} gereklidir`
      return
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return
    }

    // Min length validation
    if (rule.minLength && value.toString().length < rule.minLength) {
      errors[field] = `${getFieldName(field)} en az ${rule.minLength} karakter olmalıdır`
      return
    }

    // Max length validation
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      errors[field] = `${getFieldName(field)} en fazla ${rule.maxLength} karakter olmalıdır`
      return
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      errors[field] = `${getFieldName(field)} geçerli bir format değil`
      return
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) {
        errors[field] = customError
        return
      }
    }
  })

  return errors
}

function getFieldName(field: string): string {
  const fieldNames: { [key: string]: string } = {
    name: 'Ad',
    email: 'Email',
    phone: 'Telefon',
    password: 'Şifre',
    confirmPassword: 'Şifre Tekrar',
    address: 'Adres',
    city: 'Şehir',
    category: 'Kategori',
    price: 'Fiyat',
    description: 'Açıklama',
    quantity: 'Miktar',
    minQuantity: 'Minimum Stok',
    maxQuantity: 'Maksimum Stok'
  }

  return fieldNames[field] || field
}

// Common validation rules
export const commonRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    required: true,
    pattern: /^[0-9\s\-\+\(\)]{10,}$/
  },
  password: {
    required: true,
    minLength: 6
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  price: {
    required: true,
    custom: (value: any) => {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) {
        return 'Fiyat geçerli bir sayı olmalıdır'
      }
      return null
    }
  },
  quantity: {
    required: true,
    custom: (value: any) => {
      const num = parseInt(value)
      if (isNaN(num) || num < 0) {
        return 'Miktar geçerli bir sayı olmalıdır'
      }
      return null
    }
  }
}

// Enhanced validation functions with XSS protection
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim()) && email.length <= 254
}

export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const sanitizeString = (str: string): string => {
  if (!str || typeof str !== 'string') return ''
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000) // Limit length
}

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} gereklidir`
  }
  return null
}

export const validateLength = (value: string, min: number, max: number, fieldName: string): string | null => {
  if (!value) return null
  if (value.length < min) {
    return `${fieldName} en az ${min} karakter olmalıdır`
  }
  if (value.length > max) {
    return `${fieldName} en fazla ${max} karakter olmalıdır`
  }
  return null
}

export const validateNumber = (value: any, fieldName: string, min?: number, max?: number): string | null => {
  const num = parseFloat(value)
  if (isNaN(num)) {
    return `${fieldName} geçerli bir sayı olmalıdır`
  }
  if (min !== undefined && num < min) {
    return `${fieldName} en az ${min} olmalıdır`
  }
  if (max !== undefined && num > max) {
    return `${fieldName} en fazla ${max} olmalıdır`
  }
  return null
}

export const validatePrice = (price: any): string | null => {
  return validateNumber(price, 'Fiyat', 0.01, 999999999)
}

export const validateQuantity = (quantity: any): string | null => {
  const num = parseInt(quantity)
  if (isNaN(num) || num < 0) {
    return 'Miktar geçerli bir pozitif sayı olmalıdır'
  }
  if (num > 999999) {
    return 'Miktar çok büyük'
  }
  return null
}

// XSS Protection
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// SQL Injection Protection (for raw queries)
export const sanitizeSqlInput = (input: string): string => {
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .replace(/\*\//g, '')
}

// Rate limiting helper
export const createRateLimiter = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>()
  
  return (identifier: string): boolean => {
    const now = Date.now()
    const userRequests = requests.get(identifier)
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(identifier, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (userRequests.count >= maxRequests) {
      return false
    }
    
    userRequests.count++
    return true
  }
}

// Validation schemas
export interface ProductValidation {
  name: string
  category: string
  price: number
  description?: string
  features?: string[]
  initialStock?: number
  minStock?: number
}

export const validateProduct = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Name validation
  const nameError = validateRequired(data.name, 'Ürün adı')
  if (nameError) errors.push(nameError)
  else {
    const lengthError = validateLength(data.name, 2, 100, 'Ürün adı')
    if (lengthError) errors.push(lengthError)
  }
  
  // Category validation
  const categoryError = validateRequired(data.category, 'Kategori')
  if (categoryError) errors.push(categoryError)
  
  // Price validation
  const priceError = validatePrice(data.price)
  if (priceError) errors.push(priceError)
  
  // Stock validation
  if (data.initialStock !== undefined) {
    const stockError = validateQuantity(data.initialStock)
    if (stockError) errors.push(stockError)
  }
  
  if (data.minStock !== undefined) {
    const minStockError = validateQuantity(data.minStock)
    if (minStockError) errors.push(minStockError)
  }
  
  return { isValid: errors.length === 0, errors }
}

export interface CustomerValidation {
  name: string
  email: string
  phone: string
  address?: string
  city?: string
}

export const validateCustomer = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Name validation
  const nameError = validateRequired(data.name, 'Müşteri adı')
  if (nameError) errors.push(nameError)
  else {
    const lengthError = validateLength(data.name, 2, 100, 'Müşteri adı')
    if (lengthError) errors.push(lengthError)
  }
  
  // Email validation
  const emailError = validateRequired(data.email, 'Email')
  if (emailError) errors.push(emailError)
  else if (!validateEmail(data.email)) {
    errors.push('Geçerli bir email adresi giriniz')
  }
  
  // Phone validation
  const phoneError = validateRequired(data.phone, 'Telefon')
  if (phoneError) errors.push(phoneError)
  else if (!validatePhone(data.phone)) {
    errors.push('Geçerli bir telefon numarası giriniz (05XX XXX XX XX)')
  }
  
  return { isValid: errors.length === 0, errors }
}