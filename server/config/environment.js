// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';

export const isDevelopment = NODE_ENV === 'development';
export const isProduction = NODE_ENV === 'production';

// CORS configuration
export const getCorsOptions = () => {
  if (isDevelopment) {
    // Development: allow all origins
    return {
      origin: true, // Allow all origins
      credentials: true
    };
  } else {
    // Production: allow only FRONTEND_URL
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      console.warn('WARNING: FRONTEND_URL not set in production environment');
    }
    return {
      origin: frontendUrl || false,
      credentials: true
    };
  }
};

// JWT expiry configuration
export const getJWTExpiry = () => {
  if (isDevelopment) {
    return '30d'; // Development: 30 days
  } else {
    return '7d'; // Production: 7 days
  }
};

// Error logging configuration
export const logError = (error, context = '') => {
  if (isDevelopment) {
    // Development: full error + stack
    console.error(`[${context}] Error:`, error);
    if (error.stack) {
      console.error(`[${context}] Stack:`, error.stack);
    }
  } else {
    // Production: message only
    console.error(`[${context}] Error:`, error.message || 'An error occurred');
  }
};

// Error response configuration
export const formatErrorResponse = (error, defaultMessage = 'An error occurred') => {
  if (isDevelopment) {
    // Development: detailed error
    return {
      message: error.message || defaultMessage,
      error: error.name || 'Error',
      ...(error.stack && { stack: error.stack })
    };
  } else {
    // Production: generic message
    return {
      message: defaultMessage
    };
  }
};

export default {
  NODE_ENV,
  isDevelopment,
  isProduction,
  getCorsOptions,
  getJWTExpiry,
  logError,
  formatErrorResponse
};

