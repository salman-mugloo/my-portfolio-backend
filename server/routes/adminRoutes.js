import express from 'express';
import { changeUsername } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/csrf.js';

const router = express.Router();

// Change username endpoint (requires CSRF protection)
router.put('/change-username', protect, csrfProtect, changeUsername);

export default router;
