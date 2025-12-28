import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Web3Provider } from './context/Web3Context'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import Register from './pages/Register'
import RegistrationStatus from './pages/RegistrationStatus'
import Dashboard from './pages/Dashboard'
import EvidenceUpload from './pages/EvidenceUpload'
import EvidenceList from './pages/EvidenceList'
import EvidenceDetails from './pages/EvidenceDetails'
import EvidenceVerify from './pages/EvidenceVerify'
import SyncEvidence from './pages/SyncEvidence'
import AuditTrail from './pages/AuditTrail'
import UserManagement from './pages/UserManagement'
import Alerts from './pages/Alerts'
import RegistrationApproval from './pages/RegistrationApproval'
import AdminChecker from './pages/AdminChecker'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <ThemeProvider>
        <Web3Provider>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <Toaster position="top-right" />
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/registration-status" element={<RegistrationStatus />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/evidence/upload" element={
                <ProtectedRoute>
                  <EvidenceUpload />
                </ProtectedRoute>
              } />
              
              <Route path="/evidence/list" element={
                <ProtectedRoute>
                  <EvidenceList />
                </ProtectedRoute>
              } />
              
              <Route path="/evidence/:id" element={
                <ProtectedRoute>
                  <EvidenceDetails />
                </ProtectedRoute>
              } />
              
              <Route path="/evidence-verify" element={
                <ProtectedRoute>
                  <EvidenceVerify />
                </ProtectedRoute>
              } />
              
              <Route path="/evidence-sync" element={
                <ProtectedRoute>
                  <SyncEvidence />
                </ProtectedRoute>
              } />
              
              <Route path="/audit-trail" element={
                <ProtectedRoute>
                  <AuditTrail />
                </ProtectedRoute>
              } />
              
              <Route path="/users" element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/alerts" element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              } />
              
              <Route path="/registration-approval" element={
                <ProtectedRoute>
                  <RegistrationApproval />
                </ProtectedRoute>
              } />
              
              <Route path="/admin-checker" element={
                <ProtectedRoute>
                  <AdminChecker />
                </ProtectedRoute>
              } />
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </AuthProvider>
        </Web3Provider>
      </ThemeProvider>
    </Router>
  )
}

export default App
