import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Eye, Calendar, User, FileText, Archive } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import toast from 'react-hot-toast'
import axios from '../config/api'
import EvidenceArchiveModal from '../components/EvidenceArchiveModal'

interface Evidence {
  evidenceId: string
  evidenceHash: string
  metadata: any
  collector: string
  currentCustodian: string
  createdAt: number
  caseId: string
}

const EvidenceList = () => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([])
  const [filteredList, setFilteredList] = useState<Evidence[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null)
  const [archiveStatuses, setArchiveStatuses] = useState<Record<string, string>>({})
  const { contract, isConnected } = useWeb3()

  useEffect(() => {
    loadEvidence()
  }, [contract, isConnected])

  useEffect(() => {
    filterEvidence()
  }, [searchTerm, filterCategory, statusFilter, evidenceList, archiveStatuses])

  const loadEvidence = async () => {
    try {
      // First, try to load from database
      const response = await axios.get('/api/evidence')
      const dbEvidence = response.data
      
      // Transform database evidence to match the expected format
      const evidenceData = dbEvidence.map((evidence: any) => ({
        evidenceId: evidence.evidenceId,
        evidenceHash: evidence.fileHash,
        metadata: {
          category: evidence.category,
          description: evidence.description,
          fileName: evidence.fileName,
          fileSize: evidence.fileSize,
          fileType: evidence.fileType,
          ...evidence.metadata
        },
        collector: evidence.uploadedBy,
        currentCustodian: evidence.uploadedBy,
        createdAt: new Date(evidence.createdAt).getTime() / 1000,
        caseId: evidence.caseId
      }))

      setEvidenceList(evidenceData)
      setFilteredList(evidenceData)
      
      // Load archive statuses
      loadArchiveStatuses(evidenceData)
    } catch (error: any) {
      console.error('Error loading evidence from database:', error)
      
      // Fallback to blockchain if database fails
      if (contract) {
        try {
          toast.info('Loading from blockchain...')
          const evidenceIds = await contract.getAllEvidenceIds()
          
          const evidenceData = await Promise.all(
            evidenceIds.map(async (id: string) => {
              const evidence = await contract.getEvidence(id)
              let metadata = {}
              try {
                metadata = JSON.parse(evidence.metadata)
              } catch (e) {
                metadata = { description: evidence.metadata }
              }
              
              return {
                evidenceId: evidence.evidenceId,
                evidenceHash: evidence.evidenceHash,
                metadata,
                collector: evidence.collector,
                currentCustodian: evidence.currentCustodian,
                createdAt: Number(evidence.createdAt),
                caseId: evidence.caseId
              }
            })
          )

          setEvidenceList(evidenceData)
          setFilteredList(evidenceData)
        } catch (blockchainError) {
          console.error('Error loading evidence from blockchain:', blockchainError)
          toast.error('Failed to load evidence list')
        }
      } else {
        toast.error('Failed to load evidence list')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadArchiveStatuses = async (evidenceData: Evidence[]) => {
    try {
      const statuses: Record<string, string> = {}
      await Promise.all(
        evidenceData.map(async (evidence) => {
          try {
            const response = await axios.get(`/api/archive/evidence/${evidence.evidenceId}`)
            statuses[evidence.evidenceId] = response.data.status || 'ACTIVE'
          } catch (error) {
            statuses[evidence.evidenceId] = 'ACTIVE'
          }
        })
      )
      setArchiveStatuses(statuses)
    } catch (error) {
      console.error('Error loading archive statuses:', error)
    }
  }

  const filterEvidence = () => {
    let filtered = [...evidenceList]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (evidence) =>
          evidence.evidenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          evidence.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          evidence.metadata.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (filterCategory !== 'ALL') {
      filtered = filtered.filter(
        (evidence) => evidence.metadata.category === filterCategory
      )
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(
        (evidence) => (archiveStatuses[evidence.evidenceId] || 'ACTIVE') === statusFilter
      )
    }

    setFilteredList(filtered)
  }

  const handleArchiveClick = (evidenceId: string) => {
    setSelectedEvidence(evidenceId)
    setArchiveModalOpen(true)
  }

  const handleArchiveSuccess = () => {
    loadEvidence()
  }

  const getStatusBadge = (evidenceId: string) => {
    const status = archiveStatuses[evidenceId] || 'ACTIVE'
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      EXPIRED: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || colors.ACTIVE}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const categories = [
    { value: 'ALL', label: 'All Categories' },
    { value: 'MOBILE_DUMP', label: 'Mobile Dump' },
    { value: 'CCTV_FOOTAGE', label: 'CCTV Footage' },
    { value: 'DIGITAL_DOCUMENT', label: 'Digital Document' },
    { value: 'NETWORK_LOG', label: 'Network Log' },
    { value: 'FORENSIC_IMAGE', label: 'Forensic Image' },
    { value: 'OTHER', label: 'Other' }
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
            <h1 className="text-3xl font-bold text-gray-900">Evidence Registry</h1>
            <p className="text-gray-600 mt-1">
              Browse and manage digital evidence records
            </p>
          </div>
          <Link
            to="/evidence/upload"
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Upload Evidence
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Evidence ID, Case ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Archive className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <p>
              Showing <span className="font-medium">{filteredList.length}</span> of{' '}
              <span className="font-medium">{evidenceList.length}</span> evidence records
            </p>
          </div>
        </div>

        {/* Evidence Grid */}
        {filteredList.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredList.map((evidence) => (
              <div
                key={evidence.evidenceId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {evidence.evidenceId}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Case: {evidence.caseId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {evidence.metadata.category || 'EVIDENCE'}
                    </span>
                    {getStatusBadge(evidence.evidenceId)}
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {evidence.metadata.description || 'No description available'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Custodian: {evidence.currentCustodian.slice(0, 6)}...{evidence.currentCustodian.slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(evidence.createdAt * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span className="font-mono text-xs truncate">
                      Hash: {evidence.evidenceHash.slice(0, 16)}...
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/evidence/${evidence.evidenceId}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                  <button
                    onClick={() => handleArchiveClick(evidence.evidenceId)}
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-orange-100 text-orange-700 font-medium rounded-lg hover:bg-orange-200 transition-colors"
                    title="Manage Status"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No evidence found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterCategory !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Get started by uploading your first evidence'}
            </p>
            {!searchTerm && filterCategory === 'ALL' && (
              <Link
                to="/evidence/upload"
                className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Upload Evidence
              </Link>
            )}
          </div>
        )}

        {/* Archive Modal */}
        {archiveModalOpen && selectedEvidence && (
          <EvidenceArchiveModal
            evidenceId={selectedEvidence}
            currentStatus={archiveStatuses[selectedEvidence] || 'ACTIVE'}
            onClose={() => setArchiveModalOpen(false)}
            onSuccess={handleArchiveSuccess}
          />
        )}
      </div>
    </Layout>
  )
}

export default EvidenceList
