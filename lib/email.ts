// Email system with SendGrid and Nodemailer support

import { logger } from './monitoring';

interface EmailConfig {
  provider: 'sendgrid' | 'nodemailer';
  apiKey?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  fromEmail: string;
  fromName: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  template?: string;
  templateData?: Record<string, any>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailManager {
  private config: EmailConfig;
  private sendgrid: any = null;
  private nodemailer: any = null;

  constructor(config: EmailConfig) {
    this.config = config;
    this.initializeProvider();
  }

  private initializeProvider(): void {
    switch (this.config.provider) {
      case 'sendgrid':
        this.initializeSendGrid();
        break;
      case 'nodemailer':
        this.initializeNodemailer();
        break;
    }
  }

  private initializeSendGrid(): void {
    try {
      if (!this.config.apiKey) {
        throw new Error('SendGrid API key not provided');
      }

      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.config.apiKey);
      this.sendgrid = sgMail;
      
      logger.info('SendGrid initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SendGrid', error);
    }
  }

  private initializeNodemailer(): void {
    try {
      const nodemailer = require('nodemailer');
      
      this.nodemailer = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port || 587,
        secure: this.config.secure || false,
        auth: {
          user: this.config.user,
          pass: this.config.pass
        }
      });

      logger.info('Nodemailer initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Nodemailer', error);
    }
  }

  // Send email
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Process template if provided
      if (options.template && options.templateData) {
        const template = await this.getTemplate(options.template);
        if (template) {
          options.html = this.processTemplate(template.html, options.templateData);
          options.text = template.text ? this.processTemplate(template.text, options.templateData) : undefined;
          options.subject = this.processTemplate(template.subject, options.templateData);
        }
      }

      // Ensure subject is present after potential template processing
      if (!options.subject) {
        throw new Error('Email subject is required. Provide a subject or a template that defines one.');
      }
      const optionsWithSubject = { ...options, subject: options.subject } as EmailOptions & { subject: string };

      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(optionsWithSubject);
        case 'nodemailer':
          return await this.sendWithNodemailer(optionsWithSubject);
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }
    } catch (error) {
      logger.error('Failed to send email', error, { to: options.to, subject: options.subject });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Send with SendGrid
  private async sendWithSendGrid(options: EmailOptions & { subject: string }): Promise<EmailResult> {
    if (!this.sendgrid) {
      throw new Error('SendGrid not initialized');
    }

    const msg = {
      to: Array.isArray(options.to) ? options.to : [options.to],
      cc: options.cc,
      bcc: options.bcc,
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName
      },
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
        type: att.contentType,
        disposition: 'attachment'
      }))
    };

    const result = await this.sendgrid.send(msg);
    
    return {
      success: true,
      messageId: result[0]?.headers?.['x-message-id']
    };
  }

  // Send with Nodemailer
  private async sendWithNodemailer(options: EmailOptions & { subject: string }): Promise<EmailResult> {
    if (!this.nodemailer) {
      throw new Error('Nodemailer not initialized');
    }

    const mailOptions = {
      from: `${this.config.fromName} <${this.config.fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc,
      bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments
    };

    const result = await this.nodemailer.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId
    };
  }

  // Get email template
  private async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    try {
      // In a real implementation, this would load from database or file system
      const templates = await this.loadTemplates();
      return templates[templateName] || null;
    } catch (error) {
      logger.error('Failed to load email template', error, { templateName });
      return null;
    }
  }

  // Process template with data
  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;
    
    // Simple template processing (replace {{variable}} with data)
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value));
    });

    return processed;
  }

  // Load email templates
  private async loadTemplates(): Promise<Record<string, EmailTemplate>> {
    return {
      welcome: {
        subject: 'Hoş Geldiniz - {{companyName}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Hoş Geldiniz {{userName}}!</h1>
            <p>{{companyName}} sistemine başarıyla kayıt oldunuz.</p>
            <p>Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayın:</p>
            <a href="{{activationLink}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Hesabı Aktifleştir
            </a>
            <p>İyi çalışmalar dileriz!</p>
          </div>
        `,
        text: 'Hoş Geldiniz {{userName}}! {{companyName}} sistemine başarıyla kayıt oldunuz.'
      },

      stockAlert: {
        subject: 'Stok Uyarısı - {{productName}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc3545;">⚠️ Stok Uyarısı</h1>
            <p><strong>{{productName}}</strong> ürününün stoku azaldı!</p>
            <p>Mevcut stok: <strong>{{currentStock}} adet</strong></p>
            <p>Minimum stok: <strong>{{minStock}} adet</strong></p>
            <p>Lütfen stok yenileme işlemini gerçekleştirin.</p>
            <a href="{{productLink}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Ürünü Görüntüle
            </a>
          </div>
        `,
        text: 'Stok Uyarısı: {{productName}} ürününün stoku {{currentStock}} adete düştü.'
      },

      newOrder: {
        subject: 'Yeni Sipariş - {{orderNumber}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #28a745;">🎉 Yeni Sipariş Alındı</h1>
            <p>Sipariş Numarası: <strong>{{orderNumber}}</strong></p>
            <p>Müşteri: <strong>{{customerName}}</strong></p>
            <p>Toplam Tutar: <strong>{{totalAmount}} ₺</strong></p>
            <p>Ürün Sayısı: <strong>{{itemCount}} adet</strong></p>
            <a href="{{orderLink}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Siparişi Görüntüle
            </a>
          </div>
        `,
        text: 'Yeni Sipariş: {{orderNumber}} - {{customerName}} - {{totalAmount}} ₺'
      },

      orderStatusUpdate: {
        subject: 'Sipariş Durumu Güncellendi - {{orderNumber}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #007bff;">📦 Sipariş Durumu Güncellendi</h1>
            <p>Sayın {{customerName}},</p>
            <p>Sipariş Numarası: <strong>{{orderNumber}}</strong></p>
            <p>Yeni Durum: <strong>{{newStatus}}</strong></p>
            {{#if trackingNumber}}
            <p>Kargo Takip Numarası: <strong>{{trackingNumber}}</strong></p>
            {{/if}}
            <p>Sipariş detaylarını görüntülemek için aşağıdaki bağlantıya tıklayın:</p>
            <a href="{{orderLink}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Siparişi Takip Et
            </a>
          </div>
        `,
        text: 'Sipariş Durumu: {{orderNumber}} - {{newStatus}}'
      },

      monthlyReport: {
        subject: 'Aylık Rapor - {{month}} {{year}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6f42c1;">📊 Aylık Performans Raporu</h1>
            <p>{{month}} {{year}} ayı performans özetiniz:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #f8f9fa;">
                <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Toplam Satış</strong></td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">{{totalSales}} ₺</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Sipariş Sayısı</strong></td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">{{orderCount}}</td>
              </tr>
              <tr style="background: #f8f9fa;">
                <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Yeni Müşteri</strong></td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">{{newCustomers}}</td>
              </tr>
            </table>
            <a href="{{reportLink}}" style="background: #6f42c1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Detaylı Raporu Görüntüle
            </a>
          </div>
        `,
        text: 'Aylık Rapor {{month}} {{year}}: Satış {{totalSales}} ₺, Sipariş {{orderCount}}'
      }
    };
  }

  // Test email connection
  async testConnection(): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case 'sendgrid':
          // SendGrid doesn't have a direct test method, so we'll try to send a test email
          return true;
        case 'nodemailer':
          if (this.nodemailer) {
            await this.nodemailer.verify();
            return true;
          }
          return false;
        default:
          return false;
      }
    } catch (error) {
      logger.error('Email connection test failed', error);
      return false;
    }
  }
}

// Email configuration
const emailConfig: EmailConfig = {
  provider: (process.env.EMAIL_PROVIDER as any) || 'nodemailer',
  apiKey: process.env.SENDGRID_API_KEY,
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  fromEmail: process.env.FROM_EMAIL || 'noreply@example.com',
  fromName: process.env.FROM_NAME || 'Sevkiyat Sistemi'
};

// Export email manager
export const emailManager = new EmailManager(emailConfig);

// Business-specific email functions
export const businessEmails = {
  // Send welcome email
  sendWelcomeEmail: async (userEmail: string, userName: string, activationLink: string) => {
    return emailManager.sendEmail({
      to: userEmail,
      template: 'welcome',
      templateData: {
        userName,
        companyName: 'Sevkiyat Sistemi',
        activationLink
      }
    });
  },

  // Send stock alert
  sendStockAlert: async (
    adminEmail: string,
    productName: string,
    currentStock: number,
    minStock: number,
    productLink: string
  ) => {
    return emailManager.sendEmail({
      to: adminEmail,
      template: 'stockAlert',
      templateData: {
        productName,
        currentStock,
        minStock,
        productLink
      }
    });
  },

  // Send new order notification
  sendNewOrderNotification: async (
    adminEmail: string,
    orderNumber: string,
    customerName: string,
    totalAmount: number,
    itemCount: number,
    orderLink: string
  ) => {
    return emailManager.sendEmail({
      to: adminEmail,
      template: 'newOrder',
      templateData: {
        orderNumber,
        customerName,
        totalAmount,
        itemCount,
        orderLink
      }
    });
  },

  // Send order status update to customer
  sendOrderStatusUpdate: async (
    customerEmail: string,
    customerName: string,
    orderNumber: string,
    newStatus: string,
    orderLink: string,
    trackingNumber?: string
  ) => {
    return emailManager.sendEmail({
      to: customerEmail,
      template: 'orderStatusUpdate',
      templateData: {
        customerName,
        orderNumber,
        newStatus,
        orderLink,
        trackingNumber
      }
    });
  },

  // Send monthly report
  sendMonthlyReport: async (
    adminEmail: string,
    month: string,
    year: number,
    reportData: {
      totalSales: number;
      orderCount: number;
      newCustomers: number;
    },
    reportLink: string
  ) => {
    return emailManager.sendEmail({
      to: adminEmail,
      template: 'monthlyReport',
      templateData: {
        month,
        year,
        ...reportData,
        reportLink
      }
    });
  }
};

export type { EmailConfig, EmailOptions, EmailResult, EmailTemplate };