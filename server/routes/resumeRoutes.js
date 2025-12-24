import express from 'express';
import multer from 'multer';
import {
  getResume,
  getAllResumes,
  uploadResume,
  deleteResume
} from '../controllers/resumeController.js';
import { protect } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/csrf.js';
import { createStorage, createFileFilter } from '../middleware/upload.js';
import { handleUploadError } from '../middleware/uploadSecurity.js';

const resumeUpload = multer({
  storage: createStorage('resume'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: createFileFilter('resume')
});

const router = express.Router();

// Public route
router.get('/', getResume);

// Admin routes
router.get('/admin', protect, getAllResumes);
router.post('/admin', protect, csrfProtect, resumeUpload.single('resume'), handleUploadError, uploadResume);
router.delete('/admin/:id', protect, csrfProtect, deleteResume);

export default router;

