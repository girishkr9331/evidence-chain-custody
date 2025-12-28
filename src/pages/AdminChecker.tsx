import { useEffect, useState } from 'react'
import { Shield, CheckCircle, XCircle, Copy, Check } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import toast from 'react-hot-toast'

const AdminChecker = () => {
  const [adminAddress, setAdminAddress] = useState<string | null>(null)
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false)
  const [currentUserStatus, setCurrentUserStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { contract, isConnected, account } = useWeb3()

  useEffect(() => {
    checkAdminStatus()
  }, [contract, isConnected, account])

  const checkAdminStatus = async () => {
    if (!contract || !isConnected || !account) {
      setLoading(false)
      return
    }

    try {
      // Get contract admin
      const admin = await contract.admin()
      setAdminAddress(admin)

      // Check if current user is admin
      const isAdmin = account.toLowerCase() === admin.toLowerCase()
      setIsCurrentUserAdmin(isAdmin)

      // Get current user status
      try {
        const userInfo = await contract.getUser(account)
        setCurrentUserStatus({
          isRegistered: true,
          isActive: userInfo.isActive,
          role: Number(userInfo.role),
          name: userInfo.name,
          department: userInfo.department
        })
      } catch (error) {
        setCurrentUserStatus({
          isRegistered: false,
          isActive: false,
          role: 0,
          name: '',
          department: ''
        })
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      toast.error('Failed to check admin status')
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success('Address copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy address')
    }
  }

  const getRoleName = (role: number) => {
    const roles = ['NONE', 'POLICE', 'INVESTIGATOR', 'FORENSIC_LAB', 'COURT', 'CYBER_UNIT']
    return roles[role] || 'UNKNOWN'
  }

  if (!isConnected) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Wallet Not Connected
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to check admin status
            </p>
          </div>
        </div>
      </Layout>
    )
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blockchain Admin Checker</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Verify blockchain admin and user authorization status
          </p>
        </div>

        {/* Admin Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Contract Admin
          </h2>
          
          {adminAddress && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Blockchain Admin Address
                    </p>
                    <p className="font-mono text-sm text-blue-800 dark:text-blue-200 break-all">
                      {adminAddress}
                    </p>
                  </div>
                  <button
                    onClick={() => copyAddress(adminAddress)}
                    className="ml-4 p-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                </div>
              </div>

              {isCurrentUserAdmin ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                        ✅ You are the Blockchain Admin!
                      </h3>
                      <p className="text-sm text-green-800 dark:text-green-300">
                        You have full admin privileges and can register new users and sync evidence.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
                        ⚠️ You are NOT the Blockchain Admin
                      </h3>
                      <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                        Your wallet address does not match the contract admin. To register users or sync evidence, you need to be registered by the admin.
                      </p>
                      <div className="bg-orange-100 dark:bg-orange-900/40 rounded p-3 text-xs text-orange-900 dark:text-orange-200">
                        <strong>To fix this:</strong> Ask the admin at <code className="bg-orange-200 dark:bg-orange-800 px-1 rounded">{adminAddress.slice(0, 10)}...{adminAddress.slice(-8)}</code> to register your wallet address.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current User Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your User Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Wallet Address</span>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-gray-900 dark:text-white">{account?.slice(0, 10)}...{account?.slice(-8)}</code>
                <button
                  onClick={() => account && copyAddress(account)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Registered on Blockchain</span>
              {currentUserStatus?.isRegistered ? (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Yes
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-medium">
                  <XCircle className="w-4 h-4" /> No
                </span>
              )}
            </div>

            {currentUserStatus?.isRegistered && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                  {currentUserStatus?.isActive ? (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {getRoleName(currentUserStatus.role)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
                  <span className="text-sm text-gray-900 dark:text-white">{currentUserStatus.name || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</span>
                  <span className="text-sm text-gray-900 dark:text-white">{currentUserStatus.department || 'N/A'}</span>
                </div>
              </>
            )}
          </div>

          {!currentUserStatus?.isRegistered && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">❌ Not Registered</h3>
              <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                Your wallet is not registered on the blockchain. You cannot sync evidence or perform blockchain operations.
              </p>
              <div className="bg-red-100 dark:bg-red-900/40 rounded p-3 text-sm text-red-900 dark:text-red-200">
                <strong>Next Steps:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Contact the blockchain admin: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">{adminAddress?.slice(0, 10)}...{adminAddress?.slice(-8)}</code></li>
                  <li>Ask them to go to User Management page</li>
                  <li>They should click "Add User" and register your address: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">{account?.slice(0, 10)}...{account?.slice(-8)}</code></li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isCurrentUserAdmin && (
              <a
                href="/users"
                className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Shield className="w-5 h-5" />
                Manage Users
              </a>
            )}
            
            {currentUserStatus?.isRegistered && currentUserStatus?.isActive && (
              <a
                href="/evidence-sync"
                className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Sync Evidence
              </a>
            )}
            
            <button
              onClick={checkAdminStatus}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AdminChecker
