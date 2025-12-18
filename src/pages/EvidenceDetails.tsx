import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Hash, User, Calendar, Shield, FileText, CheckCircle, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import toast from 'react-hot-toast'
import CryptoJS from 'crypto-js'
import axios from '../config/api'
import AuditTimeline from '../components/AuditTimeline'
import TestAlertButton from '../components/TestAlertButton'

const EvidenceDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contract, isConnected, account } = useWeb3()
  const [evidence, setEvidence] = useState<any>(null)
  const [auditTrail, setAuditTrail] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [transferTo, setTransferTo] = useState('')
  const [showTransfer, setShowTransfer] = useState(false)

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

          setEvidence({
            evidenceId: evidenceData.evidenceId,
            evidenceHash: evidenceData.evidenceHash,
            metadata,
            collector: evidenceData.collector,
            currentCustodian: evidenceData.currentCustodian,
            createdAt: Number(evidenceData.createdAt),
            caseId: evidenceData.caseId
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
        currentCustodian: dbEvidence.uploadedBy,
        createdAt: new Date(dbEvidence.createdAt).getTime() / 1000,
        caseId: dbEvidence.caseId
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
          <p className="text-gray-600">Evidence not found</p>
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
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{evidence.evidenceId}</h1>
            <p className="text-gray-600 mt-1">Case: {evidence.caseId}</p>
          </div>
          <span className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg">
            Active
          </span>
        </div>

        {/* Evidence Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Evidence Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Evidence ID</label>
              <p className="text-gray-900 mt-1">{evidence.evidenceId}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Case ID</label>
              <p className="text-gray-900 mt-1">{evidence.caseId}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Category</label>
              <p className="text-gray-900 mt-1">{evidence.metadata.category || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Collected Date</label>
              <p className="text-gray-900 mt-1">
                {new Date(evidence.createdAt * 1000).toLocaleString()}
              </p>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-900 mt-1">{evidence.metadata.description || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Custody Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Chain of Custody</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Collector</p>
                <p className="text-sm text-gray-900 font-mono">{evidence.collector}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Current Custodian</p>
                <p className="text-sm text-gray-900 font-mono">{evidence.currentCustodian}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hash Verification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Cryptographic Hash
          </h2>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-mono text-gray-700 break-all">{evidence.evidenceHash}</p>
          </div>
          
          <p className="text-xs text-gray-600 mt-2">
            This SHA-256 hash is stored immutably on the blockchain and can be used to verify evidence integrity.
          </p>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          
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
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Full Audit Trail
            </Link>
          </div>
          
          {showTransfer && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer to Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Activity Timeline</h2>
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
              <p className="text-gray-500 mb-2">No audit logs found</p>
              <p className="text-sm text-gray-400">
                {!isConnected 
                  ? 'Connect your wallet to view blockchain audit logs' 
                  : 'Audit logs will appear when you interact with this evidence on the blockchain'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default EvidenceDetails
