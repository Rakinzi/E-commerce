import { randomInt } from 'crypto';
import OTP, { IOTP } from '../models/OTP.js';
import { transporter, EMAIL_TEMPLATES } from '../config/email.js';
import logger from '../utils/logger.js';
import { env } from '../config/env.js';

export type OTPType = 'email_verification' | 'password_reset';

export interface OTPResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}

export class OTPService {
  
  /**
   * Generate a 6-digit OTP code
   */
  private static generateOTPCode(): string {
    return randomInt(100000, 999999).toString();
  }

  /**
   * Create and send OTP
   */
  static async createAndSendOTP(
    email: string, 
    type: OTPType, 
    userName: string = 'User'
  ): Promise<OTPResult> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Invalidate any existing OTPs for this email and type
      await OTP.invalidateOTPs(normalizedEmail, type);
      
      // Generate new OTP
      const code = this.generateOTPCode();
      
      // Create OTP record
      const otp = new OTP({
        email: normalizedEmail,
        code,
        type,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      });
      
      await otp.save();
      
      // Send email
      const emailSent = await this.sendOTPEmail(normalizedEmail, code, type, userName);
      
      if (!emailSent) {
        // If email failed, cleanup the OTP
        await otp.deleteOne();
        return {
          success: false,
          message: 'Failed to send verification email. Please try again.'
        };
      }
      
      logger.info(`OTP sent successfully for ${type}: ${normalizedEmail}`);
      
      return {
        success: true,
        message: `Verification code sent to ${email}`
      };
      
    } catch (error) {
      logger.error(`Failed to create and send OTP for ${email}:`, error);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.'
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(
    email: string, 
    code: string, 
    type: OTPType
  ): Promise<OTPResult> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Find valid OTP
      const otp = await OTP.findValidOTP(normalizedEmail, code, type);
      
      if (!otp) {
        return {
          success: false,
          message: 'Invalid or expired verification code.'
        };
      }
      
      // Check if max attempts reached
      if (otp.isMaxAttemptsReached()) {
        await otp.markAsUsed(); // Invalidate the OTP
        return {
          success: false,
          message: 'Maximum verification attempts reached. Please request a new code.'
        };
      }
      
      // Check if expired
      if (otp.isExpired()) {
        await otp.markAsUsed(); // Invalidate the OTP
        return {
          success: false,
          message: 'Verification code has expired. Please request a new code.'
        };
      }
      
      // Mark as used
      await otp.markAsUsed();
      
      logger.info(`OTP verified successfully for ${type}: ${normalizedEmail}`);
      
      return {
        success: true,
        message: 'Verification successful.'
      };
      
    } catch (error) {
      logger.error(`Failed to verify OTP for ${email}:`, error);
      return {
        success: false,
        message: 'Verification failed. Please try again.'
      };
    }
  }

  /**
   * Increment failed attempts for OTP
   */
  static async incrementFailedAttempt(
    email: string, 
    code: string, 
    type: OTPType
  ): Promise<OTPResult> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      const otp = await OTP.findOne({
        email: normalizedEmail,
        code,
        type,
        used: false
      });
      
      if (otp && !otp.isExpired()) {
        await otp.incrementAttempts();
        
        const remainingAttempts = otp.maxAttempts - otp.attempts;
        
        if (remainingAttempts <= 0) {
          await otp.markAsUsed();
          return {
            success: false,
            message: 'Maximum verification attempts reached. Please request a new code.',
            remainingAttempts: 0
          };
        }
        
        return {
          success: false,
          message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts
        };
      }
      
      return {
        success: false,
        message: 'Invalid or expired verification code.'
      };
      
    } catch (error) {
      logger.error(`Failed to increment failed attempt for ${email}:`, error);
      return {
        success: false,
        message: 'Verification failed. Please try again.'
      };
    }
  }

  /**
   * Send OTP via email
   */
  private static async sendOTPEmail(
    email: string, 
    code: string, 
    type: OTPType, 
    userName: string
  ): Promise<boolean> {
    try {
      let template;
      
      switch (type) {
        case 'email_verification':
          template = EMAIL_TEMPLATES.VERIFY_EMAIL;
          break;
        case 'password_reset':
          template = EMAIL_TEMPLATES.FORGOT_PASSWORD;
          break;
        default:
          throw new Error(`Unknown OTP type: ${type}`);
      }
      
      const mailOptions = {
        from: {
          name: 'Commerce',
          address: env.SMTP_USER || 'noreply@commerce.com'
        },
        to: email,
        subject: template.subject,
        html: template.getHtml(code, userName)
      };
      
      // In development, still send actual emails but also log for debugging
      if (env.NODE_ENV === 'development') {
        logger.info('Development Mode - Sending email:', {
          to: email,
          subject: template.subject,
          otp: code,
          type
        });
      }
      
      const result = await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${email}:`, result.messageId);
      
      return true;
      
    } catch (error) {
      logger.error(`Failed to send OTP email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Check if user can request new OTP (rate limiting)
   */
  static async canRequestNewOTP(email: string, type: OTPType): Promise<OTPResult> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check for recent OTP requests (within last 1 minute)
      const recentOTP = await OTP.findOne({
        email: normalizedEmail,
        type,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // Last 1 minute
      });
      
      if (recentOTP) {
        return {
          success: false,
          message: 'Please wait before requesting a new verification code.'
        };
      }
      
      return {
        success: true,
        message: 'Can request new OTP'
      };
      
    } catch (error) {
      logger.error(`Failed to check OTP rate limit for ${email}:`, error);
      return {
        success: false,
        message: 'Failed to process request. Please try again.'
      };
    }
  }

  /**
   * Cleanup expired OTPs (to be called periodically)
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      const result = await OTP.cleanupExpired();
      logger.info(`Cleaned up ${result.deletedCount} expired OTP records`);
    } catch (error) {
      logger.error('Failed to cleanup expired OTPs:', error);
    }
  }

  /**
   * Send password reset success notification
   */
  static async sendPasswordResetSuccessEmail(email: string, userName: string): Promise<boolean> {
    try {
      const template = EMAIL_TEMPLATES.PASSWORD_RESET_SUCCESS;
      
      const mailOptions = {
        from: {
          name: 'Commerce',
          address: env.SMTP_USER || 'noreply@commerce.com'
        },
        to: email,
        subject: template.subject,
        html: template.getHtml(userName)
      };
      
      // In development, still send actual emails but also log for debugging
      if (env.NODE_ENV === 'development') {
        logger.info('Development Mode - Sending password reset success email:', {
          to: email,
          subject: template.subject
        });
      }
      
      const result = await transporter.sendMail(mailOptions);
      logger.info(`Password reset success email sent to ${email}:`, result.messageId);
      
      return true;
      
    } catch (error) {
      logger.error(`Failed to send password reset success email to ${email}:`, error);
      return false;
    }
  }
}