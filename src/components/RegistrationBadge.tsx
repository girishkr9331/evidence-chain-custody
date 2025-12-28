import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const RegistrationBadge = () => {
  const [pendingCount, setPendingCount] = useState(0)
  const { token, isAdmin } = useAuth()
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api'

  useEffect(() => {
    if (!isAdmin()) return

    const fetchPendingCount = async () => {
      try {
        const response = await axios.get(`${API_URL}/registration-requests/count/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPendingCount(response.data.count)
      } catch (error) {
        console.error('Error fetching pending registration count:', error)
      }
    }

    fetchPendingCount()
    
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    
    return () => clearInterval(interval)
  }, [token, isAdmin])

  if (!isAdmin() || pendingCount === 0) return null

  return (
    <Link
      to="/registration-approval"
      className="relative inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors animate-fade-in"
      title={`${pendingCount} pending registration${pendingCount > 1 ? 's' : ''}`}
    >
      <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-600 text-xs font-bold text-white animate-bounce-slow">
        {pendingCount > 9 ? '9+' : pendingCount}
      </span>
      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-600 animate-ping opacity-75"></span>
    </Link>
  )
}

export default RegistrationBadge
