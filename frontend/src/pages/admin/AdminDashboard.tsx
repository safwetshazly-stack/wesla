// Stub pages — each in its own export for the router
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { PageLoader, Badge, StatCard } from '../../components/ui'
import { Users, Calendar, AlertTriangle, DollarSign } from 'lucide-react'

// ─── AdminDashboard ──────────────────────────────────────
export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/api/v1/admin/stats').then((r) => r.data.data),
  })
  if (isLoading) return <PageLoader />
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="إجمالي المستخدمين" value={data?.users?.total || 0} icon={<Users size={18} />} />
        <StatCard label="المساعدون" value={data?.users?.helpers || 0} icon={<Users size={18} />} />
        <StatCard label="إجمالي الجلسات" value={data?.sessions?.total || 0} icon={<Calendar size={18} />} />
        <StatCard label="إيرادات المنصة" value={`${data?.revenue?.totalEgp || 0} جنيه`} icon={<DollarSign size={18} />} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="font-semibold text-yellow-800">طلبات التحقق</p>
          <p className="text-3xl font-bold text-yellow-700 mt-1">{data?.pending?.verifications || 0}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="font-semibold text-red-800">نزاعات مفتوحة</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{data?.pending?.disputes || 0}</p>
        </div>
      </div>
    </div>
  )
}
export default AdminDashboard

// ─── AdminUsersPage ──────────────────────────────────────
export function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/api/v1/admin/users').then((r) => r.data.data),
  })
  if (isLoading) return <PageLoader />
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-2xl border border-gray-100 text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-right px-4 py-3 text-gray-500 font-medium">الاسم</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">النوع</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">الحالة</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">الجلسات</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users || []).map((u: any) => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.fullName}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-3">{u.userType === 'HELPER' ? 'مساعد' : 'طالب'}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.verificationStatus === 'VERIFIED' ? 'verified' : u.verificationStatus === 'SUSPENDED' ? 'suspended' : 'pending'}>
                    {u.verificationStatus === 'VERIFIED' ? 'موثّق' : u.verificationStatus === 'SUSPENDED' ? 'موقوف' : 'انتظار'}
                  </Badge>
                </td>
                <td className="px-4 py-3">{u.totalSessions}</td>
                <td className="px-4 py-3">{Number(u.walletBalanceEgp).toFixed(0)} جنيه</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── AdminSessionsPage ───────────────────────────────────
export function AdminSessionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'sessions'],
    queryFn: () => api.get('/api/v1/admin/sessions').then((r) => r.data.data),
  })
  if (isLoading) return <PageLoader />
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">إدارة الجلسات</h1>
      <div className="space-y-2">
        {(data?.sessions || []).map((s: any) => (
          <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{s.helper?.fullName} ← {s.seeker?.fullName}</p>
              <p className="text-xs text-gray-400">{s.status} · {Number(s.payment?.amountEgp || 0)} جنيه</p>
            </div>
            <Badge variant={s.status === 'COMPLETED' ? 'verified' : s.status === 'CANCELLED' ? 'suspended' : 'pending'}>
              {s.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AdminDisputesPage ───────────────────────────────────
export function AdminDisputesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'disputes'],
    queryFn: () => api.get('/api/v1/admin/disputes').then((r) => r.data.data),
  })
  if (isLoading) return <PageLoader />
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">النزاعات</h1>
      <div className="space-y-3">
        {(data?.disputes || []).map((d: any) => (
          <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{d.category}</p>
                <p className="text-sm text-gray-600 mt-1">{d.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {d.session?.helper?.fullName} ↔ {d.session?.seeker?.fullName} · {Number(d.session?.payment?.amountEgp || 0)} جنيه
                </p>
              </div>
              <Badge variant={d.status === 'RESOLVED' ? 'verified' : d.status === 'OPEN' ? 'suspended' : 'pending'}>
                {d.status === 'RESOLVED' ? 'محلول' : d.status === 'OPEN' ? 'مفتوح' : 'وساطة'}
              </Badge>
            </div>
          </div>
        ))}
        {!(data?.disputes?.length) && (
          <p className="text-center text-gray-400 py-10">لا توجد نزاعات 🎉</p>
        )}
      </div>
    </div>
  )
}
