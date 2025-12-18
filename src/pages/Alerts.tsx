import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import toast from 'react-hot-toast'
import AlertStats from '../components/AlertStats'

interface Alert {
  id: number
  evidenceId: string
  triggeredBy: string
  alertType: string
  message: string
  timestamp: number
  resolved: boolean
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState<'ALL' | 'RESOLVED' | 'UNRESOLVED'>('ALL')
  const [loading, setLoading] = useState(true)
  const { contract, isConnected } = useWeb3()

  useEffect(() => {
    loadAlerts()
  }, [contract, isConnected])

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

      // Sort by timestamp (newest first)
      alertsData.sort((a, b) => b.timestamp - a.timestamp)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error loading alerts:', error)
      // Only show error if we actually tried to load and failed
      // Don't show error on initial load when wallet isn't connected
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const handleResolveAlert = async (alertId: number) => {
    if (!contract) return

    let toastId: string | undefined

    try {
      toastId = toast.loading('Resolving alert...')
      
      const tx = await contract.resolveAlert(alertId)
      await tx.wait()
      
      toast.dismiss(toastId)
      toast.success('Alert resolved successfully!')
      loadAlerts()
    } catch (error: any) {
      if (toastId) {
        toast.dismiss(toastId)
      }
      toast.error(error.reason || 'Failed to resolve alert')
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'RESOLVED') return alert.resolved
    if (filter === 'UNRESOLVED') return !alert.resolved
    return true
  })

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'UNAUTHORIZED_ACCESS':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'TAMPERING_DETECTED':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'SUSPICIOUS_ACTIVITY':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      default:
        return 'bg-orange-50 border-orange-200 text-orange-900'
    }
  }

  const getAlertIcon = (alertType: string, resolved: boolean) => {
    if (resolved) return <CheckCircle className="w-5 h-5 text-green-600" />
    
    switch (alertType) {
      case 'UNAUTHORIZED_ACCESS':
      case 'TAMPERING_DETECTED':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    }
  }

  const stats = {
    total: alerts.length,
    unresolved: alerts.filter(a => !a.resolved).length,
    resolved: alerts.filter(a => a.resolved).length
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Alerts</h1>
          <p className="text-gray-600 mt-1">
            Monitor unauthorized access attempts and security events
          </p>
        </div>

        {/* Advanced Stats */}
        {isConnected && <AlertStats />}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unresolved</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.unresolved}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex gap-2">
              {(['ALL', 'UNRESOLVED', 'RESOLVED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {!isConnected ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Wallet Not Connected
            </h3>
            <p className="text-gray-600">
              Please connect your wallet to view security alerts
            </p>
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border p-6 ${
                  alert.resolved ? 'bg-gray-50 border-gray-200' : getAlertColor(alert.alertType)
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getAlertIcon(alert.alertType, alert.resolved)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {alert.alertType.replace(/_/g, ' ')}
                        </h3>
                        {alert.resolved && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            RESOLVED
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm mb-3">{alert.message}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Evidence ID:</span>{' '}
                          <span className="font-mono">{alert.evidenceId}</span>
                        </div>
                        <div>
                          <span className="font-medium">Triggered By:</span>{' '}
                          <span className="font-mono">
                            {alert.triggeredBy.slice(0, 6)}...{alert.triggeredBy.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(alert.timestamp * 1000).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'ALL' ? 'No alerts' : `No ${filter.toLowerCase()} alerts`}
            </h3>
            <p className="text-gray-600">
              {filter === 'ALL'
                ? 'Your system is secure with no security alerts'
                : `There are no ${filter.toLowerCase()} alerts at this time`}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Alert Types:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>UNAUTHORIZED_ACCESS:</strong> Someone attempted to access evidence without permission</li>
            <li>• <strong>TAMPERING_DETECTED:</strong> Evidence integrity verification failed</li>
            <li>• <strong>SUSPICIOUS_ACTIVITY:</strong> Unusual patterns detected in evidence handling</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

export default Alerts
