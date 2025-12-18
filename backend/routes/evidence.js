import express from 'express';
import Evidence from '../models/Evidence.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all evidence (no auth required for reading)
router.get('/', async (req, res) => {
  try {
    const evidence = await Evidence.find().sort({ createdAt: -1 });
    res.json(evidence);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get evidence by ID (no auth required for reading)
router.get('/:id', async (req, res) => {
  try {
    const evidence = await Evidence.findOne({ evidenceId: req.params.id });
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }
    res.json(evidence);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create evidence record (after blockchain registration) (no auth required)
router.post('/', async (req, res) => {
  try {
    const { 
      evidenceId, 
      caseId, 
      fileHash, 
      fileName, 
      fileSize, 
      fileType, 
      category, 
      description,
      blockchainTxHash,
      ipfsHash,
      metadata,
      uploadedBy
    } = req.body;

    const evidence = new Evidence({
      evidenceId,
      caseId,
      fileHash,
      fileName,
      fileSize,
      fileType,
      category,
      description,
      uploadedBy: uploadedBy || 'unknown',
      blockchainTxHash,
      ipfsHash,
      metadata
    });

    await evidence.save();
    res.status(201).json(evidence);
  } catch (error) {
    console.error('Error creating evidence record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search evidence
router.get('/search', async (req, res) => {
  try {
    const { query, category, caseId } = req.query;
    let filter = {};

    if (query) {
      filter.$or = [
        { evidenceId: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (caseId) {
      filter.caseId = caseId;
    }

    const evidence = await Evidence.find(filter).sort({ createdAt: -1 });
    res.json(evidence);
  } catch (error) {
    console.error('Error searching evidence:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
