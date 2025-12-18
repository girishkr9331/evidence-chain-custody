import mongoose from 'mongoose';

const evidenceArchiveSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'UNDER_REVIEW', 'EXPIRED'],
    default: 'ACTIVE'
  },
  archivedBy: {
    type: String,
    default: null
  },
  archivedAt: {
    type: Date,
    default: null
  },
  archiveReason: {
    type: String,
    default: ''
  },
  retentionUntil: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('EvidenceArchive', evidenceArchiveSchema);
