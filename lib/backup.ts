// Database backup and recovery utilities

import { PrismaClient } from '@prisma/client'
import { logger } from './monitoring'

const prisma = new PrismaClient()

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
    // Get all table names from Prisma schema
    const tables = [
      'User',
      'Customer',
      'Product',
      'Stock',
      'Shipment',
      'ShipmentItem',
      'Notification'
    ]
    return tables
  }

  private async exportTable(tableName: string): Promise<any[]> {
    try {
      // Use Prisma to export data
      switch (tableName.toLowerCase()) {
        case 'user':
          return await prisma.user.findMany()
        case 'customer':
          return await prisma.customer.findMany()
        case 'product':
          return await prisma.product.findMany()
        case 'stock':
          return await prisma.stock.findMany()
        case 'shipment':
          return await prisma.shipment.findMany()
        case 'shipmentitem':
          return await prisma.shipmentItem.findMany()
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
    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing data (be careful!)
      await tx.shipmentItem.deleteMany()
      await tx.shipment.deleteMany()
      await tx.stock.deleteMany()
      await tx.product.deleteMany()
      await tx.customer.deleteMany()
      // Don't delete users in production!

      // Restore data in correct order (respecting foreign keys)
      if (data.customer) {
        for (const item of data.customer) {
          await tx.customer.create({ data: item })
        }
      }

      if (data.product) {
        for (const item of data.product) {
          await tx.product.create({ data: item })
        }
      }

      if (data.stock) {
        for (const item of data.stock) {
          await tx.stock.create({ data: item })
        }
      }

      if (data.shipment) {
        for (const item of data.shipment) {
          await tx.shipment.create({ data: item })
        }
      }

      if (data.shipmentitem) {
        for (const item of data.shipmentitem) {
          await tx.shipmentItem.create({ data: item })
        }
      }
    })
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