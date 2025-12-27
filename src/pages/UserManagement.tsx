import { useEffect, useState } from 'react'
import { Users, UserPlus, UserCheck, UserX, Shield, Filter, Search, Wallet } from 'lucide-react'
import Layout from '../components/Layout'
import { useWeb3 } from '../context/Web3Context'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import UserStatsCard from '../components/UserStatsCard'
import api from '../config/api'

interface User {
  address: string
  role: number
  name: string
  department: string
  isActive: boolean
  registeredAt: number
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
  const { contract, isConnected, account } = useWeb3()
  const { token } = useAuth()

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
  }, [contract, isConnected, account])

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

  const loadUsers = async () => {
    if (!contract || !isConnected) {
      setLoading(false)
      setUsers([])
      return
    }

    try {
      const userAddresses = await contract.getAllUsers()
      const usersData: User[] = []

      for (const address of userAddresses) {
        try {
          const user = await contract.getUser(address)
          usersData.push({
            address: address,
            role: Number(user.role),
            name: user.name,
            department: user.department,
            isActive: user.isActive,
            registeredAt: Number(user.registeredAt)
          })
        } catch (err) {
          console.error('Error loading user:', address, err)
        }
      }

      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
      // Only show error if we actually have a contract and tried to load
      // Don't show error on initial load when wallet isn't connected
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
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log('Database response:', response.data)
        
        toast.dismiss(toastId)
        toast.success('User registered successfully on blockchain and database!')
      } catch (dbError: any) {
        console.error('Database registration error:', dbError)
        toast.dismiss(toastId)
        
        // User is on blockchain but not in database - warn but don't fail completely
        if (dbError.response?.data?.message?.includes('already exists')) {
          toast.success('User registered on blockchain (already in database)')
        } else {
          toast.error('User registered on blockchain, but database sync failed. User may need to register their password.')
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
    if (!contract) return

    let toastId: string | undefined

    try {
      toastId = toast.loading('Updating user status on blockchain...')
      
      // Step 1: Update on blockchain
      const tx = isActive 
        ? await contract.deactivateUser(address)
        : await contract.activateUser(address)
      
      await tx.wait()
      
      // Step 2: Update in database
      toast.dismiss(toastId)
      toastId = toast.loading('Syncing status to database...')
      
      try {
        await api.patch(`/api/users/${address}/status`, {
          isActive: !isActive
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        toast.dismiss(toastId)
        toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully!`)
      } catch (dbError) {
        console.error('Database status update error:', dbError)
        toast.dismiss(toastId)
        toast.error(`User ${isActive ? 'deactivated' : 'activated'} on blockchain, but database sync failed`)
      }
      
      loadUsers()
    } catch (error: any) {
      if (toastId) {
        toast.dismiss(toastId)
      }
      toast.error(error.reason || 'Failed to update user')
    }
  }

  const getRoleName = (role: number) => {
    const roleNames = ['NONE', 'POLICE', 'INVESTIGATOR', 'FORENSIC_LAB', 'COURT', 'CYBER_UNIT']
    return roleNames[role] || 'UNKNOWN'
  }

  const getRoleColor = (role: number) => {
    const colors = [
      'bg-gray-100 text-gray-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-cyan-100 text-cyan-700'
    ]
    return colors[role] || 'bg-gray-100 text-gray-700'
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage system users and permissions</p>
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

        {/* Filters */}
        {isConnected && users.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, address, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
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
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.address} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {user.address.slice(0, 10)}...{user.address.slice(-8)}
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
                        <button
                          onClick={() => handleToggleUser(user.address, user.isActive)}
                          className={`text-sm font-medium ${
                            user.isActive ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300' : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default UserManagement
