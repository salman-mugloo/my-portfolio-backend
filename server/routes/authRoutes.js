import express from 'express';
import { login, changePassword, forgotPassword, resetPassword, verifyLoginOTP, resendLoginOTP, getCSRFToken, logout } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/csrf.js';
import {
  loginRateLimiter,
  verifyOTPRateLimiter,
  resendOTPRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter
} from '../middleware/rateLimiters.js';

const router = express.Router();

// Public routes (no CSRF protection)
router.post('/login', loginRateLimiter, login);
router.post('/verify-login-otp', verifyOTPRateLimiter, verifyLoginOTP);
router.post('/resend-login-otp', resendOTPRateLimiter, resendLoginOTP);
router.post('/forgot-password', forgotPasswordRateLimiter, forgotPassword);
router.post('/reset-password', resetPasswordRateLimiter, resetPassword);

// CSRF token endpoint (protected, but no CSRF required for GET)
router.get('/csrf-token', protect, getCSRFToken);

// Protected routes (require CSRF protection)
router.post('/change-password', protect, csrfProtect, changePassword);
router.post('/logout', protect, csrfProtect, logout);

export default router;
