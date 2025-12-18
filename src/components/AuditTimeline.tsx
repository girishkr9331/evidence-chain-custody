import { CheckCircle, ArrowRight, User, FileText, Shield, AlertTriangle } from 'lucide-react'

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

interface AuditTimelineProps {
  logs: AuditLog[]
  maxItems?: number
}

const AuditTimeline = ({ logs, maxItems }: AuditTimelineProps) => {
  const displayLogs = maxItems ? logs.slice(0, maxItems) : logs

  const getActionName = (action: number) => {
    const actions = ['COLLECTED', 'UPLOADED', 'ACCESSED', 'TRANSFERRED', 'ANALYZED', 'VERIFIED', 'MODIFIED']
    return actions[action] || 'UNKNOWN'
  }

  const getActionIcon = (action: number) => {
    switch (action) {
      case 0: return <FileText className="w-5 h-5 text-blue-600" />
      case 1: return <FileText className="w-5 h-5 text-green-600" />
      case 2: return <User className="w-5 h-5 text-yellow-600" />
      case 3: return <ArrowRight className="w-5 h-5 text-purple-600" />
      case 4: return <Shield className="w-5 h-5 text-orange-600" />
      case 5: return <CheckCircle className="w-5 h-5 text-green-600" />
      case 6: return <AlertTriangle className="w-5 h-5 text-red-600" />
      default: return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const getActionColor = (action: number) => {
    const colors = [
      'bg-blue-50 border-blue-200',
      'bg-green-50 border-green-200',
      'bg-yellow-50 border-yellow-200',
      'bg-purple-50 border-purple-200',
      'bg-orange-50 border-orange-200',
      'bg-green-50 border-green-200',
      'bg-red-50 border-red-200'
    ]
    return colors[action] || 'bg-gray-50 border-gray-200'
  }

  if (displayLogs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No audit logs available
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      {/* Timeline Items */}
      <div className="space-y-6">
        {displayLogs.map((log, index) => (
          <div key={index} className="relative flex gap-4">
            {/* Icon */}
            <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white rounded-full border-2 border-gray-300">
              {getActionIcon(log.action)}
            </div>

            {/* Content */}
            <div className={`flex-1 border rounded-lg p-4 ${getActionColor(log.action)}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {getActionName(log.action)}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(log.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Actor:</span>{' '}
                  <span className="font-mono text-gray-900">
                    {log.actor.slice(0, 6)}...{log.actor.slice(-4)}
                  </span>
                </div>

                {log.transferTo !== '0x0000000000000000000000000000000000000000' && (
                  <div>
                    <span className="font-medium text-gray-700">Transferred To:</span>{' '}
                    <span className="font-mono text-gray-900">
                      {log.transferTo.slice(0, 6)}...{log.transferTo.slice(-4)}
                    </span>
                  </div>
                )}

                {log.notes && (
                  <div>
                    <span className="font-medium text-gray-700">Notes:</span>{' '}
                    <span className="text-gray-900">{log.notes}</span>
                  </div>
                )}

                {log.previousHash && log.previousHash !== log.newHash && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <span className="font-medium text-gray-700">Hash Change:</span>
                    <div className="mt-1 space-y-1">
                      <div className="text-xs">
                        <span className="text-gray-600">Previous:</span>{' '}
                        <span className="font-mono">{log.previousHash.slice(0, 16)}...</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-600">New:</span>{' '}
                        <span className="font-mono">{log.newHash.slice(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AuditTimeline
