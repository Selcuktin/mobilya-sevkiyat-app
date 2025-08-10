// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  const originalFetch = win.fetch
  win.fetch = function (...args) {
    return originalFetch.apply(this, args)
  }
})

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions. You can customize this behavior.
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  return true
})

// Custom commands for authentication
Cypress.Commands.add('login', (email = Cypress.env('TEST_EMAIL'), password = Cypress.env('TEST_PASSWORD')) => {
  cy.session([email, password], () => {
    cy.visit('/auth/signin')
    cy.get('[data-cy=email-input]').type(email)
    cy.get('[data-cy=password-input]').type(password)
    cy.get('[data-cy=signin-button]').click()
    cy.url().should('include', '/dashboard')
  })
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=user-menu]').click()
  cy.get('[data-cy=logout-button]').click()
  cy.url().should('include', '/auth/signin')
})

// Database helpers
Cypress.Commands.add('seedDatabase', () => {
  cy.task('seedDatabase')
})

Cypress.Commands.add('cleanDatabase', () => {
  cy.task('cleanDatabase')
})

// API helpers
Cypress.Commands.add('apiRequest', (method, url, body = null) => {
  return cy.request({
    method,
    url: `${Cypress.env('API_URL')}${url}`,
    body,
    failOnStatusCode: false
  })
})

// Custom assertions
Cypress.Commands.add('shouldBeVisible', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.visible')
})

Cypress.Commands.add('shouldContainText', { prevSubject: true }, (subject, text) => {
  cy.wrap(subject).should('contain.text', text)
})

// Wait for page to load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-cy=page-loader]', { timeout: 10000 }).should('not.exist')
})

// Form helpers
Cypress.Commands.add('fillForm', (formData) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-cy=${field}-input]`).clear().type(value)
  })
})

Cypress.Commands.add('submitForm', (formSelector = '[data-cy=form]') => {
  cy.get(formSelector).submit()
})

// Table helpers
Cypress.Commands.add('getTableRow', (rowIndex) => {
  return cy.get('[data-cy=table-body] tr').eq(rowIndex)
})

Cypress.Commands.add('getTableCell', (rowIndex, cellIndex) => {
  return cy.getTableRow(rowIndex).find('td').eq(cellIndex)
})

// Modal helpers
Cypress.Commands.add('openModal', (modalTrigger) => {
  cy.get(`[data-cy=${modalTrigger}]`).click()
  cy.get('[data-cy=modal]').should('be.visible')
})

Cypress.Commands.add('closeModal', () => {
  cy.get('[data-cy=modal-close]').click()
  cy.get('[data-cy=modal]').should('not.exist')
})

// Toast/notification helpers
Cypress.Commands.add('shouldShowSuccessToast', (message) => {
  cy.get('[data-cy=toast-success]').should('be.visible').and('contain.text', message)
})

Cypress.Commands.add('shouldShowErrorToast', (message) => {
  cy.get('[data-cy=toast-error]').should('be.visible').and('contain.text', message)
})

// File upload helper
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'image/jpeg') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('fake file content'),
    fileName,
    mimeType: fileType,
  })
})