import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWeb3 } from '../context/Web3Context'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    role: 'POLICE',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { connectWallet, account } = useWeb3()
  const navigate = useNavigate()

  const roles = [
    { value: 'POLICE', label: 'Police Officer' },
    { value: 'INVESTIGATOR', label: 'Investigator' },
    { value: 'FORENSIC_LAB', label: 'Forensic Lab' },
    { value: 'COURT', label: 'Court Official' },
    { value: 'CYBER_UNIT', label: 'Cyber Unit' }
  ]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    if (!account) {
      alert('Please connect your wallet first!')
      return
    }

    setLoading(true)

    try {
      await register({
        address: account,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        department: formData.department
      })
      navigate('/login')
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-600 rounded-2xl">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Register for Evidence Chain Platform
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Wallet Connection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={account || ''}
                  placeholder="Connect your wallet"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                  readOnly
                />
                <button
                  type="button"
                  onClick={connectWallet}
                  className="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  disabled={!!account}
                >
                  <Wallet className="w-5 h-5" />
                  {account ? 'Connected' : 'Connect'}
                </button>
              </div>
              {account && (
                <p className="mt-2 text-xs text-green-600">
                  ✓ Wallet connected
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Cyber Crime Investigation"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !account}
              className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
