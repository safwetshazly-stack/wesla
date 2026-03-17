// SessionsListPage.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSessions } from '../../hooks/useApi'
import { PageLoader, Badge, EmptyState } from '../../components/ui'
import { Calendar, ChevronLeft } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ar } from 'date-fns/locale'

const TABS = [
  { value: '', label: 'الكل' },
  { value: 'REQUESTED', label: 'انتظار' },
  { value: 'CONFIRMED', label: 'مؤكدة' },
  { value: 'IN_PROGRESS', label: 'جارية' },
  { value: 'COMPLETED', label: 'مكتملة' },
  { value: 'CANCELLED', label: 'ملغاة' },
]

const STATUS_BADGE: Record<string, { label: string; variant: any }> = {
  REQUESTED: { label: 'انتظار', variant: 'pending' },
  CONFIRMED: { label: 'مؤكدة', variant: 'info' },
  IN_PROGRESS: { label: 'جارية', variant: 'success' },
  COMPLETED: { label: 'مكتملة', variant: 'verified' },
  CANCELLED: { label: 'ملغاة', variant: 'suspended' },
  DISPUTED: { label: 'نزاع', variant: 'suspended' },
}

export default function SessionsListPage() {
  const [activeTab, setActiveTab] = useState('')
  const { data, isLoading } = useSessions({ status: activeTab || undefined })
  const sessions = data?.sessions || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-5">جلساتي</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === t.value
                ? 'bg-wasla-green text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-wasla-green'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <PageLoader /> : sessions.length === 0 ? (
        <EmptyState
          icon={<Calendar size={48} />}
          title="لا توجد جلسات"
          description="ابحث عن مساعد وابدأ أول جلسة"
          action={<Link to="/helpers" className="btn-primary text-sm px-5 py-2">ابحث الآن</Link>}
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s: any) => {
            const st = STATUS_BADGE[s.status] || { label: s.status, variant: 'gray' }
            return (
              <Link key={s.id} to={`/sessions/${s.id}`} className="card p-4 flex items-center gap-4 block">
                <div className="w-12 h-12 rounded-2xl bg-wasla-green/10 flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-wasla-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 truncate">
                      {s.helper?.fullName || s.seeker?.fullName}
                    </p>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    {format(new Date(s.scheduledStart), 'd MMM yyyy - h:mm a', { locale: ar })}
                  </p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="font-bold text-wasla-green">{Number(s.priceEgp)} جنيه</p>
                  <ChevronLeft size={16} className="text-gray-400 mr-auto" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
