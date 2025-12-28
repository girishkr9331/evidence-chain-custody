import { useEffect, useState } from 'react'
import { Users, UserPlus, UserCheck, UserX, Shield, Filter, Search, Wallet, Edit2, Copy, Check } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import UserStatsCard from '../components/UserStatsCard'
import ConfirmDialog from '../components/ConfirmDialog'
import UserAvatar from '../components/UserAvatar'
import api from '../config/api'

interface User {
  address: string
  role: number | string
  name: string
  department: string
  isActive: boolean
  registeredAt?: number
  onBlockchain?: boolean
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false)
  const [newUser, setNewUser] = useState({
    address: '',
    role: '1',
    name: '',
    department: ''
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editRole, setEditRole] = useState('')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const { contract, isConnected, account } = useWeb3()
  const { user, isAdmin } = useAuth()

  const roles = [
    { value: '1', label: 'Police' },
    { value: '2', label: 'Investigator' },
    { value: '3', label: 'Forensic Lab' },
    { value: '4', label: 'Court' },
    { value: '5', label: 'Cyber Unit' }
  ]

  useEffect(() => {
    loadUsers()
    checkIfAdmin()
  }, [contract, isConnected, account, user])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, roleFilter, statusFilter, users])

  const checkIfAdmin = async () => {
    if (!contract || !isConnected || !account) {
      console.log('❌ Admin check failed: Missing contract, connection, or account')
      setIsCurrentUserAdmin(false)
      return
    }

    try {
      // Check if current account is the contract admin
      const contractAdmin = await contract.admin()
      const isAdmin = account.toLowerCase() === contractAdmin.toLowerCase()
      
      console.log('👤 Admin check:', {
        currentAccount: account,
        contractAdmin: contractAdmin,
        isAdmin: isAdmin
      })
      
      if (isAdmin) {
        console.log('✅ You are the contract admin! You can add users.')
      } else {
        console.log('❌ You are NOT the admin. Only', contractAdmin, 'can add users.')
        console.log('💡 To become admin, deploy the contract with your wallet address.')
      }
      
      setIsCurrentUserAdmin(isAdmin)
    } catch (error) {
      console.error('❌ Error checking admin status:', error)
      setIsCurrentUserAdmin(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((user) => user.role === parseInt(roleFilter))
    }

    // Status filter
    if (statusFilter === 'ACTIVE') {
      filtered = filtered.filter((user) => user.isActive)
    } else if (statusFilter === 'INACTIVE') {
      filtered = filtered.filter((user) => !user.isActive)
    }

    setFilteredUsers(filtered)
  }

  const handleFillCurrentWallet = () => {
    if (account) {
      setNewUser({...newUser, address: account})
      toast.success('Current wallet address filled')
    }
  }

  const copyAddressToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      toast.success('Address copied to clipboard!')
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy address')
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    
    try {
      // Load users from database
      const response = await api.get('/api/users')
      
      const dbUsers = response.data
      console.log('📊 Loaded users from database:', dbUsers.length)
      
      // Map database users and convert role string to number
      const roleMapping: { [key: string]: number } = {
        'POLICE': 1,
        'INVESTIGATOR': 2,
        'FORENSIC_LAB': 3,
        'COURT': 4,
        'CYBER_UNIT': 5
      }
      
      const usersData: User[] = dbUsers.map((user: any) => ({
        address: user.address,
        role: typeof user.role === 'string' ? (roleMapping[user.role] || 0) : user.role,
        name: user.name,
        department: user.department,
        isActive: user.isActive,
        onBlockchain: false // Will check blockchain status if connected
      }))
      
      // If blockchain is connected, check which users are on blockchain
      if (contract && isConnected) {
        console.log('🔗 Checking blockchain status for users...')
        
        for (const user of usersData) {
          try {
            const blockchainUser = await contract.getUser(user.address)
            user.onBlockchain = blockchainUser.isActive
            // Keep database status as source of truth, only store timestamp from blockchain
            user.registeredAt = Number(blockchainUser.registeredAt)
            // Store blockchain role separately for reference
            const blockchainRole = Number(blockchainUser.role)
            console.log(`📊 User ${user.name}: DB role=${user.role}, Blockchain role=${blockchainRole}, DB active=${user.isActive}`)
          } catch (error) {
            // User not on blockchain yet
            user.onBlockchain = false
          }
        }
      }
      
      console.log('✅ Total users loaded:', usersData.length)
      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error) {
      console.error('❌ Error loading users:', error)
      toast.error('Failed to load users from database')
      setUsers([])
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  const getUserStats = () => {
    const activeUsers = users.filter((u) => u.isActive).length
    const inactiveUsers = users.filter((u) => !u.isActive).length
    const adminCount = users.filter((u) => u.role === 0 && u.isActive).length
    return {
      totalUsers: users.length,
      activeUsers,
      inactiveUsers,
      adminCount
    }
  }

  const handleAddUser = async () => {
    if (!contract) return
    
    // Validate input
    if (!newUser.address || !newUser.name || !newUser.department) {
      toast.error('Please fill in all fields')
      return
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(newUser.address)) {
      toast.error('Invalid Ethereum address format')
      return
    }

    let toastId: string | undefined

    try {
      // Check if user already exists on blockchain
      try {
        const existingUser = await contract.getUser(newUser.address)
        // If we get here and user is active, they already exist
        if (existingUser && existingUser.isActive) {
          toast.error('User with this address is already registered on blockchain')
          return
        }
      } catch (checkError) {
        // If getUser fails, it means user doesn't exist yet, which is fine
        console.log('User does not exist yet (expected for new users)')
      }

      toastId = toast.loading('Registering user on blockchain...')
      
      // Step 1: Register on blockchain
      const tx = await contract.registerUser(
        newUser.address,
        parseInt(newUser.role),
        newUser.name,
        newUser.department
      )
      
      toast.dismiss(toastId)
      toastId = toast.loading('Processing blockchain transaction...')
      
      const receipt = await tx.wait()
      
      console.log('Blockchain transaction receipt:', receipt)
      
      // Step 2: Register in database
      toast.dismiss(toastId)
      toastId = toast.loading('Saving user to database...')
      
      try {
        const response = await api.post('/api/users/create', {
          address: newUser.address,
          name: newUser.name,
          role: newUser.role,
          department: newUser.department
        })
        
        console.log('✅ Database registration successful:', response.data)
        
        toast.dismiss(toastId)
        toast.success('User registered successfully on blockchain and database!')
        
        // Verify user was saved by fetching from database
        try {
          const verifyResponse = await api.get(`/api/users/${newUser.address}`)
          console.log('✅ User verified in database:', verifyResponse.data)
        } catch (verifyError) {
          console.warn('⚠️ Could not verify user in database:', verifyError)
        }
      } catch (dbError: any) {
        console.error('❌ Database registration error:', dbError)
        console.error('Error details:', {
          message: dbError.response?.data?.message,
          status: dbError.response?.status,
          data: dbError.response?.data
        })
        toast.dismiss(toastId)
        
        // User is on blockchain but not in database - warn but don't fail completely
        if (dbError.response?.data?.message?.includes('already exists')) {
          toast.success('User registered on blockchain (already in database)')
        } else {
          toast.error(`User registered on blockchain, but database sync failed: ${dbError.response?.data?.message || 'Unknown error'}`)
          console.error('💡 Make sure MongoDB is running and the backend server is connected to the database')
        }
      }
      
      setShowAddUser(false)
      setNewUser({ address: '', role: '1', name: '', department: '' })
      
      // Reload users after a delay to ensure blockchain state is updated
      setTimeout(() => {
        loadUsers()
      }, 1500)
    } catch (error: any) {
      if (toastId) {
        toast.dismiss(toastId)
      }
      console.error('Registration error:', error)
      
      let errorMessage = 'Failed to register user'
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'User with this address is already registered'
      } else if (error.reason) {
        errorMessage = error.reason
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  }


  const handleToggleUser = async (address: string, isActive: boolean) => {
    let toastId: string | undefined

    try {
      toastId = toast.loading(`${isActive ? 'Deactivating' : 'Activating'} user...`)
      
      await api.patch(`/api/users/${address}/status`, {
        isActive: !isActive
      })
      
      toast.dismiss(toastId)
      toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully!`)
      
      loadUsers()
    } catch (error: any) {
      if (toastId) {
        toast.dismiss(toastId)
      }
      console.error('Error updating user:', error)
      toast.error(error.response?.data?.message || 'Failed to update user')
    }
  }

  const handleEditRole = (user: User) => {
    setEditingUser(user)
    setEditRole(user.role.toString())
    setShowEditDialog(true)
  }

  const handleSaveRole = async () => {
    if (!editingUser) return

    const roleMapping: { [key: string]: string } = {
      '1': 'POLICE',
      '2': 'INVESTIGATOR',
      '3': 'FORENSIC_LAB',
      '4': 'COURT',
      '5': 'CYBER_UNIT'
    }

    let toastId: string | undefined

    try {
      // Update in database
      toastId = toast.loading('Updating role in database...')
      
      await api.patch(`/api/users/${editingUser.address}/role`, {
        role: roleMapping[editRole]
      })
      
      toast.dismiss(toastId)
      toast.success('Role updated successfully!')
      
      setShowEditDialog(false)
      setEditingUser(null)
      loadUsers()
    } catch (error: any) {
      if (toastId) {
        toast.dismiss(toastId)
      }
      console.error('Role update error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to update user role')
    }
  }

  const getRoleName = (role: number | string) => {
    // Handle numeric roles
    if (typeof role === 'number') {
      const roleNames = ['NONE', 'POLICE', 'INVESTIGATOR', 'FORENSIC_LAB', 'COURT', 'CYBER_UNIT']
      return roleNames[role] || 'UNKNOWN'
    }
    // Handle string roles (already in the correct format)
    return role || 'UNKNOWN'
  }

  const getRoleColor = (role: number | string) => {
    // Convert role to number if it's a string
    let roleNum = typeof role === 'number' ? role : 0
    
    if (typeof role === 'string') {
      const roleMapping: { [key: string]: number } = {
        'POLICE': 1,
        'INVESTIGATOR': 2,
        'FORENSIC_LAB': 3,
        'COURT': 4,
        'CYBER_UNIT': 5
      }
      roleNum = roleMapping[role] || 0
    }
    
    const colors = [
      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
    ]
    return colors[roleNum] || colors[0]
  }

  // Admin-only access check
  if (!loading && !isAdmin()) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              User Management is restricted to administrators only. This page contains sensitive user information and system configuration.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Need access?</strong> Contact your system administrator to request admin privileges.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    )
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

  return (
    <Layout>
      {/* Edit Role Dialog */}
      {showEditDialog && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowEditDialog(false)} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Edit User Role
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {editingUser.name} ({editingUser.address.slice(0, 10)}...{editingUser.address.slice(-8)})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs text-blue-800 dark:text-blue-300">
                        The database role will be updated immediately. This role is used for all system permissions including evidence upload.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveRole}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Update Role
                </button>
                <button
                  onClick={() => {
                    setShowEditDialog(false)
                    setEditingUser(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Manage system users and permissions</p>
          </div>
          <div className="relative group">
            <button
              onClick={() => isCurrentUserAdmin && setShowAddUser(true)}
              disabled={!isCurrentUserAdmin}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isCurrentUserAdmin
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </button>
            {!isCurrentUserAdmin && (
              <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-64 z-50">
                <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
                  <p className="font-semibold mb-1">⚠️ Not Authorized</p>
                  <p>You need admin privileges to register new users. Please contact an administrator.</p>
                  <div className="absolute bottom-full right-4 -mb-1">
                    <div className="border-8 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {isConnected && users.length > 0 && (
          <UserStatsCard {...getUserStats()} />
        )}

        {/* Database Users Info */}
        {users.length > 0 && users.some(u => !u.onBlockchain) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Database Users Detected
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>{users.filter(u => !u.onBlockchain).length}</strong> user(s) are stored in the database but not on the blockchain. 
                  These users are shown with a "DB Only" badge. They can still login and use the system, but for full functionality, 
                  they should be registered on the blockchain using the "Add User" button.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {isConnected && users.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search by name, address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <Shield className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 md:w-5 md:h-5" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="0">Admin</option>
                  <option value="1">Officer</option>
                  <option value="2">Analyst</option>
                  <option value="3">Viewer</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 md:w-5 md:h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>
            </div>

            <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
              <span className="font-medium">{users.length}</span> users
            </div>
          </div>
        )}

        {showAddUser && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Register New User</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wallet Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUser.address}
                    onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                    placeholder="0x..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                  />
                  <button
                    onClick={handleFillCurrentWallet}
                    disabled={!account}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Use my wallet address"
                  >
                    <Wallet className="w-4 h-4" />
                    Use My Wallet
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  placeholder="Cyber Crime"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Register User
              </button>
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Wallet Not Connected
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to view and manage users
            </p>
          </div>
        ) : filteredUsers.length === 0 && users.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No users match your filters
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Users Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No users have been registered yet
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.address} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <UserAvatar 
                            userAddress={user.address}
                            userName={user.name}
                            size="sm"
                            showName={true}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => copyAddressToClipboard(user.address)}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-mono hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                            title="Click to copy full address"
                          >
                            <span>{user.address.slice(0, 10)}...{user.address.slice(-8)}</span>
                            {copiedAddress === user.address ? (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.department}</td>
                        <td className="px-6 py-4">
                          {user.isActive ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                              <UserCheck className="w-4 h-4" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                              <UserX className="w-4 h-4" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {user.onBlockchain ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Blockchain
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              DB Only
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {isAdmin() && (
                              <>
                                <button
                                  onClick={() => handleEditRole(user)}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                                  title="Edit role"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleUser(user.address, user.isActive)}
                                  className={`text-sm font-medium ${
                                    user.isActive ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300' : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                                  }`}
                                >
                                  {user.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              </>
                            )}
                            {!isAdmin() && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Admin only
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.address}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <UserAvatar 
                        userAddress={user.address}
                        userName={user.name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                          {user.name}
                        </h3>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {user.isActive ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                          <UserCheck className="w-4 h-4" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                          <UserX className="w-4 h-4" /> Inactive
                        </span>
                      )}
                      {user.onBlockchain ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Blockchain
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          DB Only
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Address:</span>
                      <button
                        onClick={() => copyAddressToClipboard(user.address)}
                        className="flex items-center gap-2 text-xs text-gray-900 dark:text-white font-mono hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Click to copy full address"
                      >
                        <span className="break-all">{user.address}</span>
                        {copiedAddress === user.address ? (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <Copy className="w-4 h-4 flex-shrink-0" />
                        )}
                      </button>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Department:</span>
                      <p className="text-sm text-gray-900 dark:text-white">{user.department}</p>
                    </div>
                  </div>

                  {isAdmin() && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleEditRole(user)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleToggleUser(user.address, user.isActive)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          user.isActive 
                            ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20' 
                            : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default UserManagement
