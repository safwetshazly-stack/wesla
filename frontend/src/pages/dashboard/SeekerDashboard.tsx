import { Link } from 'react-router-dom'
import { Search, Calendar, Star, TrendingUp, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { useSessions, useRecommendations, useTrendingSkills } from '../../hooks/useApi'
import { PageLoader, StarRating, Badge } from '../../components/ui'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

const SESSION_STATUS_LABELS: Record<string, { label: string; variant: any }> = {
  REQUESTED: { label: 'في الانتظار', variant: 'pending' },
  CONFIRMED: { label: 'مؤكدة', variant: 'info' },
  IN_PROGRESS: { label: 'جارية الآن', variant: 'success' },
  COMPLETED: { label: 'مكتملة', variant: 'verified' },
  CANCELLED: { label: 'ملغاة', variant: 'suspended' },
  DISPUTED: { label: 'نزاع', variant: 'suspended' },
}

export default function SeekerDashboard() {
  const { user } = useAuthStore()
  const { data: sessionsData, isLoading: loadingSessions } = useSessions({ page: 1 })
  const { data: recommendations, isLoading: loadingRec } = useRecommendations()
  const { data: trending } = useTrendingSkills()

  const recentSessions = sessionsData?.sessions?.slice(0, 3) || []

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-l from-wasla-green to-wasla-teal rounded-3xl p-6 text-white">
        <p className="text-green-100 text-sm">مرحباً 👋</p>
        <h1 className="text-2xl font-bold mt-1">{user?.fullName}</h1>
        <p className="text-green-100 text-sm mt-1">ابحث عن مساعد متخصص في ثوانٍ</p>
        <Link
          to="/helpers"
          className="inline-flex items-center gap-2 mt-4 bg-white text-wasla-green font-semibold px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors text-sm"
        >
          <Search size={16} />
          ابحث الآن
        </Link>
      </div>

      {/* Trending skills */}
      {trending && trending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-wasla-green" />
              المهارات الأكثر طلباً
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trending.slice(0, 8).map((t: any) => (
              <Link
                key={t.skill}
                to={`/helpers?skill=${encodeURIComponent(t.skill)}`}
                className="bg-white border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full hover:border-wasla-green hover:text-wasla-green transition-all"
              >
                {t.skill}
                <span className="text-xs text-gray-400 mr-1">({t.sessionCount})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Star size={18} className="text-yellow-400" />
            مساعدون مقترحون لك
          </h2>
          <Link to="/helpers" className="text-sm text-wasla-green flex items-center gap-1">
            عرض الكل <ChevronLeft size={14} />
          </Link>
        </div>

        {loadingRec ? (
          <PageLoader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recommendations || []).slice(0, 6).map((h: any) => (
              <Link key={h.id} to={`/helpers/${h.id}`} className="card p-4 block">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-wasla-green/10 flex items-center justify-center flex-shrink-0">
                    {h.profileImageUrl ? (
                      <img src={h.profileImageUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <span className="text-wasla-green font-bold text-lg">
                        {h.fullName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{h.fullName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating value={Number(h.ratingAvg)} size={12} />
                      <span className="text-xs text-gray-400">({h.totalSessions})</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {h.skills?.slice(0, 2).map((s: string) => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-wasla-green">{Number(h.hourlyRateEgp)} جنيه/ساعة</span>
                  <span className="text-xs text-gray-400">{h.governorate}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={18} className="text-wasla-green" />
            آخر الجلسات
          </h2>
          <Link to="/sessions" className="text-sm text-wasla-green flex items-center gap-1">
            عرض الكل <ChevronLeft size={14} />
          </Link>
        </div>

        {loadingSessions ? <PageLoader /> : recentSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">لم تحجز أي جلسة بعد.</p>
            <Link to="/helpers" className="inline-block mt-3 btn-primary text-sm px-5 py-2">
              ابحث عن مساعد
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((s: any) => {
              const st = SESSION_STATUS_LABELS[s.status] || { label: s.status, variant: 'gray' }
              return (
                <Link key={s.id} to={`/sessions/${s.id}`} className="card p-4 flex items-center gap-4 block">
                  <div className="w-10 h-10 bg-wasla-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} className="text-wasla-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{s.helper?.fullName}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(s.scheduledStart), { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
