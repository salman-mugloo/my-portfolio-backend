import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import Admin from '../models/Admin.js';
import { getJWTExpiry, logError, formatErrorResponse, isDevelopment } from '../config/environment.js';
import auditLogger from '../utils/auditLogger.js';
import { generateCSRFToken } from '../middleware/csrf.js';

const generateToken = (id) => {
  // jwt.sign automatically includes 'iat' (issued at) claim
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: getJWTExpiry()
  });
};

// Helper function to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send OTP email
const sendOTPEmail = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error('Email service is not configured');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Login OTP - Portfolio Admin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #10b981; margin-bottom: 20px;">Login Verification Code</h2>
        
        <p>You requested to login to your admin account.</p>
        
        <p>Your verification code is:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; padding: 20px 40px; background-color: #10b981; color: #000000; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>
        
        <p style="font-size: 12px; color: #888; margin-top: 20px;">
          This code will expire in 5 minutes.
        </p>
        
        <p style="font-size: 12px; color: #888;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }
    
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await admin.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    // Ensure OTP is a string before hashing
    const otpString = String(otp).trim();
    const hashedOTP = await bcrypt.hash(otpString, 10);
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Save hashed OTP and expiry
    admin.loginOtp = hashedOTP;
    admin.loginOtpExpires = new Date(otpExpires);
    await admin.save();

    // Send OTP email
    try {
      await sendOTPEmail(admin.username, otpString);
    } catch (emailError) {
      logError(emailError, 'sendOTPEmail (login)');
      // Clear OTP if email fails
      admin.loginOtp = null;
      admin.loginOtpExpires = null;
      await admin.save();
      return res.status(500).json({ 
        message: 'Failed to send OTP. Please try again.' 
      });
    }

    // Log login success (OTP sent)
    auditLogger.loginSuccess(admin._id, req, { username: admin.username });

    // Return otpRequired response (NO JWT YET)
    res.json({
      otpRequired: true,
      message: 'OTP sent to your email',
      email: admin.username // Return email for frontend
    });

  } catch (error) {
    logError(error, 'login');
    const errorResponse = formatErrorResponse(error, 'Login failed');
    res.status(500).json(errorResponse);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    // Validate new password length (minimum 6 characters)
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Check if adminId is available (set by auth middleware)
    if (!req.adminId) {
      return res.status(401).json({ message: 'Not authorized. Please login again.' });
    }

    // Get admin from request (set by auth middleware)
    const admin = await Admin.findById(req.adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Verify current password
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is different from current password
    const isSamePassword = await admin.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: 'New password must be different from current password' 
      });
    }

    // Update password and set passwordChangedAt
    admin.password = newPassword;
    admin.passwordChangedAt = new Date();
    await admin.save();

    // Log password change
    auditLogger.passwordChange(req.adminId, req);

    res.json({ 
      message: 'Password changed successfully. Please log in again.',
      success: true,
      forceLogout: true
    });
  } catch (error) {
    logError(error, 'changePassword');
    const errorResponse = formatErrorResponse(error, 'Failed to change password');
    res.status(500).json(errorResponse);
  }
};

// @desc    Change admin username (email)
export const changeUsername = async (req, res) => {
  try {
    const { newUsername } = req.body;

    // Validate input
    if (!newUsername || !newUsername.trim()) {
      return res.status(400).json({ 
        message: 'New username (email) is required' 
      });
    }

    const trimmedUsername = newUsername.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedUsername)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    // Check if adminId is available (set by auth middleware)
    if (!req.adminId) {
      return res.status(401).json({ message: 'Not authorized. Please login again.' });
    }

    // Get admin from request (set by auth middleware)
    const admin = await Admin.findById(req.adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if new username is the same as current
    if (admin.username.toLowerCase() === trimmedUsername) {
      return res.status(400).json({ 
        message: 'New username must be different from current username' 
      });
    }

    // Check if username is already in use
    const existingAdmin = await Admin.findOne({ 
      username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') },
      _id: { $ne: admin._id }
    });

    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'This username (email) is already in use' 
      });
    }

    // Update username and set passwordChangedAt (to invalidate tokens)
    const oldUsername = admin.username;
    admin.username = trimmedUsername;
    admin.passwordChangedAt = new Date();
    await admin.save();

    // Log username change
    auditLogger.usernameChange(req.adminId, req, { 
      oldUsername,
      newUsername: admin.username 
    });

    res.json({ 
      message: 'Username updated. Please log in again.',
      newUsername: admin.username,
      forceLogout: true
    });
  } catch (error) {
    logError(error, 'changeUsername');
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'This username (email) is already in use' 
      });
    }
    const errorResponse = formatErrorResponse(error, 'Failed to update username');
    res.status(500).json(errorResponse);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });

    // Don't reveal if user exists or not (security best practice)
    if (!admin) {
      // Still return success to prevent username enumeration
      return res.json({ 
        message: 'If an account with that username exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Save token to admin
    admin.resetToken = resetToken;
    admin.resetTokenExpiry = resetTokenExpiry;
    await admin.save();

    // Create reset URL - use FRONTEND_URL for admin panel
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:7001';
    const resetUrl = `${FRONTEND_URL}/cms/reset-password?token=${resetToken}`;

    // Send email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      logError(new Error('Email service not configured'), 'forgotPassword');
      return res.status(500).json({ 
        message: 'Email service is not configured. Please contact the administrator.' 
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: admin.username, // username is the email
      subject: 'Password Reset Request - Portfolio Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #ffffff; border-radius: 8px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p>You requested a password reset for your admin account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 12px; color: #888;">Or copy and paste this link:</p>
          <p style="font-size: 12px; color: #888; word-break: break-all;">${resetUrl}</p>
          
          <p style="font-size: 12px; color: #888; margin-top: 20px;">
            This link will expire in 30 minutes.
          </p>
          
          <p style="font-size: 12px; color: #888;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'If an account with that username exists, a password reset link has been sent.' 
    });

  } catch (error) {
    logError(error, 'forgotPassword');
    const errorResponse = formatErrorResponse(error, 'Failed to process password reset request');
    res.status(500).json(errorResponse);
  }
};

// @desc    Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: 'Token and new password are required' 
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Find admin with valid token
    const admin = await Admin.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // Token not expired
    });

    if (!admin) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    // Update password
    admin.password = newPassword;
    admin.resetToken = null;
    admin.resetTokenExpiry = null;
    await admin.save();

    res.json({ 
      message: 'Password reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    logError(error, 'resetPassword');
    const errorResponse = formatErrorResponse(error, 'Failed to reset password');
    res.status(500).json(errorResponse);
  }
};

// @desc    Verify login OTP
export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        message: 'Email and OTP are required' 
      });
    }

    // Trim and ensure OTP is a string
    const otpString = String(otp).trim();

    // Find admin by email
    const admin = await Admin.findOne({ username: email });

    if (!admin) {
      return res.status(401).json({ 
        message: 'Invalid email or OTP' 
      });
    }

    // Check if OTP exists and not expired
    if (!admin.loginOtp || !admin.loginOtpExpires) {
      return res.status(401).json({ 
        message: 'No OTP found. Please request a new login.' 
      });
    }

    if (admin.loginOtpExpires < new Date()) {
      // Clear expired OTP
      admin.loginOtp = null;
      admin.loginOtpExpires = null;
      await admin.save();
      return res.status(401).json({ 
        message: 'OTP has expired. Please request a new login.' 
      });
    }

    // Verify OTP - ensure both are strings
    const isOTPValid = await bcrypt.compare(otpString, String(admin.loginOtp));
    if (!isOTPValid) {
      // Log OTP verification failure
      auditLogger.otpVerificationFailure(admin._id, req, { username: admin.username });
      
      if (isDevelopment) {
        // Only log detailed OTP failure in development
        console.error('OTP verification failed:', {
          receivedOTP: otpString,
          storedOTPHash: admin.loginOtp ? 'exists' : 'missing',
          otpLength: otpString.length
        });
      }
      return res.status(401).json({ 
        message: 'Invalid OTP' 
      });
    }

    // Clear OTP fields
    admin.loginOtp = null;
    admin.loginOtpExpires = null;
    await admin.save();

    // Log OTP verification success
    auditLogger.otpVerificationSuccess(admin._id, req, { username: admin.username });

    // Generate JWT and return
    const token = generateToken(admin._id);
    res.json({
      token,
      username: admin.username,
      message: 'Login successful'
    });

  } catch (error) {
    logError(error, 'verifyLoginOTP');
    const errorResponse = formatErrorResponse(error, 'Failed to verify OTP');
    res.status(500).json(errorResponse);
  }
};

// @desc    Resend login OTP
export const resendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: 'Email is required' 
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ username: email });

    // Don't reveal if user exists (security best practice)
    if (!admin) {
      return res.json({ 
        message: 'If an account with that email exists, a new OTP has been sent.' 
      });
    }

    // Generate new 6-digit OTP
    const otp = generateOTP();
    // Ensure OTP is a string before hashing
    const otpString = String(otp).trim();
    const hashedOTP = await bcrypt.hash(otpString, 10);
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Save hashed OTP and expiry
    admin.loginOtp = hashedOTP;
    admin.loginOtpExpires = new Date(otpExpires);
    await admin.save();

    // Send OTP email
    try {
      await sendOTPEmail(admin.username, otpString);
    } catch (emailError) {
      logError(emailError, 'sendOTPEmail (resend)');
      // Clear OTP if email fails
      admin.loginOtp = null;
      admin.loginOtpExpires = null;
      await admin.save();
      return res.status(500).json({ 
        message: 'Failed to send OTP. Please try again.' 
      });
    }

    res.json({ 
      message: 'If an account with that email exists, a new OTP has been sent.' 
    });

  } catch (error) {
    logError(error, 'resendLoginOTP');
    const errorResponse = formatErrorResponse(error, 'Failed to resend OTP');
    res.status(500).json(errorResponse);
  }
};

// @desc    Get CSRF token (admin)
export const getCSRFToken = async (req, res) => {
  try {
    // adminId is set by protect middleware
    if (!req.adminId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Generate CSRF token
    const csrfToken = generateCSRFToken(req.adminId);

    res.json({ csrfToken });
  } catch (error) {
    logError(error, 'getCSRFToken');
    const errorResponse = formatErrorResponse(error, 'Failed to generate CSRF token');
    res.status(500).json(errorResponse);
  }
};

// @desc    Logout - audit logging only (JWT is stateless, no invalidation needed)
export const logout = async (req, res) => {
  try {
    // adminId is set by protect middleware
    if (!req.adminId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get admin to retrieve username for metadata
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Log logout action (non-blocking, fail-safe)
    auditLogger.logout(req.adminId, req, { username: admin.username });

    res.json({ success: true });
  } catch (error) {
    // Logging failures should not block logout
    // Still return success to allow frontend to proceed with local cleanup
    logError(error, 'logout');
    // Return success even if logging fails (non-blocking)
    res.json({ success: true });
  }
};
