import express from 'express';
import EvidenceArchive from '../models/EvidenceArchive.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get archive status for evidence
router.get('/evidence/:evidenceId', authMiddleware, async (req, res) => {
  try {
    const archive = await EvidenceArchive.findOne({ evidenceId: req.params.evidenceId });
    if (!archive) {
      return res.json({ status: 'ACTIVE' });
    }
    res.json(archive);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update archive status
router.post('/evidence/:evidenceId', authMiddleware, async (req, res) => {
  try {
    const { status, reason, retentionUntil, notes } = req.body;
    
    let archive = await EvidenceArchive.findOne({ evidenceId: req.params.evidenceId });
    
    if (archive) {
      archive.status = status;
      archive.archivedBy = req.user.address;
      archive.archivedAt = new Date();
      archive.archiveReason = reason || '';
      archive.retentionUntil = retentionUntil || null;
      archive.notes = notes || '';
    } else {
      archive = new EvidenceArchive({
        evidenceId: req.params.evidenceId,
        status,
        archivedBy: req.user.address,
        archivedAt: new Date(),
        archiveReason: reason || '',
        retentionUntil: retentionUntil || null,
        notes: notes || ''
      });
    }
    
    await archive.save();
    res.json({ message: 'Archive status updated', archive });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all archived evidence
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const archives = await EvidenceArchive.find(query).sort({ archivedAt: -1 });
    res.json(archives);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
