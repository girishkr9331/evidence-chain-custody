import express from 'express';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Get all audit logs
router.get('/', async (req, res) => {
  try {
    const { evidenceId, actor, action, limit = 1000 } = req.query;
    
    let filter = {};
    
    if (evidenceId) {
      filter.evidenceId = evidenceId;
    }
    
    if (actor) {
      filter.actor = actor.toLowerCase();
    }
    
    if (action) {
      filter.action = parseInt(action);
    }
    
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
      
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

// Get audit logs for specific evidence
router.get('/evidence/:evidenceId', async (req, res) => {
  try {
    const logs = await AuditLog.find({ 
      evidenceId: req.params.evidenceId 
    }).sort({ timestamp: -1 });
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching evidence audit logs:', error);
    res.status(500).json({ message: 'Failed to fetch evidence audit logs' });
  }
});

// Create audit log entry
router.post('/', async (req, res) => {
  try {
    const { 
      evidenceId, 
      action, 
      actor, 
      transferTo = '',
      timestamp, 
      notes = '', 
      previousHash = '', 
      newHash = '',
      blockchainTxHash = ''
    } = req.body;

    // Validate required fields
    if (!evidenceId || action === undefined || !actor || !timestamp) {
      return res.status(400).json({ 
        message: 'Missing required fields: evidenceId, action, actor, timestamp' 
      });
    }

    // Map action number to name
    const actionNames = ['COLLECTED', 'UPLOADED', 'ACCESSED', 'TRANSFERRED', 'ANALYZED', 'VERIFIED', 'MODIFIED'];
    const actionName = actionNames[action] || 'UNKNOWN';

    const auditLog = new AuditLog({
      evidenceId,
      action,
      actionName,
      actor: actor.toLowerCase(),
      transferTo: transferTo ? transferTo.toLowerCase() : '',
      timestamp,
      notes,
      previousHash,
      newHash,
      blockchainTxHash
    });

    await auditLog.save();
    
    res.status(201).json({ 
      message: 'Audit log created successfully',
      log: auditLog 
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ 
      message: 'Failed to create audit log',
      error: error.message 
    });
  }
});

// Bulk create audit logs (for syncing from blockchain)
router.post('/bulk', async (req, res) => {
  try {
    const { logs } = req.body;
    
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ message: 'Logs array is required' });
    }

    // Map action numbers to names
    const actionNames = ['COLLECTED', 'UPLOADED', 'ACCESSED', 'TRANSFERRED', 'ANALYZED', 'VERIFIED', 'MODIFIED'];
    
    const formattedLogs = logs.map(log => ({
      evidenceId: log.evidenceId,
      action: log.action,
      actionName: actionNames[log.action] || 'UNKNOWN',
      actor: log.actor.toLowerCase(),
      transferTo: log.transferTo ? log.transferTo.toLowerCase() : '',
      timestamp: log.timestamp,
      notes: log.notes || '',
      previousHash: log.previousHash || '',
      newHash: log.newHash || '',
      blockchainTxHash: log.blockchainTxHash || ''
    }));

    // Use insertMany with ordered: false to continue on duplicate key errors
    const result = await AuditLog.insertMany(formattedLogs, { 
      ordered: false 
    }).catch(err => {
      // Handle duplicate key errors gracefully
      if (err.code === 11000) {
        return { insertedCount: err.result.nInserted || 0 };
      }
      throw err;
    });

    res.status(201).json({ 
      message: 'Audit logs synced successfully',
      count: result.insertedCount || logs.length
    });
  } catch (error) {
    console.error('Error bulk creating audit logs:', error);
    res.status(500).json({ 
      message: 'Failed to bulk create audit logs',
      error: error.message 
    });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    const uniqueEvidence = await AuditLog.distinct('evidenceId');
    const uniqueActors = await AuditLog.distinct('actor');
    
    // Count by action type
    const actionCounts = await AuditLog.aggregate([
      {
        $group: {
          _id: '$actionName',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalLogs,
      uniqueEvidenceCount: uniqueEvidence.length,
      uniqueActorCount: uniqueActors.length,
      actionCounts
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({ message: 'Failed to fetch audit log stats' });
  }
});

export default router;
