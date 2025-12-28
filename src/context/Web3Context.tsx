import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { BrowserProvider, Contract, Eip1193Provider } from 'ethers'
import toast from 'react-hot-toast'

interface Web3ContextType {
  account: string | null
  contract: Contract | null
  provider: BrowserProvider | null
  connectWallet: () => Promise<void>
  isConnected: boolean
  networkId: number | null
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  contract: null,
  provider: null,
  connectWallet: async () => {},
  isConnected: false,
  networkId: null,
})

export const useWeb3 = () => useContext(Web3Context)

interface Web3ProviderProps {
  children: ReactNode
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [networkId, setNetworkId] = useState<number | null>(null)

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        toast.error('Please install MetaMask to use this application')
        return
      }

      const ethereumProvider = window.ethereum as Eip1193Provider
      const web3Provider = new BrowserProvider(ethereumProvider)
      
      // Request account access
      const accounts = await web3Provider.send('eth_requestAccounts', [])
      const signer = await web3Provider.getSigner()
      const address = await signer.getAddress()
      
      // Get network
      const network = await web3Provider.getNetwork()
      const chainId = Number(network.chainId)
      
      setAccount(address)
      setProvider(web3Provider)
      setNetworkId(chainId)

      // Load contract
      try {
        const contractData = await import('../contracts/EvidenceChainOfCustody.json')
        
        // Check if contract address exists
        if (!contractData.address || contractData.address === '0x0000000000000000000000000000000000000000') {
          console.warn('Contract address not configured')
          throw new Error('Contract address not configured. Please deploy the smart contract.')
        }
        
        // Test if contract is actually deployed
        const code = await web3Provider.getCode(contractData.address)
        if (code === '0x' || code === '0x0') {
          throw new Error('Contract not deployed at this address. Please run: cd blockchain && npx hardhat run scripts/deploy.js --network localhost')
        }
        
        // Create contract instance
        const evidenceContract = new Contract(
          contractData.address,
          contractData.abi,
          signer
        )
        
        // Verify contract is responsive (optional health check)
        try {
          // Try to call a view function to verify contract works
          await evidenceContract.totalEvidence()
        } catch (contractError) {
          console.warn('Contract health check warning:', contractError)
          // Continue anyway - contract might still work
        }
        
        // Set contract and connection status
        setContract(evidenceContract)
        setIsConnected(true)
        toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`)
      } catch (error: any) {
        console.error('Contract loading error:', error)
        setContract(null)
        setIsConnected(false)
        
        // Provide helpful error messages
        if (error.message.includes('not deployed')) {
          toast.error('Smart contract not deployed. Please deploy it first.')
        } else if (error.message.includes('not configured')) {
          toast.error('Contract address not found. Please check deployment.')
        } else {
          toast.error(error.message || 'Failed to load smart contract')
        }
      }

    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      toast.error(error.message || 'Failed to connect wallet')
    }
  }

  useEffect(() => {
    // Auto-connect if wallet was previously connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const ethereumProvider = window.ethereum as any
          const accounts = await ethereumProvider.request({ method: 'eth_accounts' })
          
          if (accounts && accounts.length > 0) {
            // Wallet is already connected, auto-connect
            console.log('Wallet already connected, auto-connecting...')
            await connectWallet()
          }
        } catch (error) {
          console.error('Auto-connect check failed:', error)
        }
      }
    }
    
    checkConnection()

    // Set up event listeners
    if (window.ethereum) {
      const ethereumProvider = window.ethereum as any
      
      // Handle account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null)
          setIsConnected(false)
          setContract(null)
          toast.error('Wallet disconnected')
        } else {
          setAccount(accounts[0])
          toast.success('Account changed')
        }
      }

      // Handle chain changes
      const handleChainChanged = () => {
        window.location.reload()
      }

      // Add event listeners
      ethereumProvider.on?.('accountsChanged', handleAccountsChanged)
      ethereumProvider.on?.('chainChanged', handleChainChanged)

      // Cleanup function
      return () => {
        ethereumProvider.removeListener?.('accountsChanged', handleAccountsChanged)
        ethereumProvider.removeListener?.('chainChanged', handleChainChanged)
      }
    }
  }, [])

  return (
    <Web3Context.Provider
      value={{
        account,
        contract,
        provider,
        connectWallet,
        isConnected,
        networkId,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      on?: (event: string, callback: (...args: any[]) => void) => void
      removeListener?: (event: string, callback: (...args: any[]) => void) => void
      request?: (args: { method: string; params?: any[] }) => Promise<any>
    }
  }
}
