/**
 * Audit Log Retention Configuration
 * 
 * This module defines the retention policy for admin activity logs.
 * Retention is NOT automatic - use the cleanup script manually.
 */

// Default retention period: 90 days
// Logs older than this will be eligible for deletion
export const DEFAULT_RETENTION_DAYS = 90;

// Minimum retention period (safety guard)
// Prevents accidental deletion of recent logs
export const MINIMUM_RETENTION_DAYS = 7;

/**
 * Get retention period from environment variable or use default
 * @returns {number} Retention period in days
 */
export const getRetentionDays = () => {
  const envRetention = process.env.AUDIT_LOG_RETENTION_DAYS;
  if (envRetention) {
    const days = parseInt(envRetention, 10);
    // Validate: must be between minimum and reasonable maximum (365 days)
    if (days >= MINIMUM_RETENTION_DAYS && days <= 365) {
      return days;
    }
    console.warn(`Invalid AUDIT_LOG_RETENTION_DAYS value: ${envRetention}. Using default: ${DEFAULT_RETENTION_DAYS} days`);
  }
  return DEFAULT_RETENTION_DAYS;
};

/**
 * Calculate the cutoff date for log retention
 * Logs older than this date are eligible for deletion
 * @param {number} retentionDays - Retention period in days
 * @returns {Date} Cutoff date
 */
export const getRetentionCutoffDate = (retentionDays = null) => {
  const days = retentionDays || getRetentionDays();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return cutoffDate;
};

/**
 * Validate retention configuration
 * @returns {Object} Validation result with isValid flag and message
 */
export const validateRetentionConfig = () => {
  const retentionDays = getRetentionDays();
  
  if (retentionDays < MINIMUM_RETENTION_DAYS) {
    return {
      isValid: false,
      message: `Retention period must be at least ${MINIMUM_RETENTION_DAYS} days`
    };
  }
  
  if (retentionDays > 365) {
    return {
      isValid: false,
      message: 'Retention period should not exceed 365 days'
    };
  }
  
  return {
    isValid: true,
    message: `Retention policy: ${retentionDays} days`
  };
};

export default {
  DEFAULT_RETENTION_DAYS,
  MINIMUM_RETENTION_DAYS,
  getRetentionDays,
  getRetentionCutoffDate,
  validateRetentionConfig
};

