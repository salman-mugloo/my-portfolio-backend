import express from 'express';
import multer from 'multer';
import {
  getCertifications,
  getAllCertifications,
  createCertification,
  updateCertification,
  deleteCertification
} from '../controllers/certificationController.js';
import { protect } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/csrf.js';
import { createStorage, createFileFilter } from '../middleware/upload.js';
import { handleUploadError } from '../middleware/uploadSecurity.js';

const certUpload = multer({
  storage: createStorage('certificates'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: createFileFilter('certificates')
});

const router = express.Router();

// Public route
router.get('/', getCertifications);

// Admin routes
router.get('/admin', protect, getAllCertifications);
router.post('/admin', protect, csrfProtect, certUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), handleUploadError, createCertification);
router.put('/admin/:id', protect, csrfProtect, certUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), handleUploadError, updateCertification);
router.delete('/admin/:id', protect, csrfProtect, deleteCertification);

export default router;

