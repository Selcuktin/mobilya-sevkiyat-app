describe('Authentication', () => {
  beforeEach(() => {
    cy.cleanDatabase()
    cy.seedDatabase()
  })

  describe('Sign In', () => {
    it('should sign in with valid credentials', () => {
      cy.visit('/auth/signin')
      
      cy.get('[data-cy=email-input]').type(Cypress.env('TEST_EMAIL'))
      cy.get('[data-cy=password-input]').type(Cypress.env('TEST_PASSWORD'))
      cy.get('[data-cy=signin-button]').click()
      
      cy.url().should('include', '/dashboard')
      cy.get('[data-cy=user-menu]').should('be.visible')
    })

    it('should show error with invalid credentials', () => {
      cy.visit('/auth/signin')
      
      cy.get('[data-cy=email-input]').type('invalid@example.com')
      cy.get('[data-cy=password-input]').type('wrongpassword')
      cy.get('[data-cy=signin-button]').click()
      
      cy.shouldShowErrorToast('Geçersiz email veya şifre')
      cy.url().should('include', '/auth/signin')
    })

    it('should validate required fields', () => {
      cy.visit('/auth/signin')
      
      cy.get('[data-cy=signin-button]').click()
      
      cy.get('[data-cy=email-input]').should('have.attr', 'required')
      cy.get('[data-cy=password-input]').should('have.attr', 'required')
    })
  })

  describe('Sign Up', () => {
    it('should create new account with valid data', () => {
      cy.visit('/auth/signup')
      
      const newUser = {
        name: 'Test User',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
      
      cy.fillForm(newUser)
      cy.get('[data-cy=signup-button]').click()
      
      cy.shouldShowSuccessToast('Hesap başarıyla oluşturuldu')
      cy.url().should('include', '/auth/signin')
    })

    it('should validate password confirmation', () => {
      cy.visit('/auth/signup')
      
      cy.get('[data-cy=password-input]').type('password123')
      cy.get('[data-cy=confirmPassword-input]').type('differentpassword')
      cy.get('[data-cy=signup-button]').click()
      
      cy.shouldShowErrorToast('Şifreler eşleşmiyor')
    })

    it('should validate email format', () => {
      cy.visit('/auth/signup')
      
      cy.get('[data-cy=email-input]').type('invalid-email')
      cy.get('[data-cy=signup-button]').click()
      
      cy.get('[data-cy=email-input]').should('have.attr', 'type', 'email')
    })
  })

  describe('Sign Out', () => {
    it('should sign out successfully', () => {
      cy.login()
      cy.visit('/dashboard')
      
      cy.logout()
      
      cy.url().should('include', '/auth/signin')
      cy.get('[data-cy=user-menu]').should('not.exist')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to signin when not authenticated', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/auth/signin')
    })

    it('should allow access when authenticated', () => {
      cy.login()
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
    })
  })
})