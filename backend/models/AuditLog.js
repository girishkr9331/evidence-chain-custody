import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5, 6], // COLLECTED, UPLOADED, ACCESSED, TRANSFERRED, ANALYZED, VERIFIED, MODIFIED
  },
  actionName: {
    type: String,
    enum: ['COLLECTED', 'UPLOADED', 'ACCESSED', 'TRANSFERRED', 'ANALYZED', 'VERIFIED', 'MODIFIED']
  },
  actor: {
    type: String,
    required: true,
    lowercase: true
  },
  transferTo: {
    type: String,
    default: '',
    lowercase: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  previousHash: {
    type: String,
    default: ''
  },
  newHash: {
    type: String,
    default: ''
  },
  blockchainTxHash: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
auditLogSchema.index({ evidenceId: 1, timestamp: -1 });
auditLogSchema.index({ actor: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
