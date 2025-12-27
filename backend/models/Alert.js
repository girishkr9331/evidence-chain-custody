import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  alertId: {
    type: Number,
    required: true,
    unique: true
  },
  evidenceId: {
    type: String,
    required: true,
    index: true
  },
  triggeredBy: {
    type: String,
    required: true
  },
  alertType: {
    type: String,
    required: true,
    enum: ['UNAUTHORIZED_ACCESS', 'TAMPERING_DETECTED', 'SUSPICIOUS_ACTIVITY', 'OTHER']
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: String,
    default: null
  },
  resolvedAt: {
    type: Number,
    default: null
  },
  blockchainSynced: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for faster queries
alertSchema.index({ timestamp: -1 })
alertSchema.index({ resolved: 1 })
alertSchema.index({ alertType: 1 })

export default mongoose.model('Alert', alertSchema);
