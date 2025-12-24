import express from 'express';
import { getFeatures, getAllFeatures, createFeature, updateFeature, deleteFeature } from '../controllers/featureController.js';
import { protect } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/csrf.js';

const router = express.Router();

// Public routes
router.get('/', getFeatures);

// Admin routes
router.get('/admin', protect, getAllFeatures);
router.post('/admin', protect, csrfProtect, createFeature);
router.put('/admin/:id', protect, csrfProtect, updateFeature);
router.delete('/admin/:id', protect, csrfProtect, deleteFeature);

export default router;

