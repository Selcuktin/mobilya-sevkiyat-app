import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserId } from '@/lib/auth'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { startDate, endDate, reportType, format } = body

    // Validation
    if (!startDate || !endDate || !reportType || !format) {
      return NextResponse.json(
        { success: false, error: 'Eksik parametreler' },
        { status: 400 }
      )
    }

    // Date validation
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) {
      return NextResponse.json(
        { success: false, error: 'Başlangıç tarihi bitiş tarihinden sonra olamaz' },
        { status: 400 }
      )
    }

    let reportData: any = {}
    let fileName = ''

    // Generate report based on type
    switch (reportType) {
      case 'sales':
        reportData = await generateSalesReport(userId, start, end)
        fileName = `satis-raporu-${startDate}-${endDate}`
        break
      case 'inventory':
        reportData = await generateInventoryReport(userId)
        fileName = `stok-raporu-${new Date().toISOString().split('T')[0]}`
        break
      case 'shipments':
        reportData = await generateShipmentsReport(userId, start, end)
        fileName = `sevkiyat-raporu-${startDate}-${endDate}`
        break
      case 'customers':
        reportData = await generateCustomersReport(userId)
        fileName = `musteri-raporu-${new Date().toISOString().split('T')[0]}`
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Geçersiz rapor türü' },
          { status: 400 }
        )
    }

    // Generate file based on format
    let fileContent: string | Buffer
    let contentType: string
    let fileExtension: string

    switch (format) {
      case 'csv':
        fileContent = generateCSV(reportData, reportType)
        contentType = 'text/csv'
        fileExtension = 'csv'
        break
      case 'excel':
        fileContent = generateExcel(reportData, reportType)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileExtension = 'xlsx'
        break
      case 'pdf':
        fileContent = generatePDF(reportData, reportType)
        contentType = 'application/pdf'
        fileExtension = 'pdf'
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Geçersiz format' },
          { status: 400 }
        )
    }

    // Return file
    const response = new NextResponse(fileContent)
    response.headers.set('Content-Type', contentType)
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}.${fileExtension}"`)
    
    return response
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Rapor oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

async function generateSalesReport(userId: number, startDate: Date, endDate: Date) {
  const shipments = await prisma.shipment.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return {
    title: 'Satış Raporu',
    period: `${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}`,
    data: shipments.map(shipment => ({
      'Sipariş No': `SHP-${shipment.id.toString().padStart(4, '0')}`,
      'Müşteri': shipment.customer.name,
      'Telefon': shipment.customer.phone,
      'Şehir': shipment.city || 'Belirtilmemiş',
      'Durum': getStatusText(shipment.status),
      'Toplam Tutar': shipment.totalAmount,
      'Ürün Sayısı': shipment.items.length,
      'Tarih': shipment.createdAt.toLocaleDateString('tr-TR')
    })),
    summary: {
      totalSales: shipments.reduce((sum, s) => sum + s.totalAmount, 0),
      totalShipments: shipments.length,
      averageOrder: shipments.length > 0 ? shipments.reduce((sum, s) => sum + s.totalAmount, 0) / shipments.length : 0
    }
  }
}

async function generateInventoryReport(userId: number) {
  const products = await prisma.product.findMany({
    where: { userId: userId },
    include: {
      stock: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return {
    title: 'Stok Raporu',
    period: new Date().toLocaleDateString('tr-TR'),
    data: products.map(product => ({
      'Ürün Adı': product.name,
      'Kategori': product.category,
      'Fiyat': product.price,
      'Mevcut Stok': product.stock?.[0]?.quantity || 0,
      'Minimum Stok': product.stock?.[0]?.minStock || 0,
      'Durum': getStockStatus(product.stock?.[0]?.quantity || 0, product.stock?.[0]?.minStock || 0)
    })),
    summary: {
      totalProducts: products.length,
      lowStockProducts: products.filter(p => (p.stock?.[0]?.quantity || 0) <= (p.stock?.[0]?.minStock || 0)).length,
      totalValue: products.reduce((sum, p) => sum + (p.price * (p.stock?.[0]?.quantity || 0)), 0)
    }
  }
}

async function generateShipmentsReport(userId: number, startDate: Date, endDate: Date) {
  const shipments = await prisma.shipment.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return {
    title: 'Sevkiyat Raporu',
    period: `${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}`,
    data: shipments.map(shipment => ({
      'Sevkiyat No': `SHP-${shipment.id.toString().padStart(4, '0')}`,
      'Müşteri': shipment.customer.name,
      'Adres': `${shipment.address}, ${shipment.city}`,
      'Durum': getStatusText(shipment.status),
      'Ürünler': shipment.items.map(item => `${item.product.name} (${item.quantity})`).join(', '),
      'Toplam Tutar': shipment.totalAmount,
      'Oluşturma Tarihi': shipment.createdAt.toLocaleDateString('tr-TR'),
      'Teslimat Tarihi': shipment.deliveryDate?.toLocaleDateString('tr-TR') || 'Belirtilmemiş'
    })),
    summary: {
      totalShipments: shipments.length,
      pendingShipments: shipments.filter(s => s.status === 'PENDING').length,
      deliveredShipments: shipments.filter(s => s.status === 'DELIVERED').length,
      totalValue: shipments.reduce((sum, s) => sum + s.totalAmount, 0)
    }
  }
}

async function generateCustomersReport(userId: number) {
  const customers = await prisma.customer.findMany({
    where: { userId: userId },
    include: {
      shipments: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return {
    title: 'Müşteri Raporu',
    period: new Date().toLocaleDateString('tr-TR'),
    data: customers.map(customer => ({
      'Müşteri Adı': customer.name,
      'E-posta': customer.email,
      'Telefon': customer.phone,
      'Şehir': customer.city || 'Belirtilmemiş',
      'Durum': customer.status,
      'Toplam Sipariş': customer.shipments.length,
      'Toplam Harcama': customer.shipments.reduce((sum, s) => sum + s.totalAmount, 0),
      'Son Sipariş': customer.shipments.length > 0 
        ? Math.max(...customer.shipments.map(s => new Date(s.createdAt).getTime()))
        : 'Hiç sipariş yok'
    })),
    summary: {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'Aktif').length,
      totalOrders: customers.reduce((sum, c) => sum + c.shipments.length, 0),
      totalRevenue: customers.reduce((sum, c) => sum + c.shipments.reduce((s, sh) => s + sh.totalAmount, 0), 0)
    }
  }
}

function generateExcel(reportData: any, reportType: string): Buffer {
  if (!reportData.data || reportData.data.length === 0) {
    // Create empty workbook with error message
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([['Veri bulunamadı']])
    XLSX.utils.book_append_sheet(wb, ws, 'Rapor')
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
  }

  const wb = XLSX.utils.book_new()
  
  // Ana veri sayfası
  const headers = Object.keys(reportData.data[0])
  const wsData = [
    [reportData.title],
    [`Dönem: ${reportData.period}`],
    [], // Boş satır
    headers, // Başlıklar
    ...reportData.data.map((row: any) => 
      headers.map(header => row[header])
    )
  ]
  
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  
  // Başlık stilini ayarla
  ws['A1'] = { v: reportData.title, t: 's', s: { font: { bold: true, sz: 16 } } }
  ws['A2'] = { v: `Dönem: ${reportData.period}`, t: 's', s: { font: { italic: true } } }
  
  // Başlık satırını kalın yap
  const headerRowIndex = 4 // 0-indexed, 4. satır başlıklar
  headers.forEach((header, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex - 1, c: colIndex })
    if (!ws[cellAddress]) ws[cellAddress] = {}
    ws[cellAddress].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E9ECEF' } } }
  })
  
  // Sütun genişliklerini ayarla
  const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }))
  ws['!cols'] = colWidths
  
  XLSX.utils.book_append_sheet(wb, ws, 'Rapor Verileri')
  
  // Özet sayfası
  const summaryData = [
    ['RAPOR ÖZETİ'],
    [`Rapor Türü: ${reportData.title}`],
    [`Dönem: ${reportData.period}`],
    [], // Boş satır
    ['Metrik', 'Değer'],
    ...Object.entries(reportData.summary).map(([key, value]) => [key, value])
  ]
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  
  // Özet sayfası stilini ayarla
  wsSummary['A1'] = { v: 'RAPOR ÖZETİ', t: 's', s: { font: { bold: true, sz: 14 } } }
  wsSummary['A5'] = { v: 'Metrik', t: 's', s: { font: { bold: true } } }
  wsSummary['B5'] = { v: 'Değer', t: 's', s: { font: { bold: true } } }
  
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }]
  
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet')
  
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

function generateCSV(reportData: any, reportType: string): string {
  if (!reportData.data || reportData.data.length === 0) {
    return 'Veri bulunamadı'
  }

  const headers = Object.keys(reportData.data[0])
  const csvContent = [
    `"${reportData.title}"`,
    `"Dönem: ${reportData.period}"`,
    '',
    headers.map(h => `"${h}"`).join(','),
    ...reportData.data.map((row: any) => 
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'number') {
          return value.toString()
        }
        return `"${value || ''}"`
      }).join(',')
    ),
    '',
    'ÖZET',
    ...Object.entries(reportData.summary).map(([key, value]) => 
      `"${key}","${value}"`
    )
  ].join('\n')

  return csvContent
}

function generatePDF(reportData: any, reportType: string): string {
  // Simple HTML-based PDF content (in real app, use a PDF library like puppeteer or jsPDF)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${reportData.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .period { color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .summary { background-color: #e9ecef; padding: 15px; margin-top: 20px; }
        .summary h3 { margin-top: 0; }
      </style>
    </head>
    <body>
      <h1>${reportData.title}</h1>
      <div class="period">Dönem: ${reportData.period}</div>
      
      <table>
        <thead>
          <tr>
            ${Object.keys(reportData.data[0] || {}).map(key => `<th>${key}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${reportData.data.map((row: any) => `
            <tr>
              ${Object.values(row).map(value => `<td>${value || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <h3>Özet</h3>
        ${Object.entries(reportData.summary).map(([key, value]) => `
          <p><strong>${key}:</strong> ${value}</p>
        `).join('')}
      </div>
    </body>
    </html>
  `
  
  return htmlContent
}

function getStatusText(status: string): string {
  switch (status) {
    case 'PENDING': return 'Hazırlanıyor'
    case 'SHIPPED': return 'Yolda'
    case 'DELIVERED': return 'Teslim Edildi'
    case 'CANCELLED': return 'İptal'
    default: return status
  }
}

function getStockStatus(currentStock: number, minStock: number): string {
  if (currentStock === 0) return 'Tükendi'
  if (currentStock <= minStock) return 'Az Stok'
  if (currentStock > minStock * 3) return 'Fazla Stok'
  return 'Normal'
}