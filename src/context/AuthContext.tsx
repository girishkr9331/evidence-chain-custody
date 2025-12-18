import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from '../config/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  address: string
  name: string
  role: string
  department: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (address: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  loading: boolean
}

interface RegisterData {
  address: string
  password: string
  name: string
  role: string
  department: string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
    
    setLoading(false)
  }, [])

  const login = async (address: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { address, password })
      const { token: authToken, user: userData } = response.data
      
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
      
      setToken(authToken)
      setUser(userData)
      toast.success('Login successful!')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await axios.post('/api/auth/register', data)
      toast.success(response.data.message || 'Registration successful!')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
