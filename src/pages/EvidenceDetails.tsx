import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Hash, User, Calendar, Shield, FileText, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import CryptoJS from 'crypto-js'
import axios from '../config/api'
import AuditTimeline from '../components/AuditTimeline'
import TestAlertButton from '../components/TestAlertButton'
import EvidenceCommentSection from '../components/EvidenceCommentSection'

const EvidenceDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contract, isConnected, account } = useWeb3()
  const { user, isAdmin } = useAuth()
  const [evidence, setEvidence] = useState<any>(null)
  const [auditTrail, setAuditTrail] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [transferTo, setTransferTo] = useState('')
  const [showTransfer, setShowTransfer] = useState(false)
  const [showCloseCase, setShowCloseCase] = useState(false)
  const [closureReason, setClosureReason] = useState('')
  const [closingCase, setClosingCase] = useState(false)

  useEffect(() => {
    loadEvidenceDetails()
  }, [contract, id])

  const loadEvidenceDetails = async () => {
    if (!id) {
      setLoading(false)
      return
    }

    let evidenceLoaded = false
    let auditTrailLoaded = false

    try {
      // Try blockchain first if connected
      if (contract && isConnected) {
        try {
          console.log('🔍 Attempting to load evidence from blockchain:', id)
          const evidenceData = await contract.getEvidence(id)
          console.log('✅ Evidence data from blockchain:', evidenceData)
          
          let metadata = {}
          try {
            metadata = JSON.parse(evidenceData.metadata)
          } catch (e) {
            metadata = { description: evidenceData.metadata }
          }

          // Get case status from database (blockchain doesn't track this)
          let caseStatus = 'OPEN'
          let closedBy = null
          let closedAt = null
          let closureReason = null
          try {
            const dbResponse = await axios.get(`/api/evidence/${id}`)
            if (dbResponse.data) {
              caseStatus = dbResponse.data.caseStatus || 'OPEN'
              closedBy = dbResponse.data.closedBy
              closedAt = dbResponse.data.closedAt
              closureReason = dbResponse.data.closureReason
            }
          } catch (dbError) {
            console.log('ℹ️ Could not load case status from database, defaulting to OPEN')
          }

          setEvidence({
            evidenceId: evidenceData.evidenceId,
            evidenceHash: evidenceData.evidenceHash,
            metadata,
            collector: evidenceData.collector,
            currentCustodian: evidenceData.currentCustodian,
            createdAt: Number(evidenceData.createdAt),
            caseId: evidenceData.caseId,
            caseStatus,
            closedBy,
            closedAt,
            closureReason
          })
          evidenceLoaded = true

          // Load audit trail from blockchain
          try {
            const auditData = await contract.getAuditTrail(id)
            console.log('✅ Audit trail from blockchain:', auditData)
            console.log('📊 Number of audit logs:', auditData.length)

            const formattedAuditTrail = auditData.map((log: any) => ({
              evidenceId: id,
              action: Number(log.action),
              actor: log.actor,
              transferTo: log.transferTo,
              timestamp: Number(log.timestamp),
              notes: log.notes,
              previousHash: log.previousHash || '',
              newHash: log.newHash || ''
            }))
            
            setAuditTrail(formattedAuditTrail)
            auditTrailLoaded = true
            console.log('✅ Formatted audit trail:', formattedAuditTrail)
          } catch (auditError) {
            console.error('⚠️ Could not load audit trail from blockchain:', auditError)
            setAuditTrail([])
          }

          return
        } catch (blockchainError: any) {
          console.error('⚠️ Error loading evidence from blockchain:', blockchainError)
          console.error('Error message:', blockchainError.message)
          // Continue to try database
        }
      }

      // Fallback to database for evidence data
      console.log('📦 Loading evidence from database:', id)
      const response = await axios.get(`/api/evidence/${id}`)
      const dbEvidence = response.data
      console.log('✅ Evidence data from database:', dbEvidence)

      setEvidence({
        evidenceId: dbEvidence.evidenceId,
        evidenceHash: dbEvidence.fileHash,
        metadata: {
          category: dbEvidence.category,
          description: dbEvidence.description,
          fileName: dbEvidence.fileName,
          fileSize: dbEvidence.fileSize,
          fileType: dbEvidence.fileType,
          ...dbEvidence.metadata
        },
        collector: dbEvidence.uploadedBy,
        currentCustodian: dbEvidence.currentCustodian || dbEvidence.uploadedBy,
        createdAt: new Date(dbEvidence.createdAt).getTime() / 1000,
        caseId: dbEvidence.caseId,
        caseStatus: dbEvidence.caseStatus || 'OPEN',
        closedBy: dbEvidence.closedBy,
        closedAt: dbEvidence.closedAt,
        closureReason: dbEvidence.closureReason
      })
      evidenceLoaded = true

      // Still try to load audit trail from blockchain if wallet is connected
      if (contract && isConnected && !auditTrailLoaded) {
        try {
          console.log('🔍 Attempting to load audit trail from blockchain for database evidence:', id)
          const auditData = await contract.getAuditTrail(id)
          console.log('✅ Audit trail found on blockchain:', auditData.length, 'logs')

          const formattedAuditTrail = auditData.map((log: any) => ({
            evidenceId: id,
            action: Number(log.action),
            actor: log.actor,
            transferTo: log.transferTo,
            timestamp: Number(log.timestamp),
            notes: log.notes,
            previousHash: log.previousHash || '',
            newHash: log.newHash || ''
          }))
          
          setAuditTrail(formattedAuditTrail)
          console.log('✅ Audit trail loaded successfully')
        } catch (auditError: any) {
          console.log('ℹ️ No audit trail on blockchain for this evidence')
          setAuditTrail([])
        }
      } else {
        console.log('⚠️ Cannot load audit trail: wallet not connected')
        setAuditTrail([])
      }
    } catch (error) {
      console.error('❌ Error loading evidence:', error)
      toast.error('Evidence not found')
      setEvidence(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAccessEvidence = async () => {
    if (!contract) return

    let toastId: string | undefined

    try {
      toastId = toast.loading('Recording access on blockchain...')
      
      const tx = await contract.accessEvidence(id, 'Accessed evidence for review')
      const receipt = await tx.wait()
      
      // Save audit log to database (ACCESSED action = 2)
      try {
        await axios.post('/api/audit-logs', {
          evidenceId: id,
          action: 2, // ACCESSED
          actor: account,
          timestamp: Math.floor(Date.now() / 1000),
          notes: 'Accessed evidence for review',
          blockchainTxHash: receipt.hash
        })
        console.log('Access audit log saved to database')
      } catch (auditError) {
        console.error('Failed to save access audit log:', auditError)
      }
      
      toast.dismiss(toastId)
      toast.success('Access recorded successfully!')
      loadEvidenceDetails()
    } catch (error: any) {
      if (toastId) {
        toast.dismiss(toastId)
      }
      toast.error(error.reason || 'Failed to record access')
    }
  }

  const handleTransfer = async () => {
    if (!contract || !transferTo) return

    let toastId: string | undefined

    try {
      toastId = toast.loading('Transferring evidence...')
      
      const tx = await contract.transferEvidence(id, transferTo, 'Evidence transferred')
      const receipt = await tx.wait()
      
      // Save audit log to database (TRANSFERRED action = 3)
      try {
        await axios.post('/api/audit-logs', {
          evidenceId: id,
          action: 3, // TRANSFERRED
          actor: account,
          transferTo: transferTo,
          timestamp: Math.floor(Date.now() / 1000),
          notes: 'Evidence transferred',
          blockchainTxHash: receipt.hash
        })
        console.log('Transfer audit log saved to database')
      } catch (auditError) {
        console.error('Failed to save transfer audit log:', auditError)
      }
      
      toast.dismiss(toastId)
      toast.success('Evidence transferred successfully!')
      setShowTransfer(false)
      setTransferTo('')
      loadEvidenceDetails()
    } catch (error: any) {
      if (toastId) {
        toast.dismiss(toastId)
      }
      toast.error(error.reason || 'Failed to transfer evidence')
    }
  }

  const handleCloseCase = async () => {
    if (!user || !closureReason.trim()) {
      toast.error('Please provide a closure reason')
      return
    }

    setClosingCase(true)
    const toastId = toast.loading('Closing case...')

    try {
      const response = await axios.patch(`/api/evidence/${id}/close`, {
        closureReason: closureReason.trim()
      })

      if (response.data.success) {
        toast.dismiss(toastId)
        toast.success('Case closed successfully!')
        setShowCloseCase(false)
        setClosureReason('')
        loadEvidenceDetails()
      }
    } catch (error: any) {
      toast.dismiss(toastId)
      const errorMsg = error.response?.data?.message || 'Failed to close case'
      toast.error(errorMsg)
      console.error('Error closing case:', error.response?.data)
    } finally {
      setClosingCase(false)
    }
  }

  const canCloseCase = () => {
    if (!user || !evidence) return false
    
    // Check if case is already closed
    if (evidence.caseStatus === 'CLOSED') return false
    
    // Admin can always close
    if (isAdmin()) return true
    
    // Current custodian can close
    const userAddress = user.address.toLowerCase()
    const custodian = evidence.currentCustodian?.toLowerCase()
    return userAddress === custodian
  }

  const getActionName = (action: number) => {
    const actions = ['COLLECTED', 'UPLOADED', 'ACCESSED', 'TRANSFERRED', 'ANALYZED', 'VERIFIED', 'MODIFIED']
    return actions[action] || 'UNKNOWN'
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

  if (!evidence) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Evidence not found</p>
          <Link to="/evidence/list" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            Back to Evidence List
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{evidence.evidenceId}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Case: {evidence.caseId}</p>
          </div>
          {evidence.caseStatus === 'CLOSED' ? (
            <span className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Case Closed
            </span>
          ) : (
            <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium rounded-lg flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              Case Open
            </span>
          )}
        </div>

        {/* Evidence Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Evidence Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Evidence ID</label>
              <p className="text-gray-900 dark:text-white mt-1">{evidence.evidenceId}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Case ID</label>
              <p className="text-gray-900 dark:text-white mt-1">{evidence.caseId}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
              <p className="text-gray-900 dark:text-white mt-1">{evidence.metadata.category || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Collected Date</label>
              <p className="text-gray-900 dark:text-white mt-1">
                {new Date(evidence.createdAt * 1000).toLocaleString()}
              </p>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
              <p className="text-gray-900 dark:text-white mt-1">{evidence.metadata.description || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Custody Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Chain of Custody</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Collector</p>
                <p className="text-sm text-gray-900 dark:text-white font-mono">{evidence.collector}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Custodian</p>
                <p className="text-sm text-gray-900 dark:text-white font-mono">{evidence.currentCustodian}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hash Verification */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Cryptographic Hash
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{evidence.evidenceHash}</p>
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            This SHA-256 hash is stored immutably on the blockchain and can be used to verify evidence integrity.
          </p>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAccessEvidence}
              disabled={!isConnected}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              Record Access
            </button>
            
            {account === evidence.currentCustodian && (
              <button
                onClick={() => setShowTransfer(!showTransfer)}
                disabled={!isConnected}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Transfer Custody
              </button>
            )}
            
            <Link
              to={`/audit-trail?evidence=${id}`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              View Full Audit Trail
            </Link>
            
            {canCloseCase() && evidence.caseStatus !== 'CLOSED' && (
              <button
                onClick={() => setShowCloseCase(!showCloseCase)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Close Case
              </button>
            )}
          </div>
          
          {showCloseCase && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-3">Close Case</h3>
              <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                Closing this case will mark it as completed. Only the current custodian or admin can perform this action.
              </p>
              <label className="block text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                Closure Reason *
              </label>
              <textarea
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                placeholder="Provide a reason for closing this case (e.g., Case resolved, Evidence analyzed and documented, Investigation complete)"
                rows={3}
                className="w-full px-4 py-2 border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleCloseCase}
                  disabled={closingCase || !closureReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {closingCase ? 'Closing...' : 'Confirm Close Case'}
                </button>
                <button
                  onClick={() => {
                    setShowCloseCase(false)
                    setClosureReason('')
                  }}
                  className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {showTransfer && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transfer to Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                />
                <button
                  onClick={handleTransfer}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Transfer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Audit Trail */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Timeline</h2>
            <Link
              to={`/audit-trail?evidence=${id}`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View Full History
            </Link>
          </div>
          
          {auditTrail.length > 0 ? (
            <AuditTimeline logs={auditTrail} maxItems={5} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No audit logs found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {!isConnected 
                  ? 'Connect your wallet to view blockchain audit logs' 
                  : 'Audit logs will appear when you interact with this evidence on the blockchain'}
              </p>
            </div>
          )}
        </div>

        {/* Evidence Discussion/Comments Section */}
        <EvidenceCommentSection 
          evidenceId={evidence.evidenceId}
          evidenceName={evidence.metadata.fileName || evidence.evidenceId}
        />
      </div>
    </Layout>
  )
}

export default EvidenceDetails
