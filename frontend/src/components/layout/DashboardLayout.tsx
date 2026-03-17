import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Search, Calendar, Wallet,
  Bell, User, LogOut, Menu, X, ChevronDown,
  Star, Settings, Users, AlertTriangle
} from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { useNotifications, useMarkAllRead } from '../../hooks/useApi'
import { api } from '../../lib/api'
import clsx from 'clsx'

const seekerNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
  { to: '/helpers', icon: Search, label: 'ابحث عن مساعد' },
  { to: '/sessions', icon: Calendar, label: 'جلساتي' },
  { to: '/wallet', icon: Wallet, label: 'المحفظة' },
]

const helperNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/sessions', icon: Calendar, label: 'الجلسات' },
  { to: '/wallet', icon: Wallet, label: 'الأرباح' },
  { to: '/profile/edit', icon: User, label: 'ملفي الشخصي' },
]

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'الإحصائيات' },
  { to: '/admin/users', icon: Users, label: 'المستخدمون' },
  { to: '/admin/sessions', icon: Calendar, label: 'الجلسات' },
  { to: '/admin/disputes', icon: AlertTriangle, label: 'النزاعات' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const { data: notifications = [] } = useNotifications()
  const markAllRead = useMarkAllRead()

  const unreadCount = notifications.filter((n: any) => !n.isRead).length
  const nav = user?.userType === 'ADMIN' ? adminNav
    : user?.userType === 'HELPER' ? helperNav
    : seekerNav

  async function handleLogout() {
    try {
      const { refreshToken } = useAuthStore.getState()
      await api.post('/api/v1/auth/logout', { refreshToken })
    } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ─── Sidebar overlay (mobile) ─────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ──────────────────────────────────────── */}
      <aside className={clsx(
        'fixed top-0 right-0 h-full w-64 bg-white border-l border-gray-100 z-30',
        'flex flex-col shadow-lg transition-transform duration-300 ease-out',
        'lg:translate-x-0 lg:static lg:shadow-none',
        sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-wasla-green rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">و</span>
            </div>
            <span className="font-bold text-xl text-gray-900">وصلة</span>
          </div>
          <button
            className="lg:hidden btn-ghost p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-wasla-green/10 flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-wasla-green font-semibold text-sm">
                  {user?.fullName?.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500">
                {user?.userType === 'HELPER' ? 'مساعد' : user?.userType === 'ADMIN' ? 'مدير' : 'طالب مساعدة'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard' || to === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-wasla-green/10 text-wasla-green'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ─── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button
            className="lg:hidden btn-ghost p-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 mr-auto">
            {/* Notifications */}
            <div className="relative">
              <button
                className="relative btn-ghost p-2"
                onClick={() => {
                  setNotifOpen(!notifOpen)
                  if (!notifOpen && unreadCount > 0) markAllRead.mutate()
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {notifOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">الإشعارات</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">لا توجد إشعارات</p>
                    ) : (
                      notifications.slice(0, 10).map((n: any) => (
                        <div key={n.id} className={clsx(
                          'px-4 py-3 border-b border-gray-50 last:border-0',
                          !n.isRead && 'bg-green-50/40'
                        )}>
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wallet badge */}
            {user?.userType !== 'ADMIN' && (
              <NavLink to="/wallet" className="flex items-center gap-1.5 bg-wasla-green/10 text-wasla-green px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-wasla-green/20 transition-colors">
                <Wallet size={14} />
                {user?.walletBalanceEgp?.toFixed(0) || '0'} جنيه
              </NavLink>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
