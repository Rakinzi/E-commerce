import nodemailer from 'nodemailer';
import { env } from './env.js';
import logger from '../utils/logger.js';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Create transporter based on environment
const createTransporter = () => {
  // Always use configured SMTP settings (including development)
  return nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_SECURE || false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
};

export const transporter = createTransporter();

// Test email connection
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    logger.info('Email service connection verified successfully');
    return true;
  } catch (error) {
    logger.error('Email service connection failed:', error);
    return false;
  }
};

// Email templates
export const EMAIL_TEMPLATES = {
  VERIFY_EMAIL: {
    subject: 'Verify Your Email - Commerce',
    getHtml: (otp: string, name: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background-color: #000; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; }
            .content { padding: 40px 30px; }
            .otp-box { background-color: #f8f9fa; border: 2px solid #000; padding: 20px; text-align: center; margin: 30px 0; border-radius: 0; }
            .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #000; margin: 10px 0; font-family: 'Courier New', monospace; }
            .button { display: inline-block; background-color: #000; color: white; padding: 15px 30px; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
            .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>COMMERCE</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Welcome to Commerce! Please verify your email address to complete your account setup.</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p>Enter this code on the verification page to activate your account.</p>
              
              <div class="warning">
                <strong>Important:</strong> This code expires in 15 minutes. If you didn't request this verification, please ignore this email.
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2024 Commerce. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  FORGOT_PASSWORD: {
    subject: 'Reset Your Password - Commerce',
    getHtml: (otp: string, name: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background-color: #000; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; }
            .content { padding: 40px 30px; }
            .otp-box { background-color: #f8f9fa; border: 2px solid #dc3545; padding: 20px; text-align: center; margin: 30px 0; border-radius: 0; }
            .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #dc3545; margin: 10px 0; font-family: 'Courier New', monospace; }
            .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
            .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
            .security-note { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>COMMERCE</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We received a request to reset your password. Use the code below to proceed with resetting your password.</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Password Reset Code</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="security-note">
                <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email and consider changing your password for security.
              </div>
              
              <div class="warning">
                <strong>Important:</strong> This code expires in 15 minutes and can only be used once.
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2024 Commerce. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  PASSWORD_RESET_SUCCESS: {
    subject: 'Password Reset Successful - Commerce',
    getHtml: (name: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background-color: #000; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; }
            .content { padding: 40px 30px; }
            .success-box { background-color: #d4edda; border: 2px solid #28a745; padding: 20px; text-align: center; margin: 30px 0; }
            .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>COMMERCE</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              
              <div class="success-box">
                <h3 style="color: #28a745; margin: 0;">✓ Password Reset Successful</h3>
                <p style="margin: 10px 0 0 0;">Your password has been successfully updated.</p>
              </div>
              
              <p>Your account password has been changed successfully. If you didn't make this change, please contact our support team immediately.</p>
              
              <p>For your security, we recommend:</p>
              <ul>
                <li>Using a strong, unique password</li>
                <li>Enabling two-factor authentication if available</li>
                <li>Not sharing your login credentials</li>
              </ul>
            </div>
            <div class="footer">
              <p>&copy; 2024 Commerce. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
};