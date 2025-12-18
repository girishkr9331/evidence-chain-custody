import { Users, UserCheck, UserX, Shield } from 'lucide-react'

interface UserStatsCardProps {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  adminCount: number
}

const UserStatsCard = ({ totalUsers, activeUsers, inactiveUsers, adminCount }: UserStatsCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Total Users</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{totalUsers}</p>
          </div>
          <Users className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Active Users</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{activeUsers}</p>
          </div>
          <UserCheck className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-600">Inactive Users</p>
            <p className="text-2xl font-bold text-red-900 mt-1">{inactiveUsers}</p>
          </div>
          <UserX className="w-8 h-8 text-red-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">Admins</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{adminCount}</p>
          </div>
          <Shield className="w-8 h-8 text-purple-600" />
        </div>
      </div>
    </div>
  )
}

export default UserStatsCard
