import { useState } from 'react'
import { X, Archive, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from '../config/api'

interface EvidenceArchiveModalProps {
  evidenceId: string
  currentStatus: string
  onClose: () => void
  onSuccess: () => void
}

const EvidenceArchiveModal = ({ evidenceId, currentStatus, onClose, onSuccess }: EvidenceArchiveModalProps) => {
  const [status, setStatus] = useState(currentStatus || 'ACTIVE')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post(`/api/archive/evidence/${evidenceId}`, {
        status,
        reason,
        notes
      })

      toast.success('Archive status updated successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating archive status:', error)
      toast.error(error.response?.data?.message || 'Failed to update archive status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Archive className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Manage Evidence Status</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Evidence ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence ID
            </label>
            <input
              type="text"
              value={evidenceId}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Status Preview */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Preview:</span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
              {status.replace('_', ' ')}
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason {status !== 'ACTIVE' && '*'}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you changing the status?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required={status !== 'ACTIVE'}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional additional information..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Warning for archived status */}
          {status === 'ARCHIVED' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Archiving Evidence</p>
                <p>This evidence will be hidden from the main list but remains on the blockchain with full audit trail intact.</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EvidenceArchiveModal
