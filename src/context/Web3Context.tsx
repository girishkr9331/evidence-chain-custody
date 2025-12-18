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

      // Load contract first, then set isConnected
      try {
        const contractData = await import('../contracts/EvidenceChainOfCustody.json')
        
        // Check if contract address exists
        if (!contractData.address || contractData.address === '0x0000000000000000000000000000000000000000') {
          throw new Error('Contract address not configured')
        }
        
        const evidenceContract = new Contract(
          contractData.address,
          contractData.abi,
          signer
        )
        
        // Test if contract is actually deployed
        try {
          const code = await web3Provider.getCode(contractData.address)
          if (code === '0x') {
            throw new Error('Contract not deployed at this address. Please deploy the smart contract first.')
          }
        } catch (codeError) {
          console.error('Contract deployment check failed:', codeError)
          throw new Error('Contract not deployed on this network. Please run: cd blockchain && npx hardhat run scripts/deploy.js --network localhost')
        }
        
        // Only set these if contract is successfully loaded
        setContract(evidenceContract)
        setIsConnected(true)
        toast.success('Wallet and contract connected successfully!')
      } catch (error: any) {
        console.error('Contract not deployed:', error)
        setContract(null)
        setIsConnected(false)
        toast.error(error.message || 'Smart contract not found. Please deploy the contract first.')
      }

    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      toast.error(error.message || 'Failed to connect wallet')
    }
  }

  useEffect(() => {
    if (window.ethereum) {
      const ethereumProvider = window.ethereum as Eip1193Provider
      
      // Handle account changes
      ethereumProvider.on?.('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null)
          setIsConnected(false)
          toast.error('Wallet disconnected')
        } else {
          setAccount(accounts[0])
          toast.success('Account changed')
        }
      })

      // Handle chain changes
      ethereumProvider.on?.('chainChanged', () => {
        window.location.reload()
      })
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
    ethereum?: Eip1193Provider
  }
}
