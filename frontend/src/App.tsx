import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth.store'

// Layouts
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'

// Public pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OtpPage from './pages/auth/OtpPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Seeker pages
import SeekerDashboard from './pages/dashboard/SeekerDashboard'
import SearchHelpersPage from './pages/helpers/SearchHelpersPage'
import HelperProfilePage from './pages/helpers/HelperProfilePage'
import BookSessionPage from './pages/sessions/BookSessionPage'
import SessionsListPage from './pages/sessions/SessionsListPage'
import SessionDetailPage from './pages/sessions/SessionDetailPage'
import SessionRoomPage from './pages/sessions/SessionRoomPage'
import WalletPage from './pages/payments/WalletPage'

// Helper pages
import HelperDashboard from './pages/dashboard/HelperDashboard'
import HelperProfileEditPage from './pages/helpers/HelperProfileEditPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSessionsPage from './pages/admin/AdminSessionsPage'
import AdminDisputesPage from './pages/admin/AdminDisputesPage'

// Guards
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.userType !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
        <Route path="/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />
        <Route path="/verify-otp" element={<OtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* App — authenticated */}
      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route path="/dashboard" element={<DashboardRouter />} />

        {/* Search & helpers */}
        <Route path="/helpers" element={<SearchHelpersPage />} />
        <Route path="/helpers/:id" element={<HelperProfilePage />} />
        <Route path="/helpers/:id/book" element={<BookSessionPage />} />

        {/* Sessions */}
        <Route path="/sessions" element={<SessionsListPage />} />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />

        {/* Wallet */}
        <Route path="/wallet" element={<WalletPage />} />

        {/* Helper-only */}
        <Route path="/profile/edit" element={<HelperProfileEditPage />} />
      </Route>

      {/* Session room (fullscreen) */}
      <Route path="/room/:sessionId" element={<RequireAuth><SessionRoomPage /></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin" element={<RequireAdmin><DashboardLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="sessions" element={<AdminSessionsPage />} />
        <Route path="disputes" element={<AdminDisputesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Routes to appropriate dashboard based on user type
function DashboardRouter() {
  const { user } = useAuthStore()
  if (user?.userType === 'HELPER') return <HelperDashboard />
  return <SeekerDashboard />
}
