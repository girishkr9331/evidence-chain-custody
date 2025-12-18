import { Contract } from 'ethers'

export class AlertService {
  private contract: Contract

  constructor(contract: Contract) {
    this.contract = contract
  }

  // Monitor evidence integrity
  async checkEvidenceIntegrity(evidenceId: string, currentHash: string): Promise<boolean> {
    try {
      const isValid = await this.contract.verifyEvidenceIntegrity(evidenceId, currentHash)
      
      if (!isValid) {
        // This will trigger an alert in the smart contract
        console.warn(`Integrity check failed for evidence: ${evidenceId}`)
      }
      
      return isValid
    } catch (error) {
      console.error('Error checking evidence integrity:', error)
      return false
    }
  }

  // Detect suspicious activity patterns
  async detectSuspiciousActivity(evidenceId: string): Promise<{
    suspicious: boolean
    reason?: string
  }> {
    try {
      const auditTrail = await this.contract.getAuditTrail(evidenceId)
      
      // Check for rapid access attempts
      if (auditTrail.length >= 2) {
        const recentLogs = auditTrail.slice(-5)
        const timeWindow = 300 // 5 minutes in seconds
        
        let rapidAccessCount = 0
        for (let i = 1; i < recentLogs.length; i++) {
          const timeDiff = Number(recentLogs[i].timestamp) - Number(recentLogs[i - 1].timestamp)
          if (timeDiff < timeWindow) {
            rapidAccessCount++
          }
        }
        
        if (rapidAccessCount >= 3) {
          return {
            suspicious: true,
            reason: 'Rapid consecutive access attempts detected'
          }
        }
      }
      
      // Check for multiple modification attempts
      const modifications = auditTrail.filter((log: any) => Number(log.action) === 6)
      if (modifications.length >= 3) {
        return {
          suspicious: true,
          reason: 'Multiple modification attempts detected'
        }
      }
      
      return { suspicious: false }
    } catch (error) {
      console.error('Error detecting suspicious activity:', error)
      return { suspicious: false }
    }
  }

  // Get alert statistics
  async getAlertStatistics() {
    try {
      const totalAlerts = await this.contract.totalAlerts()
      const alerts = []
      
      for (let i = 0; i < Number(totalAlerts); i++) {
        const alert = await this.contract.getAlert(i)
        alerts.push(alert)
      }
      
      const now = Math.floor(Date.now() / 1000)
      const last24Hours = now - 86400
      const last7Days = now - 604800
      
      return {
        total: alerts.length,
        unresolved: alerts.filter((a: any) => !a.resolved).length,
        last24Hours: alerts.filter((a: any) => Number(a.timestamp) > last24Hours).length,
        last7Days: alerts.filter((a: any) => Number(a.timestamp) > last7Days).length,
        byType: {
          unauthorized: alerts.filter((a: any) => a.alertType === 'UNAUTHORIZED_ACCESS').length,
          tampering: alerts.filter((a: any) => a.alertType === 'TAMPERING_DETECTED').length,
          suspicious: alerts.filter((a: any) => a.alertType === 'SUSPICIOUS_ACTIVITY').length
        }
      }
    } catch (error) {
      console.error('Error getting alert statistics:', error)
      return null
    }
  }
}
