// Database backup and recovery utilities

import { logger } from './monitoring'

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

interface BackupConfig {
  schedule: string // cron format
  retention: number // days
  destination: 'local' | 's3' | 'gcs'
  encryption: boolean
}

interface BackupMetadata {
  id: string
  timestamp: Date
  size: number
  tables: string[]
  checksum: string
  encrypted: boolean
}

export class BackupManager {
  private config: BackupConfig

  constructor(config: BackupConfig) {
    this.config = config
  }

  async createBackup(): Promise<BackupMetadata> {
    const startTime = Date.now()
    logger.info('Starting database backup')

    try {
      // Get all table names
      const tables = await this.getAllTables()
      
      // Create backup data
      const backupData: Record<string, any[]> = {}
      
      for (const table of tables) {
        const data = await this.exportTable(table)
        backupData[table] = data
      }

      // Generate backup metadata
      const backupId = `backup_${Date.now()}`
      const backupJson = JSON.stringify(backupData, null, 2)
      const size = Buffer.byteLength(backupJson, 'utf8')
      const checksum = this.generateChecksum(backupJson)

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        size,
        tables,
        checksum,
        encrypted: this.config.encryption
      }

      // Save backup
      await this.saveBackup(backupId, backupJson, metadata)

      const duration = Date.now() - startTime
      logger.info(`Backup completed successfully`, {
        backupId,
        duration,
        size,
        tables: tables.length
      })

      return metadata
    } catch (error) {
      logger.error('Backup failed', error)
      throw error
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    logger.info(`Starting restore from backup: ${backupId}`)

    try {
      const { data, metadata } = await this.loadBackup(backupId)
      
      // Verify checksum
      const currentChecksum = this.generateChecksum(JSON.stringify(data))
      if (currentChecksum !== metadata.checksum) {
        throw new Error('Backup integrity check failed')
      }

      // Restore data
      await this.restoreData(data)

      logger.info(`Restore completed successfully`, { backupId })
    } catch (error) {
      logger.error('Restore failed', error, { backupId })
      throw error
    }
  }

  private async getAllTables(): Promise<string[]> {
    // Get all table names from database schema
    const tables = [
      'users',
      'customers',
      'products',
      'stock',
      'shipments',
      'shipment_items'
    ]
    return tables
  }

  private async exportTable(tableName: string): Promise<any[]> {
    try {
      const prismaClient = await getPrismaClient()
      
      // Use raw SQL to export data to avoid type issues
      switch (tableName.toLowerCase()) {
        case 'users':
          return await prismaClient.$queryRaw`SELECT * FROM users` as any[]
        case 'customers':
          return await prismaClient.$queryRaw`SELECT * FROM customers` as any[]
        case 'products':
          return await prismaClient.$queryRaw`SELECT * FROM products` as any[]
        case 'stock':
          return await prismaClient.$queryRaw`SELECT * FROM stock` as any[]
        case 'shipments':
          return await prismaClient.$queryRaw`SELECT * FROM shipments` as any[]
        case 'shipment_items':
          return await prismaClient.$queryRaw`SELECT * FROM shipment_items` as any[]
        default:
          logger.warn(`Unknown table: ${tableName}`)
          return []
      }
    } catch (error) {
      logger.error(`Failed to export table: ${tableName}`, error)
      return []
    }
  }

  private async restoreData(data: Record<string, any[]>): Promise<void> {
    const prismaClient = await getPrismaClient()
    
    try {
      // Start transaction
      await prismaClient.$executeRaw`BEGIN`

      // Clear existing data (be careful!)
      await prismaClient.$executeRaw`DELETE FROM shipment_items`
      await prismaClient.$executeRaw`DELETE FROM shipments`
      await prismaClient.$executeRaw`DELETE FROM stock`
      await prismaClient.$executeRaw`DELETE FROM products`
      await prismaClient.$executeRaw`DELETE FROM customers`
      // Don't delete users in production!

      // Restore data in correct order (respecting foreign keys)
      if (data.customers) {
        for (const item of data.customers) {
          await prismaClient.$executeRaw`
            INSERT INTO customers (id, name, email, phone, address, city, "userId", "createdAt", "updatedAt")
            VALUES (${item.id}, ${item.name}, ${item.email}, ${item.phone}, ${item.address}, ${item.city}, ${item.userId}, ${item.createdAt}, ${item.updatedAt})
          `
        }
      }

      if (data.products) {
        for (const item of data.products) {
          await prismaClient.$executeRaw`
            INSERT INTO products (id, name, category, price, image, features, description, "userId", "createdAt", "updatedAt")
            VALUES (${item.id}, ${item.name}, ${item.category}, ${item.price}, ${item.image}, ${JSON.stringify(item.features)}, ${item.description}, ${item.userId}, ${item.createdAt}, ${item.updatedAt})
          `
        }
      }

      if (data.stock) {
        for (const item of data.stock) {
          await prismaClient.$executeRaw`
            INSERT INTO stock (id, "productId", quantity, "minQuantity", "maxQuantity", "createdAt", "updatedAt")
            VALUES (${item.id}, ${item.productId}, ${item.quantity}, ${item.minQuantity}, ${item.maxQuantity}, ${item.createdAt}, ${item.updatedAt})
          `
        }
      }

      if (data.shipments) {
        for (const item of data.shipments) {
          await prismaClient.$executeRaw`
            INSERT INTO shipments (id, "customerId", address, city, status, "totalAmount", "deliveryDate", "userId", "createdAt", "updatedAt")
            VALUES (${item.id}, ${item.customerId}, ${item.address}, ${item.city}, ${item.status}, ${item.totalAmount}, ${item.deliveryDate}, ${item.userId}, ${item.createdAt}, ${item.updatedAt})
          `
        }
      }

      if (data.shipment_items) {
        for (const item of data.shipment_items) {
          await prismaClient.$executeRaw`
            INSERT INTO shipment_items (id, "shipmentId", "productId", quantity, "unitPrice")
            VALUES (${item.id}, ${item.shipmentId}, ${item.productId}, ${item.quantity}, ${item.unitPrice})
          `
        }
      }

      // Commit transaction
      await prismaClient.$executeRaw`COMMIT`
    } catch (error) {
      // Rollback on error
      await prismaClient.$executeRaw`ROLLBACK`
      throw error
    }
  }

  private generateChecksum(data: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  private async saveBackup(
    backupId: string, 
    data: string, 
    metadata: BackupMetadata
  ): Promise<void> {
    // Save to configured destination
    switch (this.config.destination) {
      case 'local':
        await this.saveToLocal(backupId, data, metadata)
        break
      case 's3':
        await this.saveToS3(backupId, data, metadata)
        break
      case 'gcs':
        await this.saveToGCS(backupId, data, metadata)
        break
    }
  }

  private async saveToLocal(
    backupId: string, 
    data: string, 
    metadata: BackupMetadata
  ): Promise<void> {
    const fs = require('fs').promises
    const path = require('path')
    
    const backupDir = path.join(process.cwd(), 'backups')
    await fs.mkdir(backupDir, { recursive: true })
    
    const dataFile = path.join(backupDir, `${backupId}.json`)
    const metaFile = path.join(backupDir, `${backupId}.meta.json`)
    
    await fs.writeFile(dataFile, data)
    await fs.writeFile(metaFile, JSON.stringify(metadata, null, 2))
  }

  private async saveToS3(
    backupId: string, 
    data: string, 
    metadata: BackupMetadata
  ): Promise<void> {
    // Implement S3 upload
    logger.info('S3 backup not implemented yet')
  }

  private async saveToGCS(
    backupId: string, 
    data: string, 
    metadata: BackupMetadata
  ): Promise<void> {
    // Implement Google Cloud Storage upload
    logger.info('GCS backup not implemented yet')
  }

  private async loadBackup(backupId: string): Promise<{
    data: Record<string, any[]>
    metadata: BackupMetadata
  }> {
    // Load from configured source
    switch (this.config.destination) {
      case 'local':
        return await this.loadFromLocal(backupId)
      default:
        throw new Error(`Unsupported backup destination: ${this.config.destination}`)
    }
  }

  private async loadFromLocal(backupId: string): Promise<{
    data: Record<string, any[]>
    metadata: BackupMetadata
  }> {
    const fs = require('fs').promises
    const path = require('path')
    
    const backupDir = path.join(process.cwd(), 'backups')
    const dataFile = path.join(backupDir, `${backupId}.json`)
    const metaFile = path.join(backupDir, `${backupId}.meta.json`)
    
    const dataContent = await fs.readFile(dataFile, 'utf8')
    const metaContent = await fs.readFile(metaFile, 'utf8')
    
    return {
      data: JSON.parse(dataContent),
      metadata: JSON.parse(metaContent)
    }
  }

  async listBackups(): Promise<BackupMetadata[]> {
    // List available backups
    const fs = require('fs').promises
    const path = require('path')
    
    const backupDir = path.join(process.cwd(), 'backups')
    
    try {
      const files = await fs.readdir(backupDir)
      const metaFiles = files.filter((f: string) => f.endsWith('.meta.json'))
      
      const backups: BackupMetadata[] = []
      
      for (const metaFile of metaFiles) {
        const metaPath = path.join(backupDir, metaFile)
        const content = await fs.readFile(metaPath, 'utf8')
        backups.push(JSON.parse(content))
      }
      
      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    } catch (error) {
      logger.error('Failed to list backups', error)
      return []
    }
  }

  async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retention)
    
    const oldBackups = backups.filter(b => new Date(b.timestamp) < cutoffDate)
    
    for (const backup of oldBackups) {
      await this.deleteBackup(backup.id)
      logger.info(`Deleted old backup: ${backup.id}`)
    }
  }

  private async deleteBackup(backupId: string): Promise<void> {
    const fs = require('fs').promises
    const path = require('path')
    
    const backupDir = path.join(process.cwd(), 'backups')
    const dataFile = path.join(backupDir, `${backupId}.json`)
    const metaFile = path.join(backupDir, `${backupId}.meta.json`)
    
    try {
      await fs.unlink(dataFile)
      await fs.unlink(metaFile)
    } catch (error) {
      logger.error(`Failed to delete backup: ${backupId}`, error)
    }
  }
}

// Default backup configuration
export const defaultBackupConfig: BackupConfig = {
  schedule: '0 2 * * *', // Daily at 2 AM
  retention: 30, // 30 days
  destination: 'local',
  encryption: false
}

// Export default instance
export const backupManager = new BackupManager(defaultBackupConfig)