import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  tooltip: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    enum: ['Code', 'ShieldCheck', 'Activity', 'Users'],
    default: 'Code'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Feature', featureSchema);

