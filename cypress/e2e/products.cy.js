describe('Product Management', () => {
  beforeEach(() => {
    cy.cleanDatabase()
    cy.seedDatabase()
    cy.login()
  })

  describe('Product List', () => {
    it('should display products list', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=products-grid]').should('be.visible')
      cy.get('[data-cy=product-card]').should('have.length.at.least', 1)
    })

    it('should search products', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=search-input]').type('Yatak')
      cy.get('[data-cy=search-button]').click()
      
      cy.get('[data-cy=product-card]').each(($card) => {
        cy.wrap($card).should('contain.text', 'Yatak')
      })
    })

    it('should filter products by category', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=category-filter]').select('Yatak Odası')
      
      cy.get('[data-cy=product-card]').each(($card) => {
        cy.wrap($card).find('[data-cy=product-category]').should('contain.text', 'Yatak Odası')
      })
    })

    it('should filter products by stock status', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=stock-filter]').select('Az Stok')
      
      cy.get('[data-cy=product-card]').each(($card) => {
        cy.wrap($card).find('[data-cy=stock-status]').should('contain.text', 'Az Stok')
      })
    })
  })

  describe('Add Product', () => {
    it('should add new product successfully', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=add-product-button]').click()
      cy.get('[data-cy=product-modal]').should('be.visible')
      
      const productData = {
        name: 'Test Ürün',
        category: 'Yatak Odası',
        price: '1500',
        description: 'Test ürün açıklaması',
        features: 'Özellik 1\nÖzellik 2\nÖzellik 3',
        initialStock: '10',
        minStock: '5'
      }
      
      cy.fillForm(productData)
      
      // Upload product image
      cy.uploadFile('[data-cy=product-image-input]', 'test-product.jpg')
      
      cy.get('[data-cy=save-product-button]').click()
      
      cy.shouldShowSuccessToast('Ürün başarıyla eklendi')
      cy.get('[data-cy=product-modal]').should('not.exist')
      
      // Verify product appears in list
      cy.get('[data-cy=product-card]').contains('Test Ürün').should('be.visible')
    })

    it('should validate required fields', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=add-product-button]').click()
      cy.get('[data-cy=save-product-button]').click()
      
      cy.shouldShowErrorToast('Ürün adı ve fiyat alanları gereklidir')
    })

    it('should validate price format', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=add-product-button]').click()
      
      cy.get('[data-cy=name-input]').type('Test Ürün')
      cy.get('[data-cy=price-input]').type('invalid-price')
      cy.get('[data-cy=save-product-button]').click()
      
      cy.shouldShowErrorToast('Geçerli bir fiyat giriniz')
    })
  })

  describe('Edit Product', () => {
    it('should edit existing product', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      // Click edit button on first product
      cy.get('[data-cy=product-card]').first().find('[data-cy=edit-product-button]').click()
      cy.get('[data-cy=product-modal]').should('be.visible')
      
      // Update product name
      cy.get('[data-cy=name-input]').clear().type('Updated Product Name')
      cy.get('[data-cy=save-product-button]').click()
      
      cy.shouldShowSuccessToast('Ürün başarıyla güncellendi')
      cy.get('[data-cy=product-modal]').should('not.exist')
      
      // Verify updated name appears
      cy.get('[data-cy=product-card]').contains('Updated Product Name').should('be.visible')
    })

    it('should cancel edit without saving', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=product-card]').first().find('[data-cy=edit-product-button]').click()
      cy.get('[data-cy=name-input]').clear().type('Should Not Save')
      cy.get('[data-cy=cancel-button]').click()
      
      cy.get('[data-cy=product-modal]').should('not.exist')
      cy.get('[data-cy=product-card]').should('not.contain.text', 'Should Not Save')
    })
  })

  describe('Delete Product', () => {
    it('should delete product with confirmation', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      // Get the first product name for verification
      cy.get('[data-cy=product-card]').first().find('[data-cy=product-name]').invoke('text').then((productName) => {
        cy.get('[data-cy=product-card]').first().find('[data-cy=delete-product-button]').click()
        
        // Confirm deletion
        cy.on('window:confirm', () => true)
        
        cy.shouldShowSuccessToast('Ürün başarıyla silindi')
        
        // Verify product is removed
        cy.get('[data-cy=product-card]').should('not.contain.text', productName)
      })
    })

    it('should cancel deletion', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      const initialCount = cy.get('[data-cy=product-card]').its('length')
      
      cy.get('[data-cy=product-card]').first().find('[data-cy=delete-product-button]').click()
      
      // Cancel deletion
      cy.on('window:confirm', () => false)
      
      // Verify product count unchanged
      cy.get('[data-cy=product-card]').should('have.length', initialCount)
    })
  })

  describe('Product Details', () => {
    it('should display product features', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=product-card]').first().within(() => {
        cy.get('[data-cy=product-features]').should('be.visible')
        cy.get('[data-cy=product-features] li').should('have.length.at.least', 1)
      })
    })

    it('should display stock status with correct styling', () => {
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=product-card]').each(($card) => {
        cy.wrap($card).find('[data-cy=stock-status]').then(($status) => {
          const statusText = $status.text()
          
          if (statusText === 'Stokta') {
            cy.wrap($status).should('have.class', 'text-green-800')
          } else if (statusText === 'Az Stok') {
            cy.wrap($status).should('have.class', 'text-yellow-800')
          } else if (statusText === 'Tükendi') {
            cy.wrap($status).should('have.class', 'text-red-800')
          }
        })
      })
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x')
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=products-grid]').should('be.visible')
      cy.get('[data-cy=add-product-button]').should('be.visible')
    })

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2')
      cy.visit('/katalog')
      cy.waitForPageLoad()
      
      cy.get('[data-cy=products-grid]').should('be.visible')
      cy.get('[data-cy=search-input]').should('be.visible')
    })
  })
})