import express from 'express';
import Evidence from '../models/Evidence.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all evidence (no auth required for reading) - with search support
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    // If search query is provided, search by evidenceId, fileName, or caseId
    if (search && search.trim()) {
      query = {
        $or: [
          { evidenceId: { $regex: search, $options: 'i' } },
          { fileName: { $regex: search, $options: 'i' } },
          { caseId: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const evidence = await Evidence.find(query).sort({ createdAt: -1 });
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
      currentCustodian: uploadedBy || 'unknown', // Set initial custodian to uploader
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

// Close case (Current custodian or Admin only)
router.patch('/:id/close', authMiddleware, async (req, res) => {
  try {
    const { closureReason } = req.body;
    const evidenceId = req.params.id;
    
    // Find the evidence
    let evidence = await Evidence.findOne({ evidenceId });
    
    if (!evidence) {
      return res.status(404).json({ 
        success: false,
        message: 'Evidence not found in database. Please ensure the evidence is synced to the database before closing the case.' 
      });
    }
    
    // Check if case is already closed
    if (evidence.caseStatus === 'CLOSED') {
      return res.status(400).json({ 
        success: false,
        message: 'Case is already closed' 
      });
    }
    
    // Check permissions: Must be current custodian or admin
    const userAddress = req.user.address.toLowerCase();
    const isAdmin = req.user.role === 'ADMIN';
    
    // If currentCustodian is null, fall back to uploadedBy (for legacy evidence)
    const effectiveCustodian = evidence.currentCustodian || evidence.uploadedBy;
    const isCustodian = effectiveCustodian?.toLowerCase() === userAddress;
    
    if (!isAdmin && !isCustodian) {
      return res.status(403).json({ 
        success: false,
        message: 'Only the current custodian or admin can close this case'
      });
    }
    
    // Update currentCustodian if it was null (fix legacy data)
    if (!evidence.currentCustodian && evidence.uploadedBy) {
      evidence.currentCustodian = evidence.uploadedBy;
    }
    
    // Close the case
    evidence.caseStatus = 'CLOSED';
    evidence.closedBy = req.user.address;
    evidence.closedAt = new Date();
    evidence.closureReason = closureReason || 'Case closed';
    
    await evidence.save();
    
    res.json({
      success: true,
      message: 'Case closed successfully',
      evidence: {
        evidenceId: evidence.evidenceId,
        caseId: evidence.caseId,
        caseStatus: evidence.caseStatus,
        closedBy: evidence.closedBy,
        closedAt: evidence.closedAt,
        closureReason: evidence.closureReason
      }
    });
  } catch (error) {
    console.error('Error closing case:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to close case',
      error: error.message 
    });
  }
});

// Reopen case (Admin only)
router.patch('/:id/reopen', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const evidenceId = req.params.id;
    
    const evidence = await Evidence.findOne({ evidenceId });
    
    if (!evidence) {
      return res.status(404).json({ 
        success: false,
        message: 'Evidence not found' 
      });
    }
    
    if (evidence.caseStatus === 'OPEN') {
      return res.status(400).json({ 
        success: false,
        message: 'Case is already open' 
      });
    }
    
    // Reopen the case
    evidence.caseStatus = 'OPEN';
    evidence.closedBy = null;
    evidence.closedAt = null;
    evidence.closureReason = null;
    
    await evidence.save();
    
    res.json({
      success: true,
      message: 'Case reopened successfully',
      evidence: {
        evidenceId: evidence.evidenceId,
        caseId: evidence.caseId,
        caseStatus: evidence.caseStatus
      }
    });
  } catch (error) {
    console.error('Error reopening case:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reopen case',
      error: error.message 
    });
  }
});

export default router;
