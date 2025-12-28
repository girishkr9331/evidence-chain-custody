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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-3 md:p-4 border border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm font-medium text-red-600 dark:text-red-400">Unresolved</p>
            <p className="text-xl md:text-2xl font-bold text-red-900 dark:text-red-300 mt-1">{stats.unresolved}</p>
          </div>
          <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-600 dark:text-red-400" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 md:p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400">Last 24 Hours</p>
            <p className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">{stats.last24Hours}</p>
          </div>
          <Clock className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 md:p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm font-medium text-purple-600 dark:text-purple-400">Last 7 Days</p>
            <p className="text-xl md:text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">{stats.last7Days}</p>
          </div>
          <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-purple-600 dark:text-purple-400" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 md:p-4 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm font-medium text-green-600 dark:text-green-400">Total Alerts</p>
            <p className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{stats.total}</p>
          </div>
          <Shield className="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400" />
        </div>
      </div>
    </div>
  )
}

export default AlertStats
