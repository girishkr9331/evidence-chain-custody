import express from 'express';
import Alert from '../models/Alert.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all alerts with optional filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { filter, evidenceId, startDate, endDate } = req.query
    
    let query = {}
    
    // Apply filters
    if (filter === 'RESOLVED') {
      query.resolved = true
    } else if (filter === 'UNRESOLVED') {
      query.resolved = false
    }
    
    if (evidenceId) {
      query.evidenceId = evidenceId
    }
    
    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) query.timestamp.$gte = parseInt(startDate)
      if (endDate) query.timestamp.$lte = parseInt(endDate)
    }
    
    const alerts = await Alert.find(query).sort({ timestamp: -1 })
    
    res.json({
      success: true,
      alerts,
      count: alerts.length
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    })
  }
})

// Get alert statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000)
    const last24Hours = now - 86400
    const last7Days = now - 604800
    
    const [
      total,
      unresolved,
      resolved,
      last24HoursCount,
      last7DaysCount,
      byType
    ] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ resolved: false }),
      Alert.countDocuments({ resolved: true }),
      Alert.countDocuments({ timestamp: { $gte: last24Hours } }),
      Alert.countDocuments({ timestamp: { $gte: last7Days } }),
      Alert.aggregate([
        {
          $group: {
            _id: '$alertType',
            count: { $sum: 1 }
          }
        }
      ])
    ])
    
    const typeStats = {
      UNAUTHORIZED_ACCESS: 0,
      TAMPERING_DETECTED: 0,
      SUSPICIOUS_ACTIVITY: 0,
      OTHER: 0
    }
    
    byType.forEach(item => {
      typeStats[item._id] = item.count
    })
    
    res.json({
      success: true,
      stats: {
        total,
        unresolved,
        resolved,
        last24Hours: last24HoursCount,
        last7Days: last7DaysCount,
        byType: typeStats
      }
    })
  } catch (error) {
    console.error('Error fetching alert statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert statistics',
      error: error.message
    })
  }
})

// Get a specific alert
router.get('/:alertId', authMiddleware, async (req, res) => {
  try {
    const alert = await Alert.findOne({ alertId: parseInt(req.params.alertId) })
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      })
    }
    
    res.json({
      success: true,
      alert
    })
  } catch (error) {
    console.error('Error fetching alert:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert',
      error: error.message
    })
  }
})

// Create or sync alert from blockchain
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { alertId, evidenceId, triggeredBy, alertType, message, timestamp, resolved } = req.body
    
    // Check if alert already exists
    let alert = await Alert.findOne({ alertId })
    
    if (alert) {
      // Update existing alert
      alert.evidenceId = evidenceId
      alert.triggeredBy = triggeredBy
      alert.alertType = alertType
      alert.message = message
      alert.timestamp = timestamp
      alert.resolved = resolved
      alert.blockchainSynced = true
      await alert.save()
    } else {
      // Create new alert
      alert = await Alert.create({
        alertId,
        evidenceId,
        triggeredBy,
        alertType,
        message,
        timestamp,
        resolved,
        blockchainSynced: true
      })
    }
    
    res.json({
      success: true,
      message: 'Alert synced successfully',
      alert
    })
  } catch (error) {
    console.error('Error syncing alert:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to sync alert',
      error: error.message
    })
  }
})

// Bulk sync alerts from blockchain
router.post('/sync/bulk', authMiddleware, async (req, res) => {
  try {
    const { alerts } = req.body
    
    if (!Array.isArray(alerts)) {
      return res.status(400).json({
        success: false,
        message: 'alerts must be an array'
      })
    }
    
    const results = await Promise.allSettled(
      alerts.map(async (alertData) => {
        const { alertId, evidenceId, triggeredBy, alertType, message, timestamp, resolved } = alertData
        
        return await Alert.findOneAndUpdate(
          { alertId },
          {
            evidenceId,
            triggeredBy,
            alertType,
            message,
            timestamp,
            resolved,
            blockchainSynced: true
          },
          { upsert: true, new: true }
        )
      })
    )
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    res.json({
      success: true,
      message: `Synced ${succeeded} alerts, ${failed} failed`,
      synced: succeeded,
      failed
    })
  } catch (error) {
    console.error('Error bulk syncing alerts:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to bulk sync alerts',
      error: error.message
    })
  }
})

// Mark alert as resolved (ADMIN only)
router.patch('/:alertId/resolve', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { resolvedBy } = req.body
    const alertId = parseInt(req.params.alertId)
    
    const alert = await Alert.findOne({ alertId })
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      })
    }
    
    if (alert.resolved) {
      return res.status(400).json({
        success: false,
        message: 'Alert is already resolved'
      })
    }
    
    alert.resolved = true
    alert.resolvedBy = resolvedBy || req.user.address
    alert.resolvedAt = Math.floor(Date.now() / 1000)
    await alert.save()
    
    res.json({
      success: true,
      message: 'Alert resolved successfully',
      alert
    })
  } catch (error) {
    console.error('Error resolving alert:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error.message
    })
  }
})

// Delete alert (ADMIN only)
router.delete('/:alertId', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const alertId = parseInt(req.params.alertId)
    const alert = await Alert.findOneAndDelete({ alertId })
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Alert deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting alert:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
      error: error.message
    })
  }
})

export default router;
