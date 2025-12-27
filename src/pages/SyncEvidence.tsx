import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
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
  const { contract, isConnected, account } = useWeb3()

  useEffect(() => {
    loadEvidence()
  }, [contract, isConnected])

  const loadEvidence = async () => {
    try {
      // Load all evidence from database
      const response = await axios.get('/api/evidence')
      const dbEvidence = response.data

      // Check which ones are on blockchain
      const evidenceWithStatus = await Promise.all(
        dbEvidence.map(async (evidence: any) => {
          let onBlockchain = false
          
          if (contract && isConnected) {
            try {
              await contract.getEvidence(evidence.evidenceId)
              onBlockchain = true
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
      
      // Reload to update status
      loadEvidence()
    } catch (error: any) {
      console.error('Error syncing to blockchain:', error)
      
      if (error.message?.includes('Evidence already exists')) {
        toast.error('Evidence already exists on blockchain')
        // Still reload to update status
        loadEvidence()
      } else {
        toast.error(error.reason || 'Failed to sync evidence')
      }
    } finally {
      setSyncing(null)
    }
  }

  const syncAllEvidence = async () => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first')
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sync Evidence to Blockchain</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Register database evidence on the blockchain to enable full functionality
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Evidence</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">{stats.total}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">On Blockchain</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{stats.onBlockchain}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Need Sync</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-300 mt-1">{stats.notOnBlockchain}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Sync All Button */}
        {stats.notOnBlockchain > 0 && (
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
                <button
                  onClick={syncAllEvidence}
                  disabled={!isConnected || syncing !== null}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync All to Blockchain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evidence List */}
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
                      disabled={syncing === evidence.evidenceId || !isConnected}
                      className="ml-4 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
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

        {/* Info Box */}
        {!isConnected && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Connect your wallet</span> to sync evidence to the blockchain
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SyncEvidence
