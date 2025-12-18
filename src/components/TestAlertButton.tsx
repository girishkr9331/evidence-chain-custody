import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context'
import toast from 'react-hot-toast'

interface TestAlertButtonProps {
  evidenceId: string
}

const TestAlertButton = ({ evidenceId }: TestAlertButtonProps) => {
  const [loading, setLoading] = useState(false)
  const { contract } = useWeb3()

  const triggerTestAlert = async () => {
    if (!contract) {
      toast.error('Please connect your wallet first')
      return
    }

    setLoading(true)
    try {
      console.log('🧪 Triggering test alert...')
      const tx = await contract.triggerAlert(
        evidenceId,
        'SUSPICIOUS_ACTIVITY',
        'Test alert: Manual security check triggered by admin'
      )
      await tx.wait()
      toast.success('Test alert created successfully!')
      console.log('✅ Test alert created')
    } catch (error: any) {
      console.error('Error creating test alert:', error)
      toast.error(error.reason || 'Failed to create alert')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={triggerTestAlert}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
      title="Trigger a test security alert"
    >
      <AlertTriangle className="w-4 h-4" />
      {loading ? 'Creating Alert...' : 'Test Alert'}
    </button>
  )
}

export default TestAlertButton
