import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a demo user first
  const demoUser = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@example.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm' // password: demo123
    }
  })

  console.log('👤 Created demo user:', demoUser.email)

  // Create sample products for demo user
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Ada Yatak Odası Takımı',
        category: 'Yatak Odası',
        price: 15000,
        description: 'Masif ahşap yatak odası takımı',
        features: ['Masif ahşap', 'Yatak 160*200', 'Fırçalı görünüm'],
        userId: demoUser.id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Sandal Oturma Odası Takımı',
        category: 'Oturma Odası',
        price: 12000,
        description: 'Gerçek deri oturma odası takımı',
        features: ['Gerçek deri', '3+2+1 koltuk', 'Yıkanabilir kumaş'],
        userId: demoUser.id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Klasik Yemek Odası Takımı',
        category: 'Yemek Odası',
        price: 18000,
        description: 'Masif meşe yemek odası takımı',
        features: ['Masif meşe', '6 kişilik masa', 'El işçiliği'],
        userId: demoUser.id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Modern TV Ünitesi',
        category: 'Oturma Odası',
        price: 3500,
        description: 'Modern tasarım TV ünitesi',
        features: ['Ceviz kaplama', 'LED ışık', 'Kapaklı bölme'],
        userId: demoUser.id
      }
    })
  ])

  // Create stock records for products
  await Promise.all(products.map((product, index) => {
    const stockQuantities = [15, 3, 0, 25]
    return prisma.stock.create({
      data: {
        productId: product.id,
        quantity: stockQuantities[index],
        minQuantity: 5,
        maxQuantity: 30
      }
    })
  }))

  // Create sample customers for demo user
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Ahmet Yılmaz',
        email: 'ahmet@example.com',
        phone: '0532 123 4567',
        address: 'Atatürk Cad. No:123',
        city: 'İstanbul',
        userId: demoUser.id
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Fatma Demir',
        email: 'fatma@example.com',
        phone: '0533 987 6543',
        address: 'İnönü Sok. No:45',
        city: 'Ankara',
        userId: demoUser.id
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Mehmet Kaya',
        email: 'mehmet@example.com',
        phone: '0534 555 1234',
        address: 'Cumhuriyet Mah. No:67',
        city: 'İzmir',
        userId: demoUser.id
      }
    })
  ])

  // Create sample shipments for demo user
  const shipment1 = await prisma.shipment.create({
    data: {
      customerId: customers[0].id,
      address: customers[0].address || '',
      city: customers[0].city || '',
      status: 'DELIVERED',
      totalAmount: 27000,
      deliveryDate: new Date('2024-01-15'),
      userId: demoUser.id
    }
  })

  const shipment2 = await prisma.shipment.create({
    data: {
      customerId: customers[1].id,
      address: customers[1].address || '',
      city: customers[1].city || '',
      status: 'PENDING',
      totalAmount: 18000,
      deliveryDate: new Date('2024-02-10'),
      userId: demoUser.id
    }
  })

  // Create shipment items
  await Promise.all([
    prisma.shipmentItem.create({
      data: {
        shipmentId: shipment1.id,
        productId: products[0].id, // Ada Yatak Odası
        quantity: 1,
        unitPrice: 15000
      }
    }),
    prisma.shipmentItem.create({
      data: {
        shipmentId: shipment1.id,
        productId: products[1].id, // Sandal Oturma Odası
        quantity: 1,
        unitPrice: 12000
      }
    }),
    prisma.shipmentItem.create({
      data: {
        shipmentId: shipment2.id,
        productId: products[2].id, // Klasik Yemek Odası
        quantity: 1,
        unitPrice: 18000
      }
    })
  ])

  console.log('✅ Database seeded successfully!')
  console.log(`📦 Created ${products.length} products`)
  console.log(`👥 Created ${customers.length} customers`)
  console.log(`🚚 Created 2 shipments with items`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })