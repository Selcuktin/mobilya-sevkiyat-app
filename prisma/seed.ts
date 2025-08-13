// Use dynamic import for Prisma to avoid build issues
let prisma: any = null

async function getPrismaClient() {
  if (!prisma) {
    try {
      const PrismaModule = await import('@prisma/client')
      const PrismaClient = (PrismaModule as any).PrismaClient || (PrismaModule as any).default?.PrismaClient
      prisma = new PrismaClient()
    } catch (error) {
      console.error('Failed to import Prisma Client:', error)
      throw error
    }
  }
  return prisma
}

async function main() {
  console.log('🌱 Seeding database...')

  const prismaClient = await getPrismaClient()

  // Create a demo user first using raw SQL
  const demoUsers = await prismaClient.$queryRaw`
    INSERT INTO users (id, name, email, password, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Demo User', 'demo@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, email
  ` as any[]

  const demoUser = demoUsers[0]
  console.log('👤 Created demo user:', demoUser.email)

  // Create sample products for demo user using raw SQL
  const productData = [
    {
      name: 'Ada Yatak Odası Takımı',
      category: 'Yatak Odası',
      price: 15000,
      description: 'Masif ahşap yatak odası takımı',
      features: ['Masif ahşap', 'Yatak 160*200', 'Fırçalı görünüm']
    },
    {
      name: 'Sandal Oturma Odası Takımı',
      category: 'Oturma Odası',
      price: 12000,
      description: 'Gerçek deri oturma odası takımı',
      features: ['Gerçek deri', '3+2+1 koltuk', 'Yıkanabilir kumaş']
    },
    {
      name: 'Klasik Yemek Odası Takımı',
      category: 'Yemek Odası',
      price: 18000,
      description: 'Masif meşe yemek odası takımı',
      features: ['Masif meşe', '6 kişilik masa', 'El işçiliği']
    },
    {
      name: 'Modern TV Ünitesi',
      category: 'Oturma Odası',
      price: 3500,
      description: 'Modern tasarım TV ünitesi',
      features: ['Ceviz kaplama', 'LED ışık', 'Kapaklı bölme']
    }
  ]

  const products = []
  for (const product of productData) {
    const createdProducts = await prismaClient.$queryRaw`
      INSERT INTO products (id, name, category, price, description, features, "userId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${product.name}, ${product.category}, ${product.price}, ${product.description}, ${JSON.stringify(product.features)}, ${demoUser.id}, NOW(), NOW())
      RETURNING id, name, category, price
    ` as any[]
    products.push(createdProducts[0])
  }

  // Create stock records for products using raw SQL
  const stockQuantities = [15, 3, 0, 25]
  for (let i = 0; i < products.length; i++) {
    await prismaClient.$executeRaw`
      INSERT INTO stock (id, "productId", quantity, "minQuantity", "maxQuantity", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${products[i].id}, ${stockQuantities[i]}, 5, 30, NOW(), NOW())
    `
  }

  // Create sample customers for demo user using raw SQL
  const customerData = [
    {
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      phone: '0532 123 4567',
      address: 'Atatürk Cad. No:123',
      city: 'İstanbul'
    },
    {
      name: 'Fatma Demir',
      email: 'fatma@example.com',
      phone: '0533 987 6543',
      address: 'İnönü Sok. No:45',
      city: 'Ankara'
    },
    {
      name: 'Mehmet Kaya',
      email: 'mehmet@example.com',
      phone: '0534 555 1234',
      address: 'Cumhuriyet Mah. No:67',
      city: 'İzmir'
    }
  ]

  const customers = []
  for (const customer of customerData) {
    const createdCustomers = await prismaClient.$queryRaw`
      INSERT INTO customers (id, name, email, phone, address, city, "userId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${customer.name}, ${customer.email}, ${customer.phone}, ${customer.address}, ${customer.city}, ${demoUser.id}, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, email, address, city
    ` as any[]
    customers.push(createdCustomers[0])
  }

  // Create sample shipments for demo user using raw SQL
  const shipment1Data = await prismaClient.$queryRaw`
    INSERT INTO shipments (id, "customerId", address, city, status, "totalAmount", "deliveryDate", "userId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${customers[0].id}, ${customers[0].address}, ${customers[0].city}, 'DELIVERED', 27000, '2024-01-15', ${demoUser.id}, NOW(), NOW())
    RETURNING id
  ` as any[]

  const shipment2Data = await prismaClient.$queryRaw`
    INSERT INTO shipments (id, "customerId", address, city, status, "totalAmount", "deliveryDate", "userId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${customers[1].id}, ${customers[1].address}, ${customers[1].city}, 'PENDING', 18000, '2024-02-10', ${demoUser.id}, NOW(), NOW())
    RETURNING id
  ` as any[]

  const shipment1 = shipment1Data[0]
  const shipment2 = shipment2Data[0]

  // Create shipment items using raw SQL
  await prismaClient.$executeRaw`
    INSERT INTO shipment_items (id, "shipmentId", "productId", quantity, "unitPrice")
    VALUES (gen_random_uuid(), ${shipment1.id}, ${products[0].id}, 1, 15000)
  `

  await prismaClient.$executeRaw`
    INSERT INTO shipment_items (id, "shipmentId", "productId", quantity, "unitPrice")
    VALUES (gen_random_uuid(), ${shipment1.id}, ${products[1].id}, 1, 12000)
  `

  await prismaClient.$executeRaw`
    INSERT INTO shipment_items (id, "shipmentId", "productId", quantity, "unitPrice")
    VALUES (gen_random_uuid(), ${shipment2.id}, ${products[2].id}, 1, 18000)
  `

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
    if (prisma) {
      await prisma.$disconnect()
    }
  })