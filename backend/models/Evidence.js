import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    required: true,
    unique: true
  },
  caseId: {
    type: String,
    required: true
  },
  fileHash: {
    type: String,
    required: true
  },
  fileName: String,
  fileSize: Number,
  fileType: String,
  category: {
    type: String,
    enum: ['MOBILE_DUMP', 'CCTV_FOOTAGE', 'DIGITAL_DOCUMENT', 'NETWORK_LOG', 'FORENSIC_IMAGE', 'OTHER'],
    required: true
  },
  description: String,
  uploadedBy: {
    type: String,
    required: true
  },
  blockchainTxHash: String,
  ipfsHash: String,
  metadata: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Evidence', evidenceSchema);
