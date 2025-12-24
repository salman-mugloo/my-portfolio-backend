import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  fileUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Resume'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

resumeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Resume', resumeSchema);

