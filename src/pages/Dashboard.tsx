import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  FolderOpen, 
  Upload, 
  FileText, 
  Bell, 
  TrendingUp,
  Users,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const Dashboard = () => {
  const { contract, isConnected } = useWeb3()
  const [stats, setStats] = useState({
    totalEvidence: 0,
    totalAuditLogs: 0,
    totalAlerts: 0,
    unresolvedAlerts: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [contract, isConnected])

  const loadDashboardData = async () => {
    if (!contract) {
      setLoading(false)
      return
    }

    try {
      const totalEvidence = await contract.totalEvidence()
      const totalAuditLogs = await contract.totalAuditLogs()
      const totalAlerts = await contract.totalAlerts()

      setStats({
        totalEvidence: Number(totalEvidence),
        totalAuditLogs: Number(totalAuditLogs),
        totalAlerts: Number(totalAlerts),
        unresolvedAlerts: Math.floor(Math.random() * 5) // Placeholder
      })

      // Load recent activity (last 5 evidence IDs)
      const evidenceIds = await contract.getAllEvidenceIds()
      const recent = evidenceIds.slice(-5).reverse()
      
      const activities = await Promise.all(
        recent.map(async (id: string) => {
          const evidence = await contract.getEvidence(id)
          return {
            id,
            action: 'Evidence Registered',
            timestamp: new Date(Number(evidence.createdAt) * 1000).toLocaleString()
          }
        })
      )

      setRecentActivity(activities)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Evidence',
      value: stats.totalEvidence,
      icon: FolderOpen,
      color: 'bg-blue-500',
      trend: '+12%'
    },
    {
      title: 'Audit Logs',
      value: stats.totalAuditLogs,
      icon: FileText,
      color: 'bg-green-500',
      trend: '+8%'
    },
    {
      title: 'Total Alerts',
      value: stats.totalAlerts,
      icon: Bell,
      color: 'bg-yellow-500',
      trend: '+3%'
    },
    {
      title: 'Unresolved Alerts',
      value: stats.unresolvedAlerts,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-2%'
    }
  ]

  const activityData = [
    { name: 'Mon', evidence: 4 },
    { name: 'Tue', evidence: 7 },
    { name: 'Wed', evidence: 5 },
    { name: 'Thu', evidence: 9 },
    { name: 'Fri', evidence: 6 },
    { name: 'Sat', evidence: 3 },
    { name: 'Sun', evidence: 2 }
  ]

  const roleDistribution = [
    { name: 'Police', value: 35 },
    { name: 'Investigators', value: 25 },
    { name: 'Forensic Labs', value: 20 },
    { name: 'Courts', value: 15 },
    { name: 'Cyber Units', value: 5 }
  ]

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to Evidence Chain of Custody Platform</p>
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              Please connect your wallet to access blockchain features.
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Evidence Activity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="evidence" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Role Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Link to="/audit-trail" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.action} - {activity.id}
                      </p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">No recent activity</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/evidence/upload"
                className="flex items-center gap-3 p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="font-medium">Upload Evidence</span>
              </Link>
              <Link
                to="/evidence/list"
                className="flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FolderOpen className="w-5 h-5" />
                <span className="font-medium">View Evidence</span>
              </Link>
              <Link
                to="/users"
                className="flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Manage Users</span>
              </Link>
              <Link
                to="/alerts"
                className="flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="font-medium">View Alerts</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard
