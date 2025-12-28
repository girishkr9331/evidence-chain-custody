import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Zap, X } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import toast from 'react-hot-toast'
import axios from '../config/api'

interface Evidence {
  evidenceId: string
  fileHash: string
  category: string
  description: string
  caseId: string
  uploadedBy: string
  onBlockchain: boolean
}

const SyncEvidence = () => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [autoSyncing, setAutoSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 })
  const [showAutoSyncPrompt, setShowAutoSyncPrompt] = useState(false)
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [isUserAuthorized, setIsUserAuthorized] = useState<boolean | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(false)
  const { contract, isConnected, account } = useWeb3()

  // Cache key for storing sync status
  const SYNC_CACHE_KEY = 'evidence_sync_cache'

  useEffect(() => {
    loadEvidence()
    checkUserAuthorization()
  }, [contract, isConnected, account])

  // Check for unsynced evidence and prompt for auto-sync
  useEffect(() => {
    if (evidenceList.length > 0 && !autoSyncing) {
      const notOnBlockchain = evidenceList.filter(e => !e.onBlockchain)
      setUnsyncedCount(notOnBlockchain.length)
      
      if (notOnBlockchain.length > 0 && isConnected) {
        setShowAutoSyncPrompt(true)
      }
    }
  }, [evidenceList, isConnected, autoSyncing])

  // Load sync cache from localStorage
  const loadSyncCache = () => {
    try {
      const cache = localStorage.getItem(SYNC_CACHE_KEY)
      return cache ? JSON.parse(cache) : {}
    } catch (error) {
      console.error('Error loading sync cache:', error)
      return {}
    }
  }

  // Save sync cache to localStorage
  const saveSyncCache = (evidenceId: string, status: boolean) => {
    try {
      const cache = loadSyncCache()
      cache[evidenceId] = {
        synced: status,
        timestamp: Date.now()
      }
      localStorage.setItem(SYNC_CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.error('Error saving sync cache:', error)
    }
  }

  // Check if current user is authorized on blockchain
  const checkUserAuthorization = async () => {
    if (!contract || !isConnected || !account) {
      setIsUserAuthorized(null)
      return
    }

    setCheckingAuth(true)
    try {
      const user = await contract.getUser(account)
      const isAuthorized = user && user.isActive
      setIsUserAuthorized(isAuthorized)
      
      if (!isAuthorized) {
        console.warn('⚠️ User not authorized on blockchain:', account)
      } else {
        console.log('✅ User is authorized on blockchain')
      }
    } catch (error) {
      console.error('Error checking user authorization:', error)
      setIsUserAuthorized(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  // Clear old cache entries (older than 7 days)
  const clearOldCache = () => {
    try {
      const cache = loadSyncCache()
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      Object.keys(cache).forEach(key => {
        if (cache[key].timestamp < sevenDaysAgo) {
          delete cache[key]
        }
      })
      
      localStorage.setItem(SYNC_CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.error('Error clearing old cache:', error)
    }
  }

  const loadEvidence = async (forceRefresh = false) => {
    try {
      // Load all evidence from database
      const response = await axios.get('/api/evidence')
      const dbEvidence = response.data

      // Clear old cache entries
      clearOldCache()
      const syncCache = loadSyncCache()

      // Check which ones are on blockchain
      const evidenceWithStatus = await Promise.all(
        dbEvidence.map(async (evidence: any) => {
          let onBlockchain = false
          
          // First check cache if not forcing refresh
          if (!forceRefresh && syncCache[evidence.evidenceId]?.synced) {
            onBlockchain = true
          } else if (contract && isConnected) {
            // Verify on blockchain
            try {
              await contract.getEvidence(evidence.evidenceId)
              onBlockchain = true
              // Update cache
              saveSyncCache(evidence.evidenceId, true)
            } catch (error) {
              onBlockchain = false
            }
          }

          return {
            evidenceId: evidence.evidenceId,
            fileHash: evidence.fileHash,
            category: evidence.category,
            description: evidence.description,
            caseId: evidence.caseId,
            uploadedBy: evidence.uploadedBy,
            onBlockchain
          }
        })
      )

      setEvidenceList(evidenceWithStatus)
    } catch (error) {
      console.error('Error loading evidence:', error)
      toast.error('Failed to load evidence')
    } finally {
      setLoading(false)
    }
  }

  const syncToBlockchain = async (evidence: Evidence) => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (isUserAuthorized === false) {
      toast.error('You are not authorized to sync evidence. Please contact an admin to register your account on the blockchain.')
      return
    }

    setSyncing(evidence.evidenceId)

    try {
      console.log('Syncing evidence to blockchain:', evidence.evidenceId)
      
      const metadata = JSON.stringify({
        category: evidence.category,
        description: evidence.description
      })

      const tx = await contract.registerEvidence(
        evidence.evidenceId,
        evidence.fileHash,
        metadata,
        evidence.caseId
      )

      toast.loading('Waiting for blockchain confirmation...', { id: 'sync' })
      await tx.wait()

      toast.dismiss('sync')
      toast.success('Evidence synced to blockchain successfully!')
      
      // Update cache
      saveSyncCache(evidence.evidenceId, true)
      
      // Reload to update status
      loadEvidence()
    } catch (error: any) {
      console.error('Error syncing to blockchain:', error)
      
      if (error.message?.includes('Evidence already exists')) {
        toast.error('Evidence already exists on blockchain')
        // Update cache and reload
        saveSyncCache(evidence.evidenceId, true)
        loadEvidence()
      } else {
        toast.error(error.reason || 'Failed to sync evidence')
      }
    } finally {
      setSyncing(null)
    }
  }

  // Auto-sync all unsynced evidence with single confirmation
  const autoSyncAll = async () => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (isUserAuthorized === false) {
      toast.error('You are not authorized to sync evidence. Please contact an admin to register your account on the blockchain.')
      return
    }

    const notOnBlockchain = evidenceList.filter(e => !e.onBlockchain)
    
    if (notOnBlockchain.length === 0) {
      toast.success('All evidence is already on blockchain!')
      return
    }

    setAutoSyncing(true)
    setShowAutoSyncPrompt(false)
    setSyncProgress({ current: 0, total: notOnBlockchain.length })

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (let i = 0; i < notOnBlockchain.length; i++) {
      const evidence = notOnBlockchain[i]
      
      try {
        console.log(`[${i + 1}/${notOnBlockchain.length}] Syncing:`, evidence.evidenceId)
        
        const metadata = JSON.stringify({
          category: evidence.category,
          description: evidence.description
        })

        const tx = await contract.registerEvidence(
          evidence.evidenceId,
          evidence.fileHash,
          metadata,
          evidence.caseId
        )

        toast.loading(`Syncing ${i + 1}/${notOnBlockchain.length}: ${evidence.evidenceId}...`, { id: 'auto-sync' })
        await tx.wait()

        successCount++
        setSyncProgress({ current: i + 1, total: notOnBlockchain.length })
        
        // Update cache
        saveSyncCache(evidence.evidenceId, true)
        
        // Small delay between transactions to avoid nonce issues
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        console.error('Error syncing:', evidence.evidenceId, error)
        
        if (error.message?.includes('Evidence already exists')) {
          // Don't count as failure if already exists
          successCount++
          saveSyncCache(evidence.evidenceId, true)
        } else if (error.message?.includes('Not authorized') || error.reason?.includes('Not authorized')) {
          errors.push('Not authorized to sync evidence')
          failCount++
          break // Stop on authorization error
        } else {
          failCount++
          errors.push(`${evidence.evidenceId}: ${error.reason || error.message}`)
        }
      }
    }

    toast.dismiss('auto-sync')
    
    // Show final result
    if (failCount === 0) {
      toast.success(`✅ Successfully synced ${successCount} evidence item(s) to blockchain!`, { duration: 5000 })
    } else if (successCount > 0) {
      toast.success(`Synced ${successCount} items. ${failCount} failed.`, { duration: 5000 })
      if (errors.length > 0) {
        toast.error(errors[0], { duration: 5000 })
      }
    } else {
      toast.error(errors[0] || 'Failed to sync evidence', { duration: 5000 })
    }
    
    setAutoSyncing(false)
    setSyncProgress({ current: 0, total: 0 })
    
    // Reload to update status
    await loadEvidence(true)
  }

  const syncAllEvidence = async () => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (isUserAuthorized === false) {
      toast.error('You are not authorized to sync evidence. Please contact an admin to register your account on the blockchain.')
      return
    }

    const notOnBlockchain = evidenceList.filter(e => !e.onBlockchain)
    
    if (notOnBlockchain.length === 0) {
      toast.success('All evidence is already on blockchain!')
      return
    }

    const toastId = toast.loading(`Syncing ${notOnBlockchain.length} evidence items...`)
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const evidence of notOnBlockchain) {
      try {
        console.log('Syncing evidence to blockchain:', evidence.evidenceId)
        
        const metadata = JSON.stringify({
          category: evidence.category,
          description: evidence.description
        })

        const tx = await contract.registerEvidence(
          evidence.evidenceId,
          evidence.fileHash,
          metadata,
          evidence.caseId
        )

        toast.loading(`Syncing ${evidence.evidenceId}... (${successCount + 1}/${notOnBlockchain.length})`, { id: toastId })
        await tx.wait()

        successCount++
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        console.error('Error syncing:', evidence.evidenceId, error)
        failCount++
        
        if (error.message?.includes('Not authorized') || error.reason?.includes('Not authorized')) {
          errors.push('Not authorized to sync evidence')
          break // Stop on authorization error
        } else if (error.message?.includes('Evidence already exists')) {
          // Don't count as failure if already exists
          successCount++
        } else {
          errors.push(`${evidence.evidenceId}: ${error.reason || error.message}`)
        }
      }
    }

    toast.dismiss(toastId)
    
    // Show final result
    if (failCount === 0) {
      toast.success(`Successfully synced ${successCount} evidence item(s) to blockchain!`)
    } else if (successCount > 0) {
      toast.success(`Synced ${successCount} items. ${failCount} failed.`)
      if (errors.length > 0) {
        toast.error(errors[0]) // Show first error
      }
    } else {
      toast.error(errors[0] || 'Failed to sync evidence')
    }
    
    // Reload to update status
    loadEvidence()
  }

  const getStats = () => {
    const onBlockchain = evidenceList.filter(e => e.onBlockchain).length
    const notOnBlockchain = evidenceList.filter(e => !e.onBlockchain).length
    return { onBlockchain, notOnBlockchain, total: evidenceList.length }
  }

  const stats = getStats()

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading evidence...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sync Evidence to Blockchain</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Register database evidence on the blockchain to enable full functionality
            </p>
          </div>
          <button
            onClick={() => loadEvidence(true)}
            disabled={loading || autoSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Force refresh from blockchain"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Authorization Warning */}
        {isConnected && isUserAuthorized === false && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-2">
                  ⚠️ User Not Authorized on Blockchain
                </h3>
                <p className="text-red-800 dark:text-red-300 mb-4">
                  Your wallet address <code className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded font-mono text-sm">{account?.slice(0, 10)}...{account?.slice(-8)}</code> is not registered on the blockchain. 
                  You must be registered as an active user before you can sync evidence.
                </p>
                <div className="bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">📋 How to Fix:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-red-800 dark:text-red-300">
                    <li>Go to <strong>User Management</strong> page</li>
                    <li>Click <strong>"Add User"</strong> button (requires admin privileges)</li>
                    <li>Enter your wallet address: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">{account?.slice(0, 10)}...{account?.slice(-8)}</code></li>
                    <li>Fill in your name, role, and department</li>
                    <li>Click <strong>"Register User"</strong> to register on blockchain</li>
                    <li>Return to this page and try syncing again</li>
                  </ol>
                </div>
                <div className="flex gap-3">
                  <a
                    href="/users"
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    Go to User Management
                  </a>
                  <button
                    onClick={checkUserAuthorization}
                    disabled={checkingAuth}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
                  >
                    <RefreshCw className={`w-5 h-5 ${checkingAuth ? 'animate-spin' : ''}`} />
                    {checkingAuth ? 'Checking...' : 'Check Again'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Sync Prompt */}
        {showAutoSyncPrompt && !autoSyncing && unsyncedCount > 0 && isUserAuthorized !== false && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-2">
                  🚀 Smart Auto-Sync Available
                </h3>
                <p className="text-blue-800 dark:text-blue-300 mb-4">
                  Found <strong>{unsyncedCount}</strong> evidence item(s) not on blockchain. 
                  Auto-sync will process all items in the background with progress tracking.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={autoSyncAll}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    <Zap className="w-5 h-5" />
                    Auto-Sync All ({unsyncedCount})
                  </button>
                  <button
                    onClick={() => setShowAutoSyncPrompt(false)}
                    className="px-6 py-3 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowAutoSyncPrompt(false)}
                className="flex-shrink-0 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Auto-Sync Progress Bar */}
        {autoSyncing && syncProgress.total > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Auto-Syncing Evidence to Blockchain
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Progress: {syncProgress.current} / {syncProgress.total} items
                </p>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {Math.round((syncProgress.current / syncProgress.total) * 100)}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Please wait... This may take a few minutes. Do not close this page.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 md:p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400">Total Evidence</p>
                <p className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">{stats.total}</p>
              </div>
              <RefreshCw className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 md:p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-green-600 dark:text-green-400">On Blockchain</p>
                <p className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{stats.onBlockchain}</p>
              </div>
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 md:p-4 border border-orange-200 dark:border-orange-800 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-orange-600 dark:text-orange-400">Need Sync</p>
                <p className="text-xl md:text-2xl font-bold text-orange-900 dark:text-orange-300 mt-1">{stats.notOnBlockchain}</p>
              </div>
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Sync All Button - Only show if auto-sync prompt is dismissed */}
        {stats.notOnBlockchain > 0 && !showAutoSyncPrompt && !autoSyncing && isUserAuthorized !== false && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
                  {stats.notOnBlockchain} evidence item(s) not on blockchain
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                  These evidence items are only in the database. Sync them to enable Record Access, Transfer, and Audit Trail features.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={autoSyncAll}
                    disabled={!isConnected || syncing !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    <Zap className="w-4 h-4" />
                    Smart Auto-Sync All
                  </button>
                  <button
                    onClick={syncAllEvidence}
                    disabled={!isConnected || syncing !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Manual Sync (Old Method)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evidence List */}
        {evidenceList.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Evidence Items</h2>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {evidenceList.map((evidence) => (
                <div key={evidence.evidenceId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{evidence.evidenceId}</h3>
                        {evidence.onBlockchain ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            On Blockchain
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs font-medium rounded-full">
                            <XCircle className="w-3 h-3" />
                            Database Only
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p><span className="font-medium">Case ID:</span> {evidence.caseId}</p>
                        <p><span className="font-medium">Category:</span> {evidence.category}</p>
                        <p><span className="font-medium">Description:</span> {evidence.description}</p>
                        <p className="font-mono text-xs"><span className="font-medium">Hash:</span> {evidence.fileHash.slice(0, 32)}...</p>
                      </div>
                    </div>

                    {!evidence.onBlockchain && (
                      <button
                        onClick={() => syncToBlockchain(evidence)}
                        disabled={syncing === evidence.evidenceId || !isConnected || isUserAuthorized === false}
                        className="ml-4 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                        title={isUserAuthorized === false ? 'You are not authorized. Register on blockchain first.' : 'Sync to blockchain'}
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing === evidence.evidenceId ? 'animate-spin' : ''}`} />
                        {syncing === evidence.evidenceId ? 'Syncing...' : 'Sync to Blockchain'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <RefreshCw className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Evidence Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There are no evidence items in the database yet.
            </p>
            <a
              href="/evidence/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Upload Evidence
            </a>
          </div>
        )}

        {/* Info Box */}
        {!isConnected && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Connect your wallet</span> to sync evidence to the blockchain
            </p>
          </div>
        )}

        {/* Cache Info & Controls */}
        {isConnected && stats.onBlockchain > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  💾 Smart Caching Enabled
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Synced evidence status is cached locally to speed up page loads. Cache auto-clears after 7 days.
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem(SYNC_CACHE_KEY)
                  toast.success('Cache cleared! Refreshing...')
                  setTimeout(() => loadEvidence(true), 500)
                }}
                className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SyncEvidence
