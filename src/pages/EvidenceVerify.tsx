import { useState, ChangeEvent } from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle, Upload } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import toast from 'react-hot-toast'
import CryptoJS from 'crypto-js'
import { evidenceVerificationService, VerificationResult } from '../services/evidenceVerificationService'

const EvidenceVerify = () => {
  const [evidenceId, setEvidenceId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileHash, setFileHash] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
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
    if (!evidenceId || !fileHash) {
      toast.error('Please provide evidence ID and upload a file')
      return
    }

    setVerifying(true)
    const toastId = toast.loading('Verifying evidence...')

    try {
      // Use the verification service which checks backend first, then blockchain
      const verificationResult = await evidenceVerificationService.verifyEvidence(
        evidenceId,
        fileHash,
        contract
      )

      setResult(verificationResult)

      toast.dismiss(toastId)
      if (verificationResult.verified) {
        toast.success('Evidence verified successfully!')
      } else {
        toast.error('Evidence verification failed!')
        
        // If tampering detected and we have contract, trigger alert
        if (verificationResult.details?.mismatch && contract) {
          try {
            console.log('🚨 Triggering security alert for tampering...')
            const alertTx = await contract.triggerAlert(
              evidenceId,
              'TAMPERING_DETECTED',
              `Hash mismatch detected during verification`
            )
            await alertTx.wait()
            toast.success('Security alert has been triggered', { duration: 3000 })
          } catch (alertError) {
            console.error('Error triggering alert:', alertError)
          }
        }
      }

      // If verified from blockchain, sync to backend
      if (verificationResult.verified && contract && verificationResult.message.includes('blockchain')) {
        console.log('🔄 Syncing evidence to backend...')
        await evidenceVerificationService.syncEvidenceToBackend(evidenceId, contract)
      }
    } catch (error: any) {
      console.error('❌ Verification error:', error)
      toast.dismiss(toastId)
      
      // Provide more helpful error message
      let errorMessage = 'Verification failed. Please check the evidence ID and try again.'
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to backend server. Please ensure the server is running.'
      }
      
      setResult({
        verified: false,
        message: errorMessage
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verify Evidence Integrity</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Upload a file to verify its authenticity against the blockchain record
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {/* Evidence ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evidence ID *
              </label>
              <input
                type="text"
                value={evidenceId}
                onChange={(e) => setEvidenceId(e.target.value)}
                placeholder="EV-2024-001"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload File for Verification *
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="verify-file-upload"
                />
                <label
                  htmlFor="verify-file-upload"
                  className="cursor-pointer text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  Click to upload file
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Upload the file you want to verify
                </p>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {fileHash && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Calculated Hash:</p>
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all mt-1">{fileHash}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleVerify}
                disabled={!evidenceId || !file || verifying}
                className="flex-1 py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Verify Evidence'}
              </button>
              <button
                onClick={() => {
                  setEvidenceId('')
                  setFile(null)
                  setFileHash('')
                  setResult(null)
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Verification Result */}
        {result && (
          <div className={`rounded-xl border-2 p-6 ${
            result.verified
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
              : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
          }`}>
            <div className="flex items-start gap-4">
              {result.verified ? (
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${
                  result.verified ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                }`}>
                  {result.verified ? 'Verification Successful' : 'Verification Failed'}
                </h3>
                <p className={`mb-4 ${
                  result.verified ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }`}>
                  {result.message}
                </p>

                {result.details && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Details:</h4>
                    <div className="space-y-2 text-sm">
                      {result.details.evidenceId && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Evidence ID:</span>{' '}
                          <span className="text-gray-900 dark:text-white">{result.details.evidenceId}</span>
                        </div>
                      )}
                      {result.details.caseId && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Case ID:</span>{' '}
                          <span className="text-gray-900 dark:text-white">{result.details.caseId}</span>
                        </div>
                      )}
                      {result.details.createdAt && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Registered:</span>{' '}
                          <span className="text-gray-900 dark:text-white">{result.details.createdAt}</span>
                        </div>
                      )}
                      {result.details.collector && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Collected By:</span>{' '}
                          <span className="text-gray-900 dark:text-white font-mono">
                            {result.details.collector.slice(0, 10)}...{result.details.collector.slice(-8)}
                          </span>
                        </div>
                      )}
                      {result.details.mismatch && (
                        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-semibold">Hash Mismatch Detected</span>
                          </div>
                          <div className="space-y-1">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Blockchain Hash:</span>
                              <p className="font-mono text-xs text-gray-900 dark:text-gray-300 break-all">{result.details.registeredHash}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Current File Hash:</span>
                              <p className="font-mono text-xs text-gray-900 dark:text-gray-300 break-all">{result.details.currentHash}</p>
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            How Verification Works:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
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
