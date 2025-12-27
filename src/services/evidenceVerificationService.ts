import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { Contract } from 'ethers'

export interface VerificationResult {
  verified: boolean
  message: string
  details?: {
    evidenceId: string
    caseId?: string
    registeredHash: string
    currentHash: string
    collector?: string
    createdAt?: string
    mismatch?: boolean
  }
}

class EvidenceVerificationService {
  // Verify evidence by checking backend first, then blockchain as fallback
  async verifyEvidence(
    evidenceId: string,
    fileHash: string,
    contract?: Contract
  ): Promise<VerificationResult> {
    console.log('🚀 Starting evidence verification...')
    console.log('📋 Evidence ID:', evidenceId)
    console.log('🔑 File Hash:', fileHash.slice(0, 16) + '...')
    console.log('⛓️ Blockchain contract available:', !!contract)
    
    // First, try to verify from backend (faster and persistent)
    const backendResult = await this.verifyFromBackend(evidenceId, fileHash)
    if (backendResult) {
      console.log('✅ Verified from backend database')
      return backendResult
    }

    console.log('⚠️ Backend verification returned null, trying blockchain...')

    // Fallback to blockchain if backend fails or evidence not found
    if (contract) {
      console.log('🔗 Checking blockchain...')
      return await this.verifyFromBlockchain(evidenceId, fileHash, contract)
    }

    console.log('❌ No data source available')
    // No data source available
    return {
      verified: false,
      message: 'Evidence not found in database or blockchain. Please ensure the evidence ID is correct and the blockchain is connected.'
    }
  }

  // Verify from backend database
  private async verifyFromBackend(
    evidenceId: string,
    fileHash: string
  ): Promise<VerificationResult | null> {
    try {
      console.log('🔍 Checking backend for evidence:', evidenceId)
      console.log('📡 API URL:', `${API_BASE_URL}/evidence/${evidenceId}`)
      
      const response = await axios.get(`${API_BASE_URL}/evidence/${evidenceId}`)
      
      console.log('📦 Backend response received:', response.status)
      
      if (response.data) {
        const evidence = response.data
        console.log('✅ Evidence found in backend:', evidence.evidenceId)
        
        const storedHash = evidence.fileHash.toLowerCase()
        const currentHash = fileHash.toLowerCase()
        const isValid = storedHash === currentHash

        console.log('🔐 Backend verification:', {
          evidenceId,
          storedHash: storedHash.slice(0, 16) + '...',
          currentHash: currentHash.slice(0, 16) + '...',
          isValid
        })

        if (isValid) {
          return {
            verified: true,
            message: 'Evidence integrity verified! The file matches the database record.',
            details: {
              evidenceId: evidence.evidenceId,
              caseId: evidence.caseId,
              registeredHash: evidence.fileHash,
              currentHash: fileHash,
              collector: evidence.uploadedBy,
              createdAt: new Date(evidence.createdAt).toLocaleString()
            }
          }
        } else {
          return {
            verified: false,
            message: 'WARNING: Evidence integrity check FAILED! The file does not match the database record.',
            details: {
              evidenceId: evidence.evidenceId,
              caseId: evidence.caseId,
              registeredHash: evidence.fileHash,
              currentHash: fileHash,
              mismatch: true
            }
          }
        }
      }

      return null
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️ Evidence not found in backend database (404)')
        return null
      }
      console.error('❌ Error verifying from backend:', error.message)
      if (error.code === 'ERR_NETWORK') {
        console.error('❌ Network error - backend might be down')
      }
      return null
    }
  }

  // Verify from blockchain
  private async verifyFromBlockchain(
    evidenceId: string,
    fileHash: string,
    contract: Contract
  ): Promise<VerificationResult> {
    try {
      const evidence = await contract.getEvidence(evidenceId)
      
      const storedHash = evidence.evidenceHash.toLowerCase()
      const currentHash = fileHash.toLowerCase()
      const isValid = storedHash === currentHash

      console.log('Blockchain verification:', {
        evidenceId,
        storedHash: storedHash.slice(0, 16) + '...',
        currentHash: currentHash.slice(0, 16) + '...',
        isValid
      })

      // Trigger alert if tampering detected
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
        } catch (alertError) {
          console.error('Error triggering alert:', alertError)
        }
      }

      if (isValid) {
        return {
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
        }
      } else {
        return {
          verified: false,
          message: 'WARNING: Evidence integrity check FAILED! The file does not match the blockchain record.',
          details: {
            evidenceId: evidence.evidenceId,
            registeredHash: evidence.evidenceHash,
            currentHash: fileHash,
            mismatch: true
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Blockchain verification error:', error)
      console.error('Error code:', error.code)
      console.error('Error reason:', error.reason)
      
      // If evidence doesn't exist on blockchain, provide helpful message
      if (error.reason?.includes('Evidence does not exist')) {
        return {
          verified: false,
          message: 'Evidence not found on blockchain. This evidence may only exist in the database. Please ensure the evidence was properly uploaded and synced to the blockchain.'
        }
      }
      
      return {
        verified: false,
        message: error.reason || 'Evidence not found or verification failed'
      }
    }
  }

  // Sync blockchain evidence to backend (call this after blockchain verification)
  async syncEvidenceToBackend(evidenceId: string, contract: Contract): Promise<boolean> {
    try {
      const evidence = await contract.getEvidence(evidenceId)
      
      // Check if already exists in backend
      try {
        const checkResponse = await axios.get(`${API_BASE_URL}/evidence/${evidenceId}`)
        if (checkResponse.data) {
          console.log('Evidence already synced to backend')
          return true
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          throw error
        }
        // Continue to sync if 404
      }

      // Sync to backend
      await axios.post(`${API_BASE_URL}/evidence`, {
        evidenceId: evidence.evidenceId,
        caseId: evidence.caseId,
        fileHash: evidence.evidenceHash,
        fileName: 'Unknown', // We don't have this from blockchain
        fileSize: 0,
        fileType: 'unknown',
        category: 'DIGITAL',
        description: evidence.metadata,
        uploadedBy: evidence.collector,
        blockchainTxHash: 'synced-from-blockchain',
        metadata: evidence.metadata
      })

      console.log('✅ Evidence synced to backend successfully')
      return true
    } catch (error) {
      console.error('Error syncing evidence to backend:', error)
      return false
    }
  }
}

export const evidenceVerificationService = new EvidenceVerificationService()
