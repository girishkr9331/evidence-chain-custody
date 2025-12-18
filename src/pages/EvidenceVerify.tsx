import { useState, ChangeEvent } from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle, Upload } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import toast from 'react-hot-toast'
import CryptoJS from 'crypto-js'

const EvidenceVerify = () => {
  const [evidenceId, setEvidenceId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileHash, setFileHash] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<{
    verified: boolean
    message: string
    details?: any
  } | null>(null)
  const { contract, isConnected } = useWeb3()

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setResult(null)

    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any)
      const hash = CryptoJS.SHA256(wordArray).toString()
      setFileHash(hash)
    } catch (error) {
      console.error('Error hashing file:', error)
      toast.error('Failed to calculate file hash')
    }
  }

  const handleVerify = async () => {
    if (!contract || !evidenceId || !fileHash) {
      toast.error('Please provide evidence ID and upload a file')
      return
    }

    setVerifying(true)

    try {
      // Get evidence from blockchain
      const evidence = await contract.getEvidence(evidenceId)
      
      console.log('Evidence from blockchain:', evidence)
      console.log('Stored hash:', evidence.evidenceHash)
      console.log('Current hash:', fileHash)
      
      // Compare hashes directly (they're already strings)
      const storedHash = evidence.evidenceHash.toLowerCase()
      const currentHash = fileHash.toLowerCase()
      const isValid = storedHash === currentHash
      
      console.log('Hash comparison:', { storedHash, currentHash, isValid })
      
      // If tampering detected, trigger an alert
      if (!isValid) {
        try {
          console.log('🚨 Tampering detected! Triggering alert...')
          const alertTx = await contract.triggerAlert(
            evidenceId,
            'TAMPERING_DETECTED',
            `Hash mismatch detected during verification. Expected: ${storedHash.slice(0, 16)}..., Found: ${currentHash.slice(0, 16)}...`
          )
          await alertTx.wait()
          console.log('✅ Alert triggered successfully')
          toast.success('Security alert has been triggered for this tampering attempt')
        } catch (alertError) {
          console.error('Error triggering alert:', alertError)
          // Continue even if alert fails
        }
      }
      
      if (isValid) {
        setResult({
          verified: true,
          message: 'Evidence integrity verified! The file matches the blockchain record.',
          details: {
            evidenceId: evidence.evidenceId,
            caseId: evidence.caseId,
            registeredHash: evidence.evidenceHash,
            currentHash: fileHash,
            collector: evidence.collector,
            createdAt: new Date(Number(evidence.createdAt) * 1000).toLocaleString()
          }
        })
        toast.success('Evidence verified successfully!')
      } else {
        setResult({
          verified: false,
          message: 'WARNING: Evidence integrity check FAILED! The file does not match the blockchain record.',
          details: {
            evidenceId: evidence.evidenceId,
            registeredHash: evidence.evidenceHash,
            currentHash: fileHash,
            mismatch: true
          }
        })
        toast.error('Evidence verification failed!')
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      setResult({
        verified: false,
        message: error.reason || 'Evidence not found or verification failed'
      })
      toast.error('Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Evidence Integrity</h1>
          <p className="text-gray-600 mt-1">
            Upload a file to verify its authenticity against the blockchain record
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {/* Evidence ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence ID *
              </label>
              <input
                type="text"
                value={evidenceId}
                onChange={(e) => setEvidenceId(e.target.value)}
                placeholder="EV-2024-001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File for Verification *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="verify-file-upload"
                />
                <label
                  htmlFor="verify-file-upload"
                  className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium"
                >
                  Click to upload file
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Upload the file you want to verify
                </p>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {fileHash && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Calculated Hash:</p>
                      <p className="text-xs font-mono text-gray-600 break-all mt-1">{fileHash}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={!isConnected || !evidenceId || !file || verifying}
              className="w-full py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying...' : 'Verify Evidence'}
            </button>
          </div>
        </div>

        {/* Verification Result */}
        {result && (
          <div className={`rounded-xl border-2 p-6 ${
            result.verified
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-start gap-4">
              {result.verified ? (
                <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${
                  result.verified ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.verified ? 'Verification Successful' : 'Verification Failed'}
                </h3>
                <p className={`mb-4 ${
                  result.verified ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>

                {result.details && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Details:</h4>
                    <div className="space-y-2 text-sm">
                      {result.details.evidenceId && (
                        <div>
                          <span className="font-medium text-gray-700">Evidence ID:</span>{' '}
                          <span className="text-gray-900">{result.details.evidenceId}</span>
                        </div>
                      )}
                      {result.details.caseId && (
                        <div>
                          <span className="font-medium text-gray-700">Case ID:</span>{' '}
                          <span className="text-gray-900">{result.details.caseId}</span>
                        </div>
                      )}
                      {result.details.createdAt && (
                        <div>
                          <span className="font-medium text-gray-700">Registered:</span>{' '}
                          <span className="text-gray-900">{result.details.createdAt}</span>
                        </div>
                      )}
                      {result.details.collector && (
                        <div>
                          <span className="font-medium text-gray-700">Collected By:</span>{' '}
                          <span className="text-gray-900 font-mono">
                            {result.details.collector.slice(0, 10)}...{result.details.collector.slice(-8)}
                          </span>
                        </div>
                      )}
                      {result.details.mismatch && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="flex items-center gap-2 text-red-700 mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-semibold">Hash Mismatch Detected</span>
                          </div>
                          <div className="space-y-1">
                            <div>
                              <span className="font-medium text-gray-700">Blockchain Hash:</span>
                              <p className="font-mono text-xs break-all">{result.details.registeredHash}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Current File Hash:</span>
                              <p className="font-mono text-xs break-all">{result.details.currentHash}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            How Verification Works:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload the file you want to verify</li>
            <li>• System calculates SHA-256 hash of the file</li>
            <li>• Hash is compared with the blockchain record</li>
            <li>• If hashes match, evidence integrity is confirmed</li>
            <li>• Any modification to the file will result in a different hash</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

export default EvidenceVerify
