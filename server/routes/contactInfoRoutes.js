import express from 'express';
import { getContactInfo, getContactInfoAdmin, updateContactInfo } from '../controllers/contactInfoController.js';
import { protect } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/csrf.js';

const router = express.Router();

// Public routes
router.get('/', getContactInfo);

// Admin routes
router.get('/admin', protect, getContactInfoAdmin);
router.put('/admin', protect, csrfProtect, updateContactInfo);

export default router;

