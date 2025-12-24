import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  sanitizeFilename, 
  generateSecureFilename, 
  validateMimeType, 
  validateFileSize,
  validateUploadFolder,
  getFileSizeLimitMessage
} from './uploadSecurity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create storage factory with security
export const createStorage = (subfolder = '') => {
  // Validate upload folder
  if (subfolder && !validateUploadFolder(subfolder)) {
    throw new Error(`Invalid upload folder: ${subfolder}. Allowed folders: profile, resume, certificates`);
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure subfolder is whitelisted
      if (subfolder && !validateUploadFolder(subfolder)) {
        return cb(new Error(`Invalid upload folder: ${subfolder}`));
      }

      const uploadPath = subfolder 
        ? path.join(__dirname, '../uploads', subfolder)
        : path.join(__dirname, '../uploads');
      
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      try {
        // Sanitize original filename
        const sanitized = sanitizeFilename(file.originalname);
        // Generate secure filename (never trust client filename)
        const secureFilename = generateSecureFilename(sanitized);
        cb(null, secureFilename);
      } catch (error) {
        cb(new Error(`Invalid filename: ${error.message}`));
      }
    }
  });
};

// Storage configuration for general use
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create file filter factory with security validation
export const createFileFilter = (uploadType) => {
  return (req, file, cb) => {
    try {
      // Validate MIME type
      if (!validateMimeType(uploadType, file.mimetype, file.originalname)) {
        const allowedTypes = {
          profile: 'JPEG, PNG, or WebP',
          resume: 'PDF',
          certificates: 'JPEG, PNG, WebP, or PDF'
        };
        return cb(new Error(
          `Invalid file type. Only ${allowedTypes[uploadType] || 'allowed'} files are permitted.`
        ));
      }

      // File size validation is handled by multer limits, but we can add additional check here
      // The actual size check happens in multer limits configuration
      
      cb(null, true);
    } catch (error) {
      cb(new Error(`File validation error: ${error.message}`));
    }
  };
};

// Legacy upload (kept for backward compatibility, but should use createStorage instead)
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

