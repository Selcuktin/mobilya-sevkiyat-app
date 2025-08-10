const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      // Test user credentials
      TEST_EMAIL: 'test@example.com',
      TEST_PASSWORD: 'testpassword123',
      // API endpoints
      API_URL: 'http://localhost:3000/api',
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        // Custom tasks for database seeding, cleanup, etc.
        seedDatabase() {
          // Database seeding logic
          return null
        },
        cleanDatabase() {
          // Database cleanup logic
          return null
        },
        log(message) {
          console.log(message)
          return null
        }
      })
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
})