import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import * as React from 'react';
import {
  WelcomeEmail,
  EmailVerification,
  PasswordResetEmail,
  NotificationEmail,
  renderEmail,
  renderEmailText,
  type WelcomeEmailProps,
  type EmailVerificationProps,
  type PasswordResetEmailProps,
  type NotificationEmailProps,
} from '@repo/emails';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * Email Service following Service-Adapter pattern
 * Handles all email sending operations using Resend
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly defaultFrom: string;
  private readonly isDevelopment: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured. Email sending will be mocked.');
    }

    this.resend = new Resend(apiKey);
    this.defaultFrom = process.env.EMAIL_FROM || 'noreply@example.com';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Send a generic email with HTML and text content
   */
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      // In development, log instead of sending
      if (this.isDevelopment && !process.env.RESEND_API_KEY) {
        this.logger.log(`[MOCK] Email would be sent to: ${options.to}`);
        this.logger.log(`[MOCK] Subject: ${options.subject}`);
        this.logger.log(`[MOCK] HTML length: ${options.html.length} chars`);
        return {
          id: `mock-${Date.now()}`,
          success: true,
        };
      }

      const result = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        tags: options.tags,
      });

      if (result.error) {
        this.logger.error(`Failed to send email: ${result.error.message}`);
        return {
          id: '',
          success: false,
          error: result.error.message,
        };
      }

      this.logger.log(`Email sent successfully: ${result.data?.id}`);
      return {
        id: result.data?.id || '',
        success: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Email sending failed: ${message}`);
      return {
        id: '',
        success: false,
        error: message,
      };
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(
    to: string,
    props: WelcomeEmailProps,
  ): Promise<SendEmailResult> {
    const component = React.createElement(WelcomeEmail, props);
    const html = await renderEmail(component);
    const text = await renderEmailText(component);

    return this.sendEmail({
      to,
      subject: 'Welcome to our platform!',
      html,
      text,
      tags: [{ name: 'category', value: 'welcome' }],
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(
    to: string,
    props: EmailVerificationProps,
  ): Promise<SendEmailResult> {
    const component = React.createElement(EmailVerification, props);
    const html = await renderEmail(component);
    const text = await renderEmailText(component);

    return this.sendEmail({
      to,
      subject: 'Verify your email address',
      html,
      text,
      tags: [{ name: 'category', value: 'verification' }],
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    props: PasswordResetEmailProps,
  ): Promise<SendEmailResult> {
    const component = React.createElement(PasswordResetEmail, props);
    const html = await renderEmail(component);
    const text = await renderEmailText(component);

    return this.sendEmail({
      to,
      subject: 'Reset your password',
      html,
      text,
      tags: [{ name: 'category', value: 'password-reset' }],
    });
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(
    to: string,
    props: NotificationEmailProps,
  ): Promise<SendEmailResult> {
    const component = React.createElement(NotificationEmail, props);
    const html = await renderEmail(component);
    const text = await renderEmailText(component);

    return this.sendEmail({
      to,
      subject: props.title,
      html,
      text,
      tags: [{ name: 'category', value: 'notification' }],
    });
  }

  /**
   * Send bulk emails (for newsletters, announcements, etc.)
   */
  async sendBulkEmails(
    recipients: string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<SendEmailResult[]> {
    const results: SendEmailResult[] = [];

    // Send in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((to) =>
          this.sendEmail({
            to,
            subject,
            html,
            text,
            tags: [{ name: 'category', value: 'bulk' }],
          }),
        ),
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Test email configuration
   */
  async testEmail(to: string): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: 'Test Email',
      html: '<h1>Test Email</h1><p>If you receive this, your email configuration is working correctly.</p>',
      text: 'Test Email - If you receive this, your email configuration is working correctly.',
      tags: [{ name: 'category', value: 'test' }],
    });
  }
}
