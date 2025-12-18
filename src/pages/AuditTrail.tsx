import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, Search, Download, Filter, BarChart3 } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import toast from 'react-hot-toast'
import axios from '../config/api'
import AuditTimeline from '../components/AuditTimeline'

interface AuditLog {
  evidenceId: string
  action: number
  actor: string
  transferTo: string
  timestamp: number
  notes: string
  previousHash: string
  newHash: string
}

const AuditTrail = () => {
  const [searchParams] = useSearchParams()
  const evidenceFilter = searchParams.get('evidence')
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [searchTerm, setSearchTerm] = useState(evidenceFilter || '')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')
  const { contract, isConnected } = useWeb3()

  useEffect(() => {
    loadAuditTrail()
  }, [contract, isConnected])
  
  // Load from database immediately on mount, don't wait for wallet
  useEffect(() => {
    loadAuditTrail()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [searchTerm, actionFilter, auditLogs])

  const loadAuditTrail = async () => {
    try {
      console.log('Loading audit logs from database...')
      
      // Try loading from database first (persistent storage)
      try {
        const response = await axios.get('/api/audit-logs')
        const dbLogs = response.data
        
        console.log(`✅ Loaded ${dbLogs.length} audit logs from database`)
        
        const formattedLogs: AuditLog[] = dbLogs.map((log: any) => ({
          evidenceId: log.evidenceId,
          action: Number(log.action),
          actor: log.actor,
          transferTo: log.transferTo || '',
          timestamp: Number(log.timestamp),
          notes: log.notes || '',
          previousHash: log.previousHash || '',
          newHash: log.newHash || ''
        }))
        
        // Sort by timestamp (newest first)
        formattedLogs.sort((a, b) => b.timestamp - a.timestamp)
        
        setAuditLogs(formattedLogs)
        setFilteredLogs(formattedLogs)
        setLoading(false)
        return
      } catch (dbError) {
        console.warn('Could not load from database, trying blockchain...', dbError)
      }
      
      // Fallback to blockchain if database fails and wallet is connected
      if (!contract || !isConnected) {
        console.log('No blockchain connection, showing empty logs')
        setLoading(false)
        setAuditLogs([])
        setFilteredLogs([])
        return
      }

      console.log('Loading all evidence IDs from blockchain...')
      const evidenceIdsList = await contract.getAllEvidenceIds()
      console.log('Evidence IDs found:', evidenceIdsList)
      console.log('Total evidence count:', evidenceIdsList.length)
      
      const allLogs: AuditLog[] = []
      
      for (const id of evidenceIdsList) {
        try {
          console.log(`Loading audit trail for evidence: ${id}`)
          const logs = await contract.getAuditTrail(id)
          console.log(`Found ${logs.length} audit logs for ${id}`)
          
          logs.forEach((log: any) => {
            allLogs.push({
              evidenceId: id,
              action: Number(log.action),
              actor: log.actor,
              transferTo: log.transferTo,
              timestamp: Number(log.timestamp),
              notes: log.notes,
              previousHash: log.previousHash,
              newHash: log.newHash
            })
          })
        } catch (err) {
          console.error('Error loading audit trail for evidence:', id, err)
        }
      }

      console.log('Total audit logs loaded from blockchain:', allLogs.length)
      
      // Sort by timestamp (newest first)
      allLogs.sort((a, b) => b.timestamp - a.timestamp)
      
      setAuditLogs(allLogs)
      setFilteredLogs(allLogs)
    } catch (error) {
      console.error('Error loading audit trail:', error)
      setAuditLogs([])
      setFilteredLogs([])
    } finally {
      setLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = [...auditLogs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.evidenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.notes.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Action filter
    if (actionFilter !== 'ALL') {
      const actionMap: { [key: string]: number } = {
        'COLLECTED': 0,
        'UPLOADED': 1,
        'ACCESSED': 2,
        'TRANSFERRED': 3,
        'ANALYZED': 4,
        'VERIFIED': 5,
        'MODIFIED': 6
      }
      filtered = filtered.filter((log) => log.action === actionMap[actionFilter])
    }

    setFilteredLogs(filtered)
  }

  const getActionName = (action: number) => {
    const actions = ['COLLECTED', 'UPLOADED', 'ACCESSED', 'TRANSFERRED', 'ANALYZED', 'VERIFIED', 'MODIFIED']
    return actions[action] || 'UNKNOWN'
  }

  const getActionColor = (action: number) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-cyan-100 text-cyan-700',
      'bg-red-100 text-red-700'
    ]
    return colors[action] || 'bg-gray-100 text-gray-700'
  }

  const exportToCSV = () => {
    const headers = ['Evidence ID', 'Action', 'Actor', 'Timestamp', 'Notes']
    const rows = filteredLogs.map(log => [
      log.evidenceId,
      getActionName(log.action),
      log.actor,
      new Date(log.timestamp * 1000).toISOString(),
      log.notes
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-trail-${Date.now()}.csv`
    a.click()
    
    toast.success('Audit trail exported successfully!')
  }

  const actions = [
    { value: 'ALL', label: 'All Actions' },
    { value: 'COLLECTED', label: 'Collected' },
    { value: 'UPLOADED', label: 'Uploaded' },
    { value: 'ACCESSED', label: 'Accessed' },
    { value: 'TRANSFERRED', label: 'Transferred' },
    { value: 'ANALYZED', label: 'Analyzed' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'MODIFIED', label: 'Modified' }
  ]

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-600 mt-1">
              Complete immutable record of all evidence actions
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters & Options</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Timeline View
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Evidence ID, Actor, or Notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                {actions.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              Showing <span className="font-medium">{filteredLogs.length}</span> of{' '}
              <span className="font-medium">{auditLogs.length}</span> audit logs
            </p>
          </div>
        </div>

        {/* Audit Trail Display */}
        {!isConnected ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Wallet Not Connected
            </h3>
            <p className="text-gray-600">
              Please connect your wallet to view audit trail
            </p>
          </div>
        ) : filteredLogs.length > 0 ? (
          viewMode === 'timeline' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <AuditTimeline logs={filteredLogs} />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evidence ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp * 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.evidenceId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                          {getActionName(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {log.actor.slice(0, 6)}...{log.actor.slice(-4)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {log.notes || 'No notes'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No audit logs found
            </h3>
            <p className="text-gray-600">
              {searchTerm || actionFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Audit logs will appear here as evidence actions are recorded'}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">About Audit Trail:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Every action on evidence is immutably recorded on the blockchain</li>
            <li>• Audit logs cannot be modified or deleted</li>
            <li>• Timestamps are based on blockchain block time</li>
            <li>• Complete transparency for all stakeholders</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

export default AuditTrail
