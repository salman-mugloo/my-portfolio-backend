import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { isDevelopment } from './config/environment.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import expertiseRoutes from './routes/expertiseRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import certificationRoutes from './routes/certificationRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import featureRoutes from './routes/featureRoutes.js';
import contactInfoRoutes from './routes/contactInfoRoutes.js';
import educationRoutes from './routes/educationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import languageRoutes from './routes/languageRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Validate critical environment variables at startup
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Server cannot start without these variables.');
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Warn about recommended environment variables in production
if (!isDevelopment) {
  const recommendedEnvVars = ['FRONTEND_URL', 'EMAIL_USER', 'EMAIL_APP_PASSWORD'];
  const missingRecommended = recommendedEnvVars.filter(varName => !process.env[varName]);
  
  if (missingRecommended.length > 0) {
    console.warn('⚠️  WARNING: Missing recommended environment variables:', missingRecommended.join(', '));
    console.warn('Some features may not work correctly in production without these variables.');
  }
}

console.log('✅ Environment variables validated');

const app = express();

// Trust proxy for Railway (required for rate limiting behind proxy)
app.set("trust proxy", 1);

// Security headers with Helmet
// CSP disabled temporarily to fix invalid header character crash
// frameguard disabled to allow cross-origin iframe embedding (Vercel frontend + Railway backend)
app.use(
  helmet({
    contentSecurityPolicy: false,
    xContentTypeOptions: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for images/PDFs
    frameguard: false // Disable X-Frame-Options to allow cross-origin iframe embedding
  })
);

// CORS configuration - safe production-ready setup
const FRONTEND_URL = process.env.FRONTEND_URL?.trim();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);

// Middleware
app.use(express.json());

// Serve uploaded files (images + PDFs) from server/uploads/ directory
// Explicitly allow cross-origin access to fix ORB blocking
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// Database connection is handled in server startup (see app.listen below)

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/expertise', expertiseRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/contact-info', contactInfoRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/languages', languageRoutes);


// API root route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Portfolio API Server',
    version: '1.0.0',
    status: 'OK',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      projects: '/api/projects',
      expertise: '/api/expertise',
      skills: '/api/skills',
      certifications: '/api/certifications',
      resume: '/api/resume',
      profile: '/api/profile',
      contact: '/api/contact',
      languages: '/api/languages'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Portfolio API is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Portfolio API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      projects: '/api/projects',
      expertise: '/api/expertise',
      skills: '/api/skills',
      certifications: '/api/certifications',
      resume: '/api/resume',
      languages: '/api/languages'
    }
  });
});

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  // Always return JSON, never HTML
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

const PORT = process.env.PORT || 7002;

// Start server after database connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

