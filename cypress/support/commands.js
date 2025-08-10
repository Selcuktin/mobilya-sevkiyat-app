// Custom Cypress commands

// Authentication commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      logout(): Chainable<void>
      seedDatabase(): Chainable<void>
      cleanDatabase(): Chainable<void>
      apiRequest(method: string, url: string, body?: any): Chainable<any>
      shouldBeVisible(): Chainable<JQuery<HTMLElement>>
      shouldContainText(text: string): Chainable<JQuery<HTMLElement>>
      waitForPageLoad(): Chainable<void>
      fillForm(formData: Record<string, string>): Chainable<void>
      submitForm(formSelector?: string): Chainable<void>
      getTableRow(rowIndex: number): Chainable<JQuery<HTMLElement>>
      getTableCell(rowIndex: number, cellIndex: number): Chainable<JQuery<HTMLElement>>
      openModal(modalTrigger: string): Chainable<void>
      closeModal(): Chainable<void>
      shouldShowSuccessToast(message: string): Chainable<void>
      shouldShowErrorToast(message: string): Chainable<void>
      uploadFile(selector: string, fileName: string, fileType?: string): Chainable<void>
    }
  }
}