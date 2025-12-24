import AdminActivity from '../models/AdminActivity.js';

/**
 * Extract IP address from request
 * Checks x-forwarded-for header first, then falls back to connection.remoteAddress
 * @param {Object} req - Express request object
 * @returns {string} - IP address
 */
export const getClientIp = (req) => {
  // Check x-forwarded-for header (for proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  // Fall back to connection remote address
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
};

/**
 * Extract user agent from request
 * @param {Object} req - Express request object
 * @returns {string} - User agent string
 */
export const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Log admin activity (non-blocking, fail-safe)
 * This function never throws errors and doesn't block the request
 * @param {Object} params - Activity parameters
 * @param {string} params.adminId - Admin ID
 * @param {string} params.action - Action type (from enum)
 * @param {Object} params.metadata - Additional metadata (optional)
 * @param {Object} params.req - Express request object (for IP and user agent)
 */
export const logAdminActivity = async ({ adminId, action, metadata = {}, req = null }) => {
  // Validate required fields
  if (!adminId || !action) {
    console.error('Audit log: Missing required fields (adminId or action)');
    return;
  }

  // Validate action is in enum
  const validActions = [
    'LOGIN_SUCCESS',
    'OTP_VERIFICATION_SUCCESS',
    'OTP_VERIFICATION_FAILURE',
    'PASSWORD_CHANGE',
    'USERNAME_CHANGE',
    'LOGOUT',
    'PROFILE_IMAGE_UPLOAD',
    'PROFILE_IMAGE_DELETE',
    'RESUME_UPLOAD',
    'RESUME_DELETE'
  ];

  if (!validActions.includes(action)) {
    console.error(`Audit log: Invalid action type: ${action}`);
    return;
  }

  // Extract IP and user agent from request if provided
  const ipAddress = req ? getClientIp(req) : null;
  const userAgent = req ? getUserAgent(req) : null;

  // Create activity log entry (non-blocking, fail-safe)
  // Use setImmediate to ensure it doesn't block the current request
  setImmediate(async () => {
    try {
      await AdminActivity.create({
        adminId,
        action,
        metadata: metadata || {},
        ipAddress,
        userAgent,
        createdAt: new Date()
      });
    } catch (error) {
      // Fail-safe: Log error but never throw
      // This ensures logging failures never break the application
      console.error('Failed to log admin activity:', {
        adminId,
        action,
        error: error.message
      });
    }
  });
};

/**
 * Convenience functions for specific actions
 */
export const auditLogger = {
  loginSuccess: (adminId, req, metadata = {}) => {
    logAdminActivity({ adminId, action: 'LOGIN_SUCCESS', metadata, req });
  },

  otpVerificationSuccess: (adminId, req, metadata = {}) => {
    logAdminActivity({ adminId, action: 'OTP_VERIFICATION_SUCCESS', metadata, req });
  },

  otpVerificationFailure: (adminId, req, metadata = {}) => {
    logAdminActivity({ adminId, action: 'OTP_VERIFICATION_FAILURE', metadata, req });
  },

  passwordChange: (adminId, req, metadata = {}) => {
    logAdminActivity({ adminId, action: 'PASSWORD_CHANGE', metadata, req });
  },

  usernameChange: (adminId, req, metadata = {}) => {
    logAdminActivity({ adminId, action: 'USERNAME_CHANGE', metadata, req });
  },

  logout: (adminId, req, metadata = {}) => {
    logAdminActivity({ adminId, action: 'LOGOUT', metadata, req });
  },

  profileImageUpload: (adminId, req, metadata = {}) => {
    logAdminActivity({ adminId, action: 'PROFILE_IMAGE_UPLOAD', metadata, req });
  },

  profileImageDelete: (adminId, req, metadata = {}) => {
    logAdminActivity({ adminId, action: 'PROFILE_IMAGE_DELETE', metadata, req });
  },

  resumeUpload: (adminId, req, metadata = {}) => {
    logAdminActivity({ adminId, action: 'RESUME_UPLOAD', metadata, req });
  },

  resumeDelete: (adminId, req, metadata = {}) => {
    logAdminActivity({ adminId, action: 'RESUME_DELETE', metadata, req });
  }
};

export default auditLogger;

