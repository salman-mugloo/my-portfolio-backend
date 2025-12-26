# Portfolio Backend API

A secure, production-ready Node.js + Express REST API backend for a portfolio website with comprehensive CMS functionality.

## 🔗 Related Repositories

- **Frontend Repository:** [my-portfolio-frontend](https://github.com/salman-mugloo/my-portfolio-frontend)
- **Backend Repository:** [my-portfolio-backend](https://github.com/salman-mugloo/my-portfolio-backend) (this repo)

## 🌐 Live API

**API Base URL:** Configured via Railway deployment

## 🚀 Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** Helmet.js, CORS, CSRF Protection
- **File Upload:** Multer
- **Email:** Nodemailer (Gmail SMTP)
- **Rate Limiting:** express-rate-limit
- **Deployment:** Railway

## ✨ Features

### Authentication & Authorization
- JWT-based authentication
- OTP (One-Time Password) email verification
- Password hashing with bcrypt
- CSRF token protection
- Password reset functionality
- Secure logout with audit logging

### Content Management APIs
- **Profile Management:** Update profile, upload profile images
- **Project Management:** CRUD operations for portfolio projects
- **Skills Management:** Manage technical skills
- **Expertise Management:** Manage technical expertise areas
- **Certification Management:** Upload certificates (images + PDFs)
- **Education Management:** Manage educational background
- **Languages Management:** Manage language proficiencies
- **Resume Management:** Upload and manage resume PDFs
- **Contact Info Management:** Update contact information
- **Feature Management:** Manage about section features

### Public APIs
- Get active projects
- Get active skills
- Get active certifications
- Get profile information
- Get education history
- Get languages
- Get features
- Get contact information
- Submit contact form messages

### File Management
- Secure file uploads (images and PDFs)
- File type validation
- File size limits
- Static file serving with CORS
- Cross-origin resource sharing (ORB) support

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens:** Secure, stateless authentication
- **Password Hashing:** bcrypt with salt rounds
- **OTP Verification:** Email-based one-time passwords
- **CSRF Protection:** Token-based CSRF protection for all state-changing operations
- **Rate Limiting:** Per-endpoint rate limiting to prevent abuse
  - Login attempts: 5 per 15 minutes
  - OTP verification: 5 per 15 minutes
  - Password reset: 3 per hour
  - Contact form: 5 per hour

### Security Headers (Helmet.js)
- **X-Content-Type-Options:** Prevents MIME type sniffing
- **Referrer Policy:** Strict origin-when-cross-origin
- **Hide Powered-By:** Removes X-Powered-By header
- **Cross-Origin Resource Policy:** Allows cross-origin resources
- **Frameguard:** Configured for cross-origin embedding

### CORS Configuration
- Origin-restricted CORS
- Credentials support
- Preflight request handling

### Input Validation
- Request body validation
- File type validation
- File size limits
- SQL injection prevention (MongoDB)
- XSS prevention

### Audit Logging
- Complete audit trail of all admin actions
- IP address tracking
- User agent logging
- Action metadata
- Retention policy support
- Logged actions:
  - Login/Logout
  - Password changes
  - Username changes
  - Profile image uploads/deletes
  - Resume uploads/deletes
  - Content CRUD operations (Projects, Skills, Certifications, etc.)

### File Upload Security
- File type whitelist
- File size limits
- Secure file storage
- Path traversal prevention
- Malware scanning considerations

## 📁 Project Structure

```
backend/
├── server/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── environment.js      # Environment configuration
│   │   └── auditRetention.js   # Audit log retention config
│   ├── controllers/             # Route controllers
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── projectController.js
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── csrf.js              # CSRF protection
│   │   ├── rateLimiters.js      # Rate limiting
│   │   ├── upload.js            # File upload config
│   │   └── uploadSecurity.js   # Upload security
│   ├── models/                  # Mongoose models
│   │   ├── Admin.js
│   │   ├── Profile.js
│   │   ├── Project.js
│   │   └── ...
│   ├── routes/                  # Express routes
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   └── ...
│   ├── scripts/                 # Utility scripts
│   │   ├── createAdmin.js
│   │   └── cleanupAuditLogs.js
│   ├── utils/
│   │   └── auditLogger.js      # Audit logging utility
│   ├── uploads/                 # Uploaded files
│   │   ├── profile/
│   │   ├── certificates/
│   │   └── resume/
│   └── server.js                 # Main server file
├── package.json
└── .env                          # Environment variables
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB database (local or cloud)
- Gmail account for email functionality (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/salman-mugloo/my-portfolio-backend.git
cd my-portfolio-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/portfolio

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Frontend
FRONTEND_URL=https://your-frontend-url.vercel.app

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Server
PORT=7002
NODE_ENV=production
```

4. Create admin user:
```bash
node server/scripts/createAdmin.js
```

5. Start development server:
```bash
npm run dev
```

6. Start production server:
```bash
npm start
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `EMAIL_HOST` | SMTP server host | Yes |
| `EMAIL_PORT` | SMTP server port | Yes |
| `EMAIL_USER` | Email username | Yes |
| `EMAIL_APP_PASSWORD` | Email app password | Yes |
| `EMAIL_FROM` | From email address | Yes |
| `PORT` | Server port (default: 7002) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `AUDIT_LOG_RETENTION_DAYS` | Audit log retention days (default: 90) | No |

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/verify-login-otp` - Verify OTP
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/csrf-token` - Get CSRF token

### Profile
- `GET /api/profile` - Get profile (public)
- `PUT /api/profile` - Update profile (admin)
- `POST /api/profile/image` - Upload profile image (admin)
- `DELETE /api/profile/image` - Delete profile image (admin)

### Projects
- `GET /api/projects` - Get active projects (public)
- `GET /api/projects/admin` - Get all projects (admin)
- `POST /api/projects/admin` - Create project (admin)
- `PUT /api/projects/admin/:id` - Update project (admin)
- `DELETE /api/projects/admin/:id` - Delete project (admin)

### Certifications
- `GET /api/certifications` - Get active certifications (public)
- `GET /api/certifications/admin` - Get all certifications (admin)
- `POST /api/certifications/admin` - Create certification (admin)
- `PUT /api/certifications/admin/:id` - Update certification (admin)
- `DELETE /api/certifications/admin/:id` - Delete certification (admin)

### Languages
- `GET /api/languages` - Get active languages (public)
- `GET /api/languages/admin` - Get all languages (admin)
- `POST /api/languages/admin` - Create language (admin)
- `PUT /api/languages/admin/:id` - Update language (admin)
- `DELETE /api/languages/admin/:id` - Delete language (admin)

### And more...
See route files for complete API documentation.

## 🚀 Deployment

The backend is deployed on **Railway** with automatic deployments from the main branch.

### Railway Configuration
- Runtime: Node.js
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables: Configured in Railway dashboard

## 📊 Database Models

- **Admin:** Admin user accounts
- **AdminActivity:** Audit log entries
- **Profile:** Portfolio profile information
- **Project:** Portfolio projects
- **Skill:** Technical skills
- **Expertise:** Technical expertise areas
- **Certification:** Certificates and achievements
- **Education:** Educational background
- **Language:** Language proficiencies
- **Resume:** Resume files
- **ContactInfo:** Contact information
- **Feature:** About section features

## 🔐 Security Best Practices

1. **Never commit `.env` files**
2. **Use strong JWT secrets**
3. **Enable HTTPS in production**
4. **Regularly update dependencies**
5. **Monitor audit logs**
6. **Use strong passwords**
7. **Enable rate limiting**
8. **Validate all inputs**
9. **Sanitize file uploads**
10. **Keep MongoDB secure**

## 📄 License

This project is private and proprietary.

## 👤 Author

**Salman Mugloo**
- GitHub: [@salman-mugloo](https://github.com/salman-mugloo)
- Portfolio: https://my-portfolio-frontend-i5nl.vercel.app/

---

**Note:** This is a production-ready API with enterprise-level security features. For frontend implementation, see the [frontend repository](https://github.com/salman-mugloo/my-portfolio-frontend).

