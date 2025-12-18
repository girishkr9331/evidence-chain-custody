import { useState, useEffect } from 'react'
import { useWeb3 } from '../context/Web3Context'

interface Alert {
  id: number
  evidenceId: string
  triggeredBy: string
  alertType: string
  message: string
  timestamp: number
  resolved: boolean
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const { contract, isConnected } = useWeb3()

  const loadAlerts = async () => {
    if (!contract || !isConnected) {
      setLoading(false)
      setAlerts([])
      return
    }

    try {
      const totalAlertsCount = await contract.totalAlerts()
      const alertsData: Alert[] = []

      for (let i = 0; i < Number(totalAlertsCount); i++) {
        try {
          const alert = await contract.getAlert(i)
          alertsData.push({
            id: i,
            evidenceId: alert.evidenceId,
            triggeredBy: alert.triggeredBy,
            alertType: alert.alertType,
            message: alert.message,
            timestamp: Number(alert.timestamp),
            resolved: alert.resolved
          })
        } catch (err) {
          console.error('Error loading alert:', i, err)
        }
      }

      alertsData.sort((a, b) => b.timestamp - a.timestamp)
      setAlerts(alertsData)
    } catch (error: any) {
      console.error('Error loading alerts:', error)
      // Don't log BAD_DATA errors - means contract not deployed or wrong network
      if (error.code !== 'BAD_DATA') {
        console.error('Unexpected error:', error)
      }
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
    
    // Poll for new alerts every 10 seconds
    const interval = setInterval(() => {
      if (contract && isConnected) {
        loadAlerts()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [contract, isConnected])

  const getUnresolvedCount = () => alerts.filter(a => !a.resolved).length

  return {
    alerts,
    loading,
    unresolvedCount: getUnresolvedCount(),
    refetch: loadAlerts
  }
}
