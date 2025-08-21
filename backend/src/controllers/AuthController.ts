import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService, LoginCredentials, RegisterData } from '../services/AuthService.js';
import { OTPService } from '../services/OTPService.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';
import { env } from '../config/env.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password cannot exceed 128 characters'),
  role: z.enum(['customer'], {
    errorMap: () => ({ message: 'Role must be customer. Vendor registration is not available.' })
  }).default('customer')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers')
});

const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  type: z.enum(['email_verification', 'password_reset'])
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase()
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
});

export class AuthController {
  
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser) {
        res.status(409).json({
          error: 'User already exists with this email',
          requiresVerification: !existingUser.isEmailVerified
        });
        return;
      }

      // Find the role by name
      const role = await Role.findOne({ name: validatedData.role });
      if (!role) {
        res.status(400).json({ error: `Role '${validatedData.role}' not found` });
        return;
      }

      // Create user (not verified initially)
      const user = new User({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        roles: [role._id],
        isEmailVerified: false
      });

      await user.save();

      // Send verification email
      const otpResult = await OTPService.createAndSendOTP(
        validatedData.email,
        'email_verification',
        validatedData.name
      );

      if (!otpResult.success) {
        // Clean up user if email failed
        await user.deleteOne();
        res.status(500).json({ error: otpResult.message });
        return;
      }

      // Update last email verification sent
      user.lastEmailVerificationSent = new Date();
      await user.save();

      res.status(201).json({
        message: 'Registration successful. Please check your email for verification code.',
        email: validatedData.email,
        requiresVerification: true
      });

      logger.info(`User registered successfully: ${validatedData.email}`);
      
    } catch (error) {
      logger.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user and include password for comparison
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        res.status(403).json({
          error: 'Email not verified. Please verify your email before logging in.',
          requiresVerification: true,
          email: user.email
        });
        return;
      }

      // Generate session for verified user
      const authResponse = await AuthService.generateSession(user);
      
      // Set HTTP-only cookie
      res.cookie('authToken', authResponse.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      res.status(200).json({
        message: 'Login successful',
        user: authResponse.user,
        sessionId: authResponse.sessionId
      });

      logger.info(`User logged in successfully: ${email}`);
      
    } catch (error) {
      logger.error('Login error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.sessionToken) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      await AuthService.logout(req.user._id.toString(), req.sessionToken);
      
      // Clear cookie
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });

      res.status(200).json({ message: 'Logout successful' });
      
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  static async logoutAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      await AuthService.logoutAll(req.user._id.toString());
      
      // Clear cookie
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });

      res.status(200).json({ message: 'All sessions logged out successfully' });
      
    } catch (error) {
      logger.error('Logout all error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  static async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.sessionToken) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const authResponse = await AuthService.refreshSession(
        req.user._id.toString(), 
        req.sessionToken
      );
      
      // Set new HTTP-only cookie
      res.cookie('authToken', authResponse.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      res.status(200).json({
        message: 'Token refreshed successfully',
        user: authResponse.user,
        sessionId: authResponse.sessionId
      });
      
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      res.status(200).json({
        user: req.user
      });
      
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const updateSchema = z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters').optional()
      });

      const validatedData = updateSchema.parse(req.body);
      
      if (validatedData.name) {
        req.user.name = validatedData.name;
        await req.user.save();
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        user: req.user
      });
      
    } catch (error) {
      logger.error('Update profile error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  /**
   * Verify email with OTP
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = verifyEmailSchema.parse(req.body);

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (user.isEmailVerified) {
        res.status(400).json({ error: 'Email already verified' });
        return;
      }

      // Verify OTP
      const otpResult = await OTPService.verifyOTP(email, otp, 'email_verification');

      if (!otpResult.success) {
        res.status(400).json({ error: otpResult.message });
        return;
      }

      // Mark email as verified
      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();

      // Generate session for verified user
      const authResponse = await AuthService.generateSession(user);

      // Set HTTP-only cookie
      res.cookie('authToken', authResponse.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      res.status(200).json({
        message: 'Email verified successfully',
        user: authResponse.user,
        sessionId: authResponse.sessionId
      });

      logger.info(`Email verified successfully: ${email}`);

    } catch (error) {
      logger.error('Email verification error:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }

      res.status(500).json({ error: 'Email verification failed' });
    }
  }

  /**
   * Resend OTP
   */
  static async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, type } = resendOtpSchema.parse(req.body);

      // Check rate limiting
      const canRequest = await OTPService.canRequestNewOTP(email, type);
      if (!canRequest.success) {
        res.status(429).json({ error: canRequest.message });
        return;
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Don't allow resending verification OTP for already verified users
      if (type === 'email_verification' && user.isEmailVerified) {
        res.status(400).json({ error: 'Email already verified' });
        return;
      }

      // Send OTP
      const otpResult = await OTPService.createAndSendOTP(email, type, user.name);

      if (!otpResult.success) {
        res.status(500).json({ error: otpResult.message });
        return;
      }

      // Update timestamp
      if (type === 'email_verification') {
        user.lastEmailVerificationSent = new Date();
        await user.save();
      }

      res.status(200).json({ message: otpResult.message });

      logger.info(`OTP resent successfully for ${type}: ${email}`);

    } catch (error) {
      logger.error('Resend OTP error:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }

      res.status(500).json({ error: 'Failed to resend OTP' });
    }
  }

  /**
   * Forgot password - send reset OTP
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists - security best practice
        res.status(200).json({
          message: 'If an account with this email exists, you will receive a password reset code.'
        });
        return;
      }

      // Check rate limiting
      const canRequest = await OTPService.canRequestNewOTP(email, 'password_reset');
      if (!canRequest.success) {
        res.status(429).json({ error: canRequest.message });
        return;
      }

      // Send reset OTP
      const otpResult = await OTPService.createAndSendOTP(email, 'password_reset', user.name);

      res.status(200).json({
        message: 'If an account with this email exists, you will receive a password reset code.'
      });

      logger.info(`Password reset OTP sent: ${email}`);

    } catch (error) {
      logger.error('Forgot password error:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }

      res.status(500).json({ error: 'Failed to process request' });
    }
  }

  /**
   * Reset password with OTP
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify OTP
      const otpResult = await OTPService.verifyOTP(email, otp, 'password_reset');

      if (!otpResult.success) {
        res.status(400).json({ error: otpResult.message });
        return;
      }

      // Update password
      user.password = newPassword; // Will be hashed by pre-save hook
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      
      // Invalidate all existing sessions for security
      user.sessionTokens = [];
      
      await user.save();

      // Send success notification email
      await OTPService.sendPasswordResetSuccessEmail(email, user.name);

      res.status(200).json({
        message: 'Password reset successful. Please log in with your new password.'
      });

      logger.info(`Password reset successfully: ${email}`);

    } catch (error) {
      logger.error('Reset password error:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }

      res.status(500).json({ error: 'Password reset failed' });
    }
  }
}