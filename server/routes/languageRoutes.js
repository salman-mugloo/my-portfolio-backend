import express from 'express';
import {
  getLanguages,
  getAllLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage
} from '../controllers/languageController.js';
import { protect } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/csrf.js';

const router = express.Router();

// Public route
router.get('/', getLanguages);

// Admin routes
router.get('/admin', protect, getAllLanguages);
router.post('/admin', protect, csrfProtect, createLanguage);
router.put('/admin/:id', protect, csrfProtect, updateLanguage);
router.delete('/admin/:id', protect, csrfProtect, deleteLanguage);

export default router;

