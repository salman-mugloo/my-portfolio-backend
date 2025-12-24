import express from 'express';
import { getActivityLogs } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.get('/admin', protect, getActivityLogs);

// Health check route for debugging
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Activity routes are working' });
});

export default router;

