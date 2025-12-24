import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage,
  uploadResume,
  deleteResume
} from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/csrf.js';
import { createStorage, createFileFilter } from '../middleware/upload.js';
import { handleUploadError } from '../middleware/uploadSecurity.js';
import multer from 'multer';

const profileUpload = multer({
  storage: createStorage('profile'),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: createFileFilter('profile')
});

const resumeUpload = multer({
  storage: createStorage('resume'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for PDFs
  },
  fileFilter: createFileFilter('resume')
});

const router = express.Router();

// Public route
router.get('/', getProfile);

// Admin routes (require CSRF protection for POST/PUT/DELETE)
router.put('/', protect, csrfProtect, updateProfile);
router.post('/image', protect, csrfProtect, profileUpload.single('profileImage'), handleUploadError, uploadProfileImage);
router.delete('/image', protect, csrfProtect, deleteProfileImage);
router.put('/resume', protect, csrfProtect, resumeUpload.single('resume'), handleUploadError, uploadResume);
router.delete('/resume', protect, csrfProtect, deleteResume);

export default router;
