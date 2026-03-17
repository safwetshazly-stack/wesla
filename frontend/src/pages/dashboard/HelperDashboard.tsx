import { Link } from 'react-router-dom'
import { Calendar, Wallet, Star, TrendingUp, CheckCircle, Clock, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { useSessions, useMyProfile } from '../../hooks/useApi'
import { useAcceptSession, useDeclineSession } from '../../hooks/useApi'
import { PageLoader, Badge, StarRating, StatCard } from '../../components/ui'
import { formatDistanceToNow, format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useState } from 'react'

export default function HelperDashboard() {
  const { user } = useAuthStore()
  const { data: profile } = useMyProfile()
  const { data: sessionsData, isLoading } = useSessions()
  const accept = useAcceptSession()
  const decline = useDeclineSession()
  const [declineReason, setDeclineReason] = useState('')
  const [decliningId, setDecliningId] = useState<string | null>(null)

  const allSessions = sessionsData?.sessions || []
  const pending = allSessions.filter((s: any) => s.status === 'REQUESTED')
  const upcoming = allSessions.filter((s: any) => s.status === 'CONFIRMED')
  const completed = allSessions.filter((s: any) => s.status === 'COMPLETED')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-wasla-teal to-wasla-dark rounded-3xl p-6 text-white">
        <p className="text-green-200 text-sm">مرحباً 👋</p>
        <h1 className="text-2xl font-bold mt-1">{user?.fullName}</h1>
        <div className="flex items-center gap-2 mt-1">
          <StarRating value={Number(user?.walletBalanceEgp || 0)} size={14} />
          <span className="text-green-200 text-sm">
            {Number(profile?.ratingAvg || 0).toFixed(1)} تقييم
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="الرصيد" value={`${Number(user?.walletBalanceEgp || 0).toFixed(0)} جنيه`}
          icon={<Wallet size={18} />} />
        <StatCard label="إجمالي الجلسات" value={profile?.totalSessions || 0}
          icon={<CheckCircle size={18} />} />
        <StatCard label="التقييم" value={`${Number(profile?.ratingAvg || 0).toFixed(1)} ⭐`}
          icon={<Star size={18} />} />
        <StatCard label="في الانتظار" value={pending.length}
          icon={<Clock size={18} />} />
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={18} className="text-orange-500" />
            طلبات تنتظر ردك ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((s: any) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{s.seeker?.fullName}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {s.sessionType === 'VOICE' ? 'مكالمة صوتية' : s.sessionType === 'VIDEO' ? 'مكالمة فيديو' : 'محادثة نصية'}
                      {' · '}
                      {s.durationMinutes} دقيقة
                    </p>
                    {s.description && (
                      <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2">
                        {s.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(s.scheduledStart), 'EEEE d MMMM yyyy - h:mm a', { locale: ar })}
                    </p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-bold text-wasla-green">{Number(s.helperEarningsEgp).toFixed(0)} جنيه</p>
                    <p className="text-xs text-gray-400">أرباحك</p>
                  </div>
                </div>

                {decliningId === s.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      className="input text-sm resize-none"
                      rows={2}
                      placeholder="سبب الرفض..."
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => decline.mutate({ id: s.id, reason: declineReason })}
                        className="flex-1 btn-secondary text-sm py-2"
                        disabled={!declineReason}
                      >
                        تأكيد الرفض
                      </button>
                      <button onClick={() => setDecliningId(null)} className="btn-ghost text-sm py-2 px-4">
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => accept.mutate(s.id)}
                      disabled={accept.isPending}
                      className="flex-1 btn-primary text-sm py-2"
                    >
                      قبول ✓
                    </button>
                    <button
                      onClick={() => setDecliningId(s.id)}
                      className="flex-1 btn-secondary text-sm py-2"
                    >
                      رفض
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming sessions */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            الجلسات القادمة ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.map((s: any) => (
              <Link key={s.id} to={`/sessions/${s.id}`} className="card p-4 flex items-center gap-4 block">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{s.seeker?.fullName}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(s.scheduledStart), { addSuffix: true, locale: ar })}
                  </p>
                </div>
                <span className="font-bold text-wasla-green">{Number(s.helperEarningsEgp).toFixed(0)} جنيه</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Completed sessions stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-wasla-green" />
            آخر الجلسات المكتملة
          </h2>
          <Link to="/sessions?status=COMPLETED" className="text-sm text-wasla-green flex items-center gap-1">
            عرض الكل <ChevronLeft size={14} />
          </Link>
        </div>
        {isLoading ? <PageLoader /> : completed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">لم تكمل أي جلسة بعد.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.slice(0, 5).map((s: any) => (
              <Link key={s.id} to={`/sessions/${s.id}`} className="card p-4 flex items-center gap-4 block">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{s.seeker?.fullName}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(s.scheduledStart), { addSuffix: true, locale: ar })}
                  </p>
                </div>
                <span className="font-bold text-green-600">+{Number(s.helperEarningsEgp).toFixed(0)} جنيه</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
