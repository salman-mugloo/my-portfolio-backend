import mongoose from 'mongoose';

const adminActivitySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true // Index for faster queries
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN_SUCCESS',
      'OTP_VERIFICATION_SUCCESS',
      'OTP_VERIFICATION_FAILURE',
      'PASSWORD_CHANGE',
      'USERNAME_CHANGE',
      'LOGOUT',
      'PROFILE_IMAGE_UPLOAD',
      'PROFILE_IMAGE_DELETE',
      'RESUME_UPLOAD',
      'RESUME_DELETE'
    ],
    index: true // Index for faster queries
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // Index for time-based queries
  }
}, {
  timestamps: false // We use createdAt instead
});

// Compound index for efficient queries
adminActivitySchema.index({ adminId: 1, createdAt: -1 });
adminActivitySchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AdminActivity', adminActivitySchema);

