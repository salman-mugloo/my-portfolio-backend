import express from 'express';
import rateLimit from 'express-rate-limit';
import { sendContactMessage } from '../controllers/contactController.js';

const router = express.Router();

// Rate limiting: 5 requests per 15 minutes per IP
const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    message: 'Too many contact form submissions from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post('/', contactRateLimiter, sendContactMessage);

export default router;

