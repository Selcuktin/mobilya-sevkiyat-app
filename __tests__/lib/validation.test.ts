import {
  validateEmail,
  validatePhone,
  sanitizeString,
  validateProduct,
  validateCustomer,
  validatePrice,
  validateQuantity
} from '@/lib/validation'

describe('Validation Functions', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('test+tag@example.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('test@.com')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(validateEmail(null as any)).toBe(false)
      expect(validateEmail(undefined as any)).toBe(false)
      expect(validateEmail(123 as any)).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate Turkish phone numbers', () => {
      expect(validatePhone('05551234567')).toBe(true)
      expect(validatePhone('+905551234567')).toBe(true)
      expect(validatePhone('0555 123 45 67')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(false)
      expect(validatePhone('05551234')).toBe(false)
      expect(validatePhone('abc')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")')
      expect(sanitizeString('<div>Hello</div>')).toBe('Hello')
      expect(sanitizeString('Normal text')).toBe('Normal text')
    })

    it('should remove JavaScript protocols', () => {
      expect(sanitizeString('javascript:alert("xss")')).toBe('alert("xss")')
      expect(sanitizeString('JAVASCRIPT:alert("xss")')).toBe('alert("xss")')
    })

    it('should remove event handlers', () => {
      expect(sanitizeString('onclick=alert("xss")')).toBe('alert("xss")')
      expect(sanitizeString('onload=malicious()')).toBe('malicious()')
    })

    it('should handle edge cases', () => {
      expect(sanitizeString('')).toBe('')
      expect(sanitizeString(null as any)).toBe('')
      expect(sanitizeString(undefined as any)).toBe('')
    })
  })

  describe('validatePrice', () => {
    it('should validate positive prices', () => {
      expect(validatePrice(100)).toBe(null)
      expect(validatePrice(0.01)).toBe(null)
      expect(validatePrice('50.99')).toBe(null)
    })

    it('should reject invalid prices', () => {
      expect(validatePrice(0)).toBeTruthy()
      expect(validatePrice(-10)).toBeTruthy()
      expect(validatePrice('abc')).toBeTruthy()
      expect(validatePrice('')).toBeTruthy()
    })
  })

  describe('validateQuantity', () => {
    it('should validate positive quantities', () => {
      expect(validateQuantity(1)).toBe(null)
      expect(validateQuantity(100)).toBe(null)
      expect(validateQuantity('50')).toBe(null)
    })

    it('should reject invalid quantities', () => {
      expect(validateQuantity(-1)).toBeTruthy()
      expect(validateQuantity('abc')).toBeTruthy()
      expect(validateQuantity('')).toBeTruthy()
      expect(validateQuantity(1000000)).toBeTruthy()
    })
  })

  describe('validateProduct', () => {
    it('should validate correct product data', () => {
      const validProduct = {
        name: 'Test Product',
        category: 'Test Category',
        price: 100,
        description: 'Test description',
        features: ['Feature 1', 'Feature 2'],
        initialStock: 10,
        minStock: 5
      }

      const result = validateProduct(validProduct)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject product with missing required fields', () => {
      const invalidProduct = {
        name: '',
        category: '',
        price: 0
      }

      const result = validateProduct(invalidProduct)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate product name length', () => {
      const productWithShortName = {
        name: 'A',
        category: 'Test',
        price: 100
      }

      const result = validateProduct(productWithShortName)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ürün adı en az 2 karakter olmalıdır')
    })
  })

  describe('validateCustomer', () => {
    it('should validate correct customer data', () => {
      const validCustomer = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '05551234567',
        address: 'Test Address',
        city: 'Istanbul'
      }

      const result = validateCustomer(validCustomer)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject customer with invalid email', () => {
      const invalidCustomer = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '05551234567'
      }

      const result = validateCustomer(invalidCustomer)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Geçerli bir email adresi giriniz')
    })

    it('should reject customer with invalid phone', () => {
      const invalidCustomer = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123'
      }

      const result = validateCustomer(invalidCustomer)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Geçerli bir telefon numarası giriniz (05XX XXX XX XX)')
    })
  })
})