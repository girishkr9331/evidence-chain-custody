import mongoose from 'mongoose';

const evidenceCommentSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    required: true,
    index: true
  },
  author: {
    type: String,  // User address
    required: true,
    lowercase: true
  },
  authorName: {
    type: String,  // Cached user name for display
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  taggedEvidences: [{
    evidenceId: {
      type: String,
      required: true
    },
    fileName: String,  // Cached for display
    caseId: String     // Cached for display
  }],
  taggedUsers: [{
    address: {
      type: String,
      required: true,
      lowercase: true
    },
    name: String  // Cached for display
  }],
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,  // For threaded replies
    ref: 'EvidenceComment',
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

// Indexes for performance
evidenceCommentSchema.index({ evidenceId: 1, createdAt: -1 });
evidenceCommentSchema.index({ author: 1 });
evidenceCommentSchema.index({ 'taggedUsers.address': 1 });
evidenceCommentSchema.index({ 'taggedEvidences.evidenceId': 1 });

export default mongoose.model('EvidenceComment', evidenceCommentSchema);
