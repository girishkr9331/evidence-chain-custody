import { useEffect, useState } from 'react'
import { AlertTriangle, Shield, Clock, TrendingUp } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'
import { AlertService } from '../services/alertService'

const AlertStats = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { contract, isConnected } = useWeb3()

  useEffect(() => {
    loadStats()
  }, [contract, isConnected])

  const loadStats = async () => {
    if (!contract || !isConnected) {
      setLoading(false)
      return
    }

    try {
      const alertService = new AlertService(contract)
      const statistics = await alertService.getAlertStatistics()
      setStats(statistics)
    } catch (error) {
      console.error('Error loading alert statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-600">Unresolved</p>
            <p className="text-2xl font-bold text-red-900 mt-1">{stats.unresolved}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Last 24 Hours</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.last24Hours}</p>
          </div>
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">Last 7 Days</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{stats.last7Days}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Total Alerts</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{stats.total}</p>
          </div>
          <Shield className="w-8 h-8 text-green-600" />
        </div>
      </div>
    </div>
  )
}

export default AlertStats
