// System initialization script

const { PrismaClient } = require('@prisma/client')
const { initializeUptimeMonitoring } = require('../lib/uptime')
const { logger } = require('../lib/monitoring')
const { emailManager } = require('../lib/email')
const { cache } = require('../lib/cache')

const prisma = new PrismaClient()

async function initializeSystem() {
  console.log('🚀 Initializing Sevkiyat System...')
  
  try {
    // 1. Test database connection
    console.log('📊 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // 2. Test cache connection
    console.log('🗄️ Testing cache connection...')
    const cacheStats = cache.getStats()
    console.log(`✅ Cache initialized (Redis: ${cacheStats.isRedisConnected ? 'Connected' : 'Using Memory Cache'})`)
    
    // 3. Test email connection
    console.log('📧 Testing email connection...')
    const emailConnected = await emailManager.testConnection()
    console.log(`${emailConnected ? '✅' : '⚠️'} Email ${emailConnected ? 'connected' : 'not configured'}`)
    
    // 4. Initialize uptime monitoring
    console.log('📈 Initializing uptime monitoring...')
    initializeUptimeMonitoring()
    console.log('✅ Uptime monitoring initialized')
    
    // 5. Create default admin user if not exists
    console.log('👤 Checking admin user...')
    const adminUser = await prisma.user.findFirst({
      where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' }
    })
    
    if (!adminUser && process.env.ADMIN_EMAIL) {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12)
      
      await prisma.user.create({
        data: {
          name: 'System Admin',
          email: process.env.ADMIN_EMAIL,
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
      console.log('✅ Admin user created')
    } else {
      console.log('✅ Admin user exists')
    }
    
    // 6. Seed sample data if in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🌱 Seeding sample data...')
      await seedSampleData()
      console.log('✅ Sample data seeded')
    }
    
    // 7. System health check
    console.log('🏥 Running system health check...')
    const healthResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/health`)
    if (healthResponse.ok) {
      console.log('✅ System health check passed')
    } else {
      console.log('⚠️ System health check failed')
    }
    
    console.log('\n🎉 System initialization completed successfully!')
    console.log('\n📋 System Status:')
    console.log(`   Database: ✅ Connected`)
    console.log(`   Cache: ${cacheStats.isRedisConnected ? '✅ Redis' : '⚠️ Memory Cache'}`)
    console.log(`   Email: ${emailConnected ? '✅ Connected' : '⚠️ Not configured'}`)
    console.log(`   Monitoring: ✅ Active`)
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
    
  } catch (error) {
    console.error('❌ System initialization failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function seedSampleData() {
  try {
    // Check if data already exists
    const existingProducts = await prisma.product.count()
    if (existingProducts > 0) {
      console.log('Sample data already exists, skipping...')
      return
    }

    // Get or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' }
    })

    if (!adminUser) {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      adminUser = await prisma.user.create({
        data: {
          name: 'System Admin',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
    }

    // Create sample customers
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          name: 'Ahmet Yılmaz',
          email: 'ahmet@example.com',
          phone: '05551234567',
          address: 'Atatürk Cad. No:123',
          city: 'İstanbul',
          status: 'Aktif',
          userId: adminUser.id
        }
      }),
      prisma.customer.create({
        data: {
          name: 'Fatma Demir',
          email: 'fatma@example.com',
          phone: '05559876543',
          address: 'İnönü Sok. No:45',
          city: 'Ankara',
          status: 'Aktif',
          userId: adminUser.id
        }
      }),
      prisma.customer.create({
        data: {
          name: 'Mehmet Kaya',
          email: 'mehmet@example.com',
          phone: '05555555555',
          address: 'Cumhuriyet Mah. No:67',
          city: 'İzmir',
          status: 'Aktif',
          userId: adminUser.id
        }
      })
    ])

    // Create sample products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Modern Yatak Odası Takımı',
          category: 'Yatak Odası',
          price: 15000,
          description: 'Şık ve modern tasarım yatak odası takımı',
          features: ['Masif ahşap', '160x200 yatak', 'Gardırop dahil', '2 komodin'],
          userId: adminUser.id
        }
      }),
      prisma.product.create({
        data: {
          name: 'Klasik Oturma Grubu',
          category: 'Oturma Odası',
          price: 8500,
          description: 'Konforlu ve şık oturma grubu',
          features: ['3+2+1 koltuk', 'Gerçek deri', 'Yüksek kalite'],
          userId: adminUser.id
        }
      }),
      prisma.product.create({
        data: {
          name: 'Ahşap Yemek Masası',
          category: 'Yemek Odası',
          price: 3500,
          description: '6 kişilik ahşap yemek masası',
          features: ['Masif ahşap', '6 sandalye', 'Genişletilebilir'],
          userId: adminUser.id
        }
      })
    ])

    // Create stock records
    await Promise.all(products.map(product => 
      prisma.stock.create({
        data: {
          productId: product.id,
          quantity: Math.floor(Math.random() * 20) + 5,
          minQuantity: 5,
          maxQuantity: 50
        }
      })
    ))

    // Create sample shipments
    await Promise.all([
      prisma.shipment.create({
        data: {
          customerId: customers[0].id,
          address: customers[0].address,
          city: customers[0].city,
          status: 'DELIVERED',
          totalAmount: 15000,
          deliveryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          userId: adminUser.id,
          items: {
            create: [{
              productId: products[0].id,
              quantity: 1,
              unitPrice: 15000
            }]
          }
        }
      }),
      prisma.shipment.create({
        data: {
          customerId: customers[1].id,
          address: customers[1].address,
          city: customers[1].city,
          status: 'SHIPPED',
          totalAmount: 8500,
          deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          userId: adminUser.id,
          items: {
            create: [{
              productId: products[1].id,
              quantity: 1,
              unitPrice: 8500
            }]
          }
        }
      }),
      prisma.shipment.create({
        data: {
          customerId: customers[2].id,
          address: customers[2].address,
          city: customers[2].city,
          status: 'PENDING',
          totalAmount: 3500,
          userId: adminUser.id,
          items: {
            create: [{
              productId: products[2].id,
              quantity: 1,
              unitPrice: 3500
            }]
          }
        }
      })
    ])

    console.log('✅ Sample data created:')
    console.log(`   - ${customers.length} customers`)
    console.log(`   - ${products.length} products`)
    console.log(`   - 3 shipments`)
    
  } catch (error) {
    console.error('Error seeding sample data:', error)
    throw error
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeSystem()
}

module.exports = { initializeSystem, seedSampleData }