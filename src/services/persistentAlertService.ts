import axios from 'axios'
import { API_BASE_URL } from '../config/api'

// Note: API_BASE_URL is now exported from config/api.ts

export interface Alert {
  id: number
  evidenceId: string
  triggeredBy: string
  alertType: string
  message: string
  timestamp: number
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: number
}

class PersistentAlertService {
  private baseURL = `${API_BASE_URL}/alerts`

  // Get authentication token
  private getAuthToken(): string | null {
    return localStorage.getItem('token')
  }

  // Get authorization header
  private getAuthHeaders() {
    const token = this.getAuthToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Fetch all alerts from backend
  async fetchAlerts(filter?: 'ALL' | 'RESOLVED' | 'UNRESOLVED'): Promise<Alert[]> {
    try {
      const params: any = {}
      if (filter && filter !== 'ALL') {
        params.filter = filter
      }

      const response = await axios.get(this.baseURL, {
        params,
        headers: this.getAuthHeaders()
      })

      if (response.data.success) {
        return response.data.alerts.map((alert: any) => ({
          id: alert.alertId,
          evidenceId: alert.evidenceId,
          triggeredBy: alert.triggeredBy,
          alertType: alert.alertType,
          message: alert.message,
          timestamp: alert.timestamp,
          resolved: alert.resolved,
          resolvedBy: alert.resolvedBy,
          resolvedAt: alert.resolvedAt
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching alerts from backend:', error)
      return []
    }
  }

  // Sync a single alert from blockchain to backend
  async syncAlert(alert: Alert): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseURL}/sync`,
        {
          alertId: alert.id,
          evidenceId: alert.evidenceId,
          triggeredBy: alert.triggeredBy,
          alertType: alert.alertType,
          message: alert.message,
          timestamp: alert.timestamp,
          resolved: alert.resolved
        },
        {
          headers: this.getAuthHeaders()
        }
      )

      return response.data.success
    } catch (error) {
      console.error('Error syncing alert:', error)
      return false
    }
  }

  // Bulk sync alerts from blockchain to backend
  async syncAlerts(alerts: Alert[]): Promise<{ synced: number; failed: number }> {
    try {
      const alertsData = alerts.map(alert => ({
        alertId: alert.id,
        evidenceId: alert.evidenceId,
        triggeredBy: alert.triggeredBy,
        alertType: alert.alertType,
        message: alert.message,
        timestamp: alert.timestamp,
        resolved: alert.resolved
      }))

      const response = await axios.post(
        `${this.baseURL}/sync/bulk`,
        { alerts: alertsData },
        {
          headers: this.getAuthHeaders()
        }
      )

      if (response.data.success) {
        return {
          synced: response.data.synced,
          failed: response.data.failed
        }
      }
      return { synced: 0, failed: alerts.length }
    } catch (error) {
      console.error('Error bulk syncing alerts:', error)
      return { synced: 0, failed: alerts.length }
    }
  }

  // Mark alert as resolved in backend
  async resolveAlert(alertId: number, resolvedBy: string): Promise<boolean> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/${alertId}/resolve`,
        { resolvedBy },
        {
          headers: this.getAuthHeaders()
        }
      )

      return response.data.success
    } catch (error) {
      console.error('Error resolving alert in backend:', error)
      return false
    }
  }

  // Get alert statistics from backend
  async getStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/stats`, {
        headers: this.getAuthHeaders()
      })

      if (response.data.success) {
        return response.data.stats
      }
      return null
    } catch (error) {
      console.error('Error fetching alert stats:', error)
      return null
    }
  }

  // Save filter preference to localStorage
  saveFilterPreference(filter: 'ALL' | 'RESOLVED' | 'UNRESOLVED'): void {
    localStorage.setItem('alertsFilterPreference', filter)
  }

  // Get filter preference from localStorage
  getFilterPreference(): 'ALL' | 'RESOLVED' | 'UNRESOLVED' {
    const saved = localStorage.getItem('alertsFilterPreference')
    return (saved as 'ALL' | 'RESOLVED' | 'UNRESOLVED') || 'ALL'
  }

  // Check if backend is available
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`)
      return response.data.status === 'ok'
    } catch (error) {
      return false
    }
  }
}

export const persistentAlertService = new PersistentAlertService()
