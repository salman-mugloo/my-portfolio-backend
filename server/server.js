import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { getCorsOptions, isDevelopment } from './config/environment.js';
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

// Security headers with Helmet
const frontendUrl = process.env.FRONTEND_URL || (isDevelopment ? 'http://localhost:7000' : '');
const backendUrl = isDevelopment ? 'http://localhost:7002' : (process.env.BACKEND_URL || '');

const cspDirectives = {
  defaultSrc: ["'self'"],
  imgSrc: ["'self'", 'data:', 'blob:', ...(backendUrl ? [backendUrl] : [])],
  connectSrc: ["'self'", ...(frontendUrl ? [frontendUrl] : []), ...(backendUrl ? [backendUrl] : [])],
  styleSrc: ["'self'", "'unsafe-inline'"],
  scriptSrc: ["'self'"],
  fontSrc: ["'self'"],
  frameSrc: ["'self'", ...(backendUrl ? [backendUrl] : [])], // Allow iframes from backend for PDF previews
  objectSrc: ["'self'", ...(backendUrl ? [backendUrl] : [])], // Allow PDFs from backend
  frameAncestors: frontendUrl ? ["'self'", frontendUrl] : ["'self'"], // Allow frontend to embed backend content
};

// Only add upgradeInsecureRequests in production
if (!isDevelopment) {
  cspDirectives.upgradeInsecureRequests = [];
}

// Configure Helmet
const helmetConfig = {
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hidePoweredBy: true,
  crossOriginResourcePolicy: isDevelopment ? { policy: 'cross-origin' } : { policy: 'same-origin' },
};

// In development, disable X-Frame-Options to allow CSP frame-ancestors to work
// X-Frame-Options: SAMEORIGIN blocks cross-origin iframes (localhost:7000 can't embed localhost:7002)
// In production, use DENY for maximum security
if (isDevelopment) {
  helmetConfig.xFrameOptions = false; // Disable X-Frame-Options in dev, rely on CSP frame-ancestors
} else {
  helmetConfig.xFrameOptions = { action: 'deny' };
}

app.use(helmet(helmetConfig));

// Middleware
app.use(cors(getCorsOptions()));
app.use(express.json());

// Serve uploaded files with CORS headers
// Configure Helmet to not apply CSP to static files by using a custom middleware
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  const corsOptions = getCorsOptions();
  if (corsOptions.origin === true || (typeof corsOptions.origin === 'string' && corsOptions.origin)) {
    res.setHeader('Access-Control-Allow-Origin', corsOptions.origin === true ? req.headers.origin || '*' : corsOptions.origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // Intercept the response to set proper CSP headers after Helmet
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = function(name, value) {
    if (name.toLowerCase() === 'content-security-policy') {
      // Override with our CSP that allows embedding
      const cspHeader = [
        "default-src 'self'",
        `img-src 'self' data: blob: ${backendUrl || ''}`,
        `connect-src 'self' ${frontendUrl || ''} ${backendUrl || ''}`,
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
        "font-src 'self'",
        `frame-src 'self' ${backendUrl || ''}`,
        `object-src 'self' ${backendUrl || ''}`,
        `frame-ancestors 'self' ${frontendUrl || ''}`
      ].filter(Boolean).join('; ');
      return originalSetHeader(name, cspHeader);
    }
    if (name.toLowerCase() === 'x-frame-options' && isDevelopment) {
      // Don't set X-Frame-Options in development
      return;
    }
    return originalSetHeader(name, value);
  };
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

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
      contact: '/api/contact'
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
      resume: '/api/resume'
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
    console.log('🚀 Server started successfully');
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   API Base: http://localhost:${PORT}/api`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

