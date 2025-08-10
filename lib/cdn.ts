// CDN and static file optimization

import { logger } from './monitoring';

interface CDNConfig {
  provider: 'cloudinary' | 'aws' | 'local';
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  cloudName?: string;
  bucket?: string;
  region?: string;
}

interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: string;
  format?: string;
  quality?: number | 'auto';
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop';
}

interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  etag: string;
}

class CDNManager {
  private config: CDNConfig;
  private cloudinary: any = null;

  constructor(config: CDNConfig) {
    this.config = config;
    this.initializeProvider();
  }

  private initializeProvider(): void {
    switch (this.config.provider) {
      case 'cloudinary':
        this.initializeCloudinary();
        break;
      case 'aws':
        this.initializeAWS();
        break;
      case 'local':
        logger.info('Using local file storage');
        break;
    }
  }

  private initializeCloudinary(): void {
    try {
      const cloudinary = require('cloudinary').v2;
      
      cloudinary.config({
        cloud_name: this.config.cloudName,
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        secure: true
      });

      this.cloudinary = cloudinary;
      logger.info('Cloudinary initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Cloudinary', error);
    }
  }

  private initializeAWS(): void {
    // AWS S3 initialization would go here
    logger.info('AWS S3 CDN not implemented yet');
  }

  // Upload file to CDN
  async uploadFile(
    file: File | Buffer | string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    switch (this.config.provider) {
      case 'cloudinary':
        return this.uploadToCloudinary(file, options);
      case 'aws':
        return this.uploadToAWS(file, options);
      case 'local':
        return this.uploadToLocal(file, options);
      default:
        throw new Error(`Unsupported CDN provider: ${this.config.provider}`);
    }
  }

  // Upload to Cloudinary
  private async uploadToCloudinary(
    file: File | Buffer | string,
    options: UploadOptions
  ): Promise<UploadResult> {
    if (!this.cloudinary) {
      throw new Error('Cloudinary not initialized');
    }

    try {
      let uploadData: string | Buffer;

      if (file instanceof File) {
        uploadData = Buffer.from(await file.arrayBuffer());
      } else if (typeof file === 'string') {
        uploadData = file; // Assume it's a base64 string or URL
      } else {
        uploadData = file;
      }

      const uploadOptions: any = {
        folder: options.folder || 'sevkiyat',
        public_id: options.publicId,
        transformation: this.buildTransformation(options),
        resource_type: 'auto',
        format: options.format
      };

      const result = await this.cloudinary.uploader.upload(uploadData, uploadOptions);

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        etag: result.etag
      };
    } catch (error) {
      logger.error('Cloudinary upload failed', error);
      throw error;
    }
  }

  // Upload to AWS S3
  private async uploadToAWS(
    file: File | Buffer | string,
    options: UploadOptions
  ): Promise<UploadResult> {
    // AWS S3 upload implementation
    throw new Error('AWS S3 upload not implemented yet');
  }

  // Upload to local storage
  private async uploadToLocal(
    file: File | Buffer | string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const fs = require('fs').promises;
    const path = require('path');
    const crypto = require('crypto');

    try {
      let fileBuffer: Buffer;
      let fileName: string;
      let fileExtension: string;

      if (file instanceof File) {
        fileBuffer = Buffer.from(await file.arrayBuffer());
        fileName = file.name;
        fileExtension = path.extname(file.name);
      } else if (Buffer.isBuffer(file)) {
        fileBuffer = file;
        fileName = options.publicId || crypto.randomUUID();
        fileExtension = options.format ? `.${options.format}` : '.jpg';
      } else {
        throw new Error('Unsupported file type for local upload');
      }

      const publicId = options.publicId || `${Date.now()}-${crypto.randomUUID()}`;
      const folder = options.folder || 'uploads';
      const uploadDir = path.join(process.cwd(), 'public', folder);
      const filePath = path.join(uploadDir, `${publicId}${fileExtension}`);

      // Create directory if it doesn't exist
      await fs.mkdir(uploadDir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, fileBuffer);

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const url = `${baseUrl}/${folder}/${publicId}${fileExtension}`;

      return {
        publicId,
        url,
        secureUrl: url,
        width: 0, // Would need image processing library to get dimensions
        height: 0,
        format: fileExtension.slice(1),
        bytes: fileBuffer.length,
        etag: crypto.createHash('md5').update(fileBuffer).digest('hex')
      };
    } catch (error) {
      logger.error('Local upload failed', error);
      throw error;
    }
  }

  // Build Cloudinary transformation string
  private buildTransformation(options: UploadOptions): string {
    const transformations: string[] = [];

    if (options.width || options.height) {
      let resize = '';
      if (options.width) resize += `w_${options.width}`;
      if (options.height) resize += `,h_${options.height}`;
      if (options.crop) resize += `,c_${options.crop}`;
      transformations.push(resize);
    }

    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }

    if (options.format) {
      transformations.push(`f_${options.format}`);
    }

    return transformations.join('/');
  }

  // Generate optimized image URL
  generateImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: number | 'auto';
      format?: 'auto' | 'webp' | 'jpg' | 'png';
      crop?: 'fill' | 'fit' | 'scale';
    } = {}
  ): string {
    switch (this.config.provider) {
      case 'cloudinary':
        return this.generateCloudinaryUrl(publicId, options);
      case 'aws':
        return this.generateAWSUrl(publicId, options);
      case 'local':
        return this.generateLocalUrl(publicId, options);
      default:
        return publicId;
    }
  }

  private generateCloudinaryUrl(publicId: string, options: any): string {
    if (!this.cloudinary) return publicId;

    return this.cloudinary.url(publicId, {
      width: options.width,
      height: options.height,
      crop: options.crop || 'fill',
      quality: options.quality || 'auto',
      format: options.format || 'auto',
      secure: true
    });
  }

  private generateAWSUrl(publicId: string, options: any): string {
    // AWS CloudFront URL generation
    return `${this.config.baseUrl}/${publicId}`;
  }

  private generateLocalUrl(publicId: string, options: any): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/${publicId}`;
  }

  // Delete file from CDN
  async deleteFile(publicId: string): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case 'cloudinary':
          if (this.cloudinary) {
            await this.cloudinary.uploader.destroy(publicId);
          }
          break;
        case 'aws':
          // AWS S3 delete implementation
          break;
        case 'local':
          await this.deleteLocalFile(publicId);
          break;
      }
      return true;
    } catch (error) {
      logger.error('Failed to delete file from CDN', error, { publicId });
      return false;
    }
  }

  private async deleteLocalFile(publicId: string): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    const glob = require('glob');

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const pattern = path.join(uploadDir, `${publicId}.*`);
    
    const files = glob.sync(pattern);
    for (const file of files) {
      await fs.unlink(file);
    }
  }

  // Get file info
  async getFileInfo(publicId: string): Promise<any> {
    switch (this.config.provider) {
      case 'cloudinary':
        if (this.cloudinary) {
          return await this.cloudinary.api.resource(publicId);
        }
        break;
      case 'aws':
        // AWS S3 head object
        break;
      case 'local':
        return await this.getLocalFileInfo(publicId);
    }
    return null;
  }

  private async getLocalFileInfo(publicId: string): Promise<any> {
    const fs = require('fs').promises;
    const path = require('path');
    const glob = require('glob');

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const pattern = path.join(uploadDir, `${publicId}.*`);
    
    const files = glob.sync(pattern);
    if (files.length > 0) {
      const stats = await fs.stat(files[0]);
      return {
        public_id: publicId,
        bytes: stats.size,
        created_at: stats.birthtime,
        url: this.generateLocalUrl(publicId, {})
      };
    }
    return null;
  }
}

// CDN configuration based on environment
const cdnConfig: CDNConfig = {
  provider: (process.env.CDN_PROVIDER as any) || 'local',
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  baseUrl: process.env.CDN_BASE_URL,
  bucket: process.env.AWS_S3_BUCKET,
  region: process.env.AWS_REGION
};

// Export CDN manager instance
export const cdn = new CDNManager(cdnConfig);

// Helper functions for common use cases
export const imageHelpers = {
  // Upload product image
  uploadProductImage: async (file: File, productId: string): Promise<UploadResult> => {
    return cdn.uploadFile(file, {
      folder: 'products',
      publicId: `product-${productId}-${Date.now()}`,
      width: 800,
      height: 600,
      crop: 'fill',
      quality: 'auto',
      format: 'webp'
    });
  },

  // Generate product image URL with different sizes
  getProductImageUrl: (publicId: string, size: 'thumb' | 'medium' | 'large' = 'medium'): string => {
    const sizes = {
      thumb: { width: 150, height: 150 },
      medium: { width: 400, height: 300 },
      large: { width: 800, height: 600 }
    };

    return cdn.generateImageUrl(publicId, {
      ...sizes[size],
      quality: 'auto',
      format: 'webp',
      crop: 'fill'
    });
  },

  // Generate responsive image URLs
  getResponsiveImageUrls: (publicId: string): Record<string, string> => {
    return {
      '150w': cdn.generateImageUrl(publicId, { width: 150, quality: 'auto', format: 'webp' }),
      '300w': cdn.generateImageUrl(publicId, { width: 300, quality: 'auto', format: 'webp' }),
      '600w': cdn.generateImageUrl(publicId, { width: 600, quality: 'auto', format: 'webp' }),
      '1200w': cdn.generateImageUrl(publicId, { width: 1200, quality: 'auto', format: 'webp' })
    };
  }
};

export type { CDNConfig, UploadOptions, UploadResult };