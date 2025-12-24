import express from 'express';
import { protect } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/csrf.js';
import {
  getEducation,
  getAllEducation,
  createEducation,
  updateEducation,
  deleteEducation
} from '../controllers/educationController.js';

const router = express.Router();

// Public routes
router.get('/', getEducation);

// Admin routes
router.route('/admin')
  .get(protect, getAllEducation)
  .post(protect, csrfProtect, createEducation);

router.route('/admin/:id')
  .put(protect, csrfProtect, updateEducation)
  .delete(protect, csrfProtect, deleteEducation);

export default router;

