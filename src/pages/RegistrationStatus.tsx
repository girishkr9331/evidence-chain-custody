import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Wallet, CheckCircle, XCircle, Clock, AlertCircle, Search } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'
import axios from 'axios'

interface RegistrationStatusData {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_FOUND'
  address?: string
  name?: string
  role?: string
  department?: string
  requestedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}

const RegistrationStatus = () => {
  const [loading, setLoading] = useState(false)
  const [statusData, setStatusData] = useState<RegistrationStatusData | null>(null)
  const [walletAddress, setWalletAddress] = useState('')
  const { connectWallet, account } = useWeb3()
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api'

  useEffect(() => {
    if (account) {
      // Normalize wallet address to lowercase
      setWalletAddress(account.toLowerCase())
    }
  }, [account])

  const checkStatus = async (address: string) => {
    if (!address) {
      alert('Please enter a wallet address or connect your wallet')
      return
    }

    setLoading(true)
    setStatusData(null)

    try {
      // Convert address to lowercase to match backend storage
      const normalizedAddress = address.toLowerCase()
      const response = await axios.get(`${API_URL}/registration-requests/status/${normalizedAddress}`)
      setStatusData(response.data)
    } catch (error: any) {
      if (error.response?.status === 404) {
        setStatusData({ status: 'NOT_FOUND' })
      } else {
        console.error('Error checking status:', error)
        alert('Failed to check registration status. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkStatus(walletAddress)
  }

  const getStatusDisplay = () => {
    if (!statusData) return null

    switch (statusData.status) {
      case 'PENDING':
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-8 text-center animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/40 rounded-full animate-bounce-slow">
                <Clock className="w-16 h-16 text-yellow-600 dark:text-yellow-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Registration Pending
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your registration request is awaiting admin review
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                <span className="text-sm text-gray-900 dark:text-white font-medium">{statusData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Role:</span>
                <span className="text-sm text-gray-900 dark:text-white">{statusData.role?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Department:</span>
                <span className="text-sm text-gray-900 dark:text-white">{statusData.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Requested:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {statusData.requestedAt ? new Date(statusData.requestedAt).toLocaleString() : '-'}
                </span>
              </div>
            </div>
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                What's next?
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 text-left space-y-1">
                <li>• An administrator will review your request shortly</li>
                <li>• You will be able to login once approved</li>
                <li>• Check back here for status updates</li>
              </ul>
            </div>
          </div>
        )

      case 'APPROVED':
        return (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-8 text-center animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-full animate-scale-in">
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 animate-check" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Registration Approved! 🎉
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your account has been approved and created successfully
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-left space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                <span className="text-sm text-gray-900 dark:text-white font-medium">{statusData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Role:</span>
                <span className="text-sm text-gray-900 dark:text-white">{statusData.role?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Department:</span>
                <span className="text-sm text-gray-900 dark:text-white">{statusData.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {statusData.reviewedAt ? new Date(statusData.reviewedAt).toLocaleString() : '-'}
                </span>
              </div>
            </div>
            <Link
              to="/login"
              className="inline-block w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        )

      case 'REJECTED':
        return (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-8 text-center animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-100 dark:bg-red-900/40 rounded-full animate-shake">
                <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Registration Rejected
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your registration request was not approved
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-left space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                <span className="text-sm text-gray-900 dark:text-white font-medium">{statusData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {statusData.reviewedAt ? new Date(statusData.reviewedAt).toLocaleString() : '-'}
                </span>
              </div>
              {statusData.rejectionReason && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">Reason:</span>
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    {statusData.rejectionReason}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                If you believe this is an error, please contact the system administrator for assistance.
              </p>
            </div>
          </div>
        )

      case 'NOT_FOUND':
        return (
          <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse-slow">
                <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Registration Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No registration request found for this wallet address
            </p>
            <Link
              to="/register"
              className="inline-block w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Register Now
            </Link>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-600 rounded-2xl">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Check Registration Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your wallet address to check your registration request status
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Wallet Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!!account}
                />
                {!account && (
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    Connect
                  </button>
                )}
              </div>
              {account && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                  ✓ Wallet connected
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !walletAddress}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Checking Status...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Check Status
                </>
              )}
            </button>
          </form>
        </div>

        {/* Status Display */}
        {statusData && <div className="mb-6">{getStatusDisplay()}</div>}

        {/* Navigation Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
              Back to Login
            </Link>
            {' | '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
              Register New Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegistrationStatus
