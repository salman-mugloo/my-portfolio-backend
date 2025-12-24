import crypto from 'crypto';

// In-memory token store (in production, consider using Redis)
// Format: { adminId: { token: string, expiresAt: number } }
const tokenStore = new Map();

// Token expiration time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * Generate a CSRF token for an admin
 * @param {string} adminId - Admin ID
 * @returns {string} - CSRF token
 */
export const generateCSRFToken = (adminId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + TOKEN_EXPIRY;
  
  tokenStore.set(adminId, {
    token,
    expiresAt
  });
  
  return token;
};

/**
 * Validate CSRF token
 * @param {string} adminId - Admin ID
 * @param {string} token - CSRF token to validate
 * @returns {boolean} - True if valid
 */
export const validateCSRFToken = (adminId, token) => {
  const stored = tokenStore.get(adminId);
  
  if (!stored) {
    return false;
  }
  
  // Check if token expired
  if (Date.now() > stored.expiresAt) {
    tokenStore.delete(adminId);
    return false;
  }
  
  // Validate token
  return stored.token === token;
};

/**
 * Clear CSRF token for an admin (on logout)
 * @param {string} adminId - Admin ID
 */
export const clearCSRFToken = (adminId) => {
  tokenStore.delete(adminId);
};

/**
 * Clean up expired tokens (run periodically)
 */
export const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [adminId, data] of tokenStore.entries()) {
    if (now > data.expiresAt) {
      tokenStore.delete(adminId);
    }
  }
};

// Clean up expired tokens every 30 minutes
setInterval(cleanupExpiredTokens, 30 * 60 * 1000);

/**
 * CSRF protection middleware
 * Validates X-CSRF-Token header for POST/PUT/DELETE requests
 */
export const csrfProtect = (req, res, next) => {
  // Only protect POST, PUT, DELETE, PATCH methods
  const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!protectedMethods.includes(req.method)) {
    return next();
  }
  
  // Get adminId from request (set by auth middleware)
  const adminId = req.adminId;
  
  if (!adminId) {
    return res.status(401).json({ message: 'Authentication required for CSRF protection' });
  }
  
  // Get CSRF token from header
  const csrfToken = req.headers['x-csrf-token'];
  
  if (!csrfToken) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }
  
  // Validate token
  if (!validateCSRFToken(adminId, csrfToken)) {
    return res.status(403).json({ message: 'Invalid or expired CSRF token' });
  }
  
  next();
};

