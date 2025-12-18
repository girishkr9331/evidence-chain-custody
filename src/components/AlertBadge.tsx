import { useAlerts } from '../hooks/useAlerts'
import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

const AlertBadge = () => {
  const { unresolvedCount } = useAlerts()

  if (unresolvedCount === 0) return null

  return (
    <Link
      to="/alerts"
      className="relative inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
      title={`${unresolvedCount} unresolved alert${unresolvedCount > 1 ? 's' : ''}`}
    >
      <AlertTriangle className="w-5 h-5 text-orange-600" />
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
        {unresolvedCount > 9 ? '9+' : unresolvedCount}
      </span>
    </Link>
  )
}

export default AlertBadge
