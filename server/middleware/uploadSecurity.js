import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

// Whitelist of allowed upload folders
const ALLOWED_UPLOAD_FOLDERS = ['profile', 'resume', 'certificates'];

// MIME type mappings
const ALLOWED_MIME_TYPES = {
  profile: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  resume: ['application/pdf'],
  certificates: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
};

// File size limits in bytes
const FILE_SIZE_LIMITS = {
  profile: 5 * 1024 * 1024, // 5MB
  resume: 10 * 1024 * 1024, // 10MB
  certificates: 10 * 1024 * 1024 // 10MB
};

/**
 * Sanitize filename to prevent path traversal attacks
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename provided');
  }

  // Remove any path components (../, ./, absolute paths)
  const normalized = path.normalize(filename);
  
  // Check for path traversal attempts
  if (normalized.includes('..') || path.isAbsolute(normalized)) {
    throw new Error('Filename contains invalid path components');
  }

  // Extract just the basename (no directory components)
  const basename = path.basename(normalized);
  
  // Remove any non-alphanumeric characters except dots, hyphens, and underscores
  // Keep the extension
  const ext = path.extname(basename);
  const nameWithoutExt = basename.replace(ext, '');
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '_') + ext.toLowerCase();
  
  // Ensure filename is not empty
  if (!sanitized || sanitized === ext) {
    throw new Error('Filename is invalid after sanitization');
  }

  return sanitized;
};

/**
 * Generate a secure random filename
 * @param {string} originalFilename - Original filename (for extension)
 * @returns {string} - Secure random filename
 */
export const generateSecureFilename = (originalFilename) => {
  const ext = path.extname(originalFilename).toLowerCase();
  const randomString = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${randomString}${ext}`;
};

/**
 * Validate MIME type against allowed types for upload type
 * @param {string} uploadType - Type of upload (profile, resume, certificates)
 * @param {string} mimeType - MIME type to validate
 * @param {string} originalFilename - Original filename for extension check
 * @returns {boolean} - True if valid
 */
export const validateMimeType = (uploadType, mimeType, originalFilename) => {
  if (!ALLOWED_MIME_TYPES[uploadType]) {
    throw new Error(`Invalid upload type: ${uploadType}`);
  }

  const allowedTypes = ALLOWED_MIME_TYPES[uploadType];
  
  // Validate MIME type
  if (!allowedTypes.includes(mimeType)) {
    return false;
  }

  // Additional validation: check file extension matches MIME type
  const ext = path.extname(originalFilename).toLowerCase();
  const extToMime = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf'
  };

  const expectedMime = extToMime[ext];
  if (expectedMime && expectedMime !== mimeType) {
    return false;
  }

  return true;
};

/**
 * Validate file size against limit for upload type
 * @param {string} uploadType - Type of upload
 * @param {number} fileSize - File size in bytes
 * @returns {boolean} - True if valid
 */
export const validateFileSize = (uploadType, fileSize) => {
  if (!FILE_SIZE_LIMITS[uploadType]) {
    throw new Error(`Invalid upload type: ${uploadType}`);
  }

  return fileSize <= FILE_SIZE_LIMITS[uploadType];
};

/**
 * Validate upload folder is whitelisted
 * @param {string} folder - Folder name to validate
 * @returns {boolean} - True if valid
 */
export const validateUploadFolder = (folder) => {
  return ALLOWED_UPLOAD_FOLDERS.includes(folder);
};

/**
 * Get human-readable file size limit for error messages
 * @param {string} uploadType - Type of upload
 * @returns {string} - Human-readable size limit
 */
export const getFileSizeLimitMessage = (uploadType) => {
  const limit = FILE_SIZE_LIMITS[uploadType];
  if (!limit) return 'unknown';
  
  if (limit < 1024 * 1024) {
    return `${limit / 1024}KB`;
  }
  return `${limit / (1024 * 1024)}MB`;
};

/**
 * Centralized upload error handler
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const handleUploadError = (error, req, res, next) => {
  // Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: `File size exceeds the maximum allowed size. Please upload a smaller file.` 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Too many files uploaded. Please upload fewer files.' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Unexpected file field. Please check the field name.' 
      });
    }
    return res.status(400).json({ 
      message: `Upload error: ${error.message}` 
    });
  }

  // Custom validation errors
  if (error.message) {
    // Path traversal attempt
    if (error.message.includes('path') || error.message.includes('invalid')) {
      return res.status(400).json({ 
        message: 'Invalid filename. Please use a valid filename without special characters.' 
      });
    }
    
    // MIME type errors
    if (error.message.includes('MIME') || error.message.includes('type') || error.message.includes('allowed')) {
      return res.status(400).json({ 
        message: error.message 
      });
    }

    // File size errors
    if (error.message.includes('size') || error.message.includes('large')) {
      return res.status(400).json({ 
        message: error.message 
      });
    }
  }

  // Generic error
  return res.status(400).json({ 
    message: 'File upload failed. Please check your file and try again.' 
  });
};

export default {
  sanitizeFilename,
  generateSecureFilename,
  validateMimeType,
  validateFileSize,
  validateUploadFolder,
  getFileSizeLimitMessage,
  handleUploadError,
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
  ALLOWED_UPLOAD_FOLDERS
};

