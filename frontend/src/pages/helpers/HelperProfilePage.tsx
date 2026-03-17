// HelperProfilePage.tsx
import { useParams, Link } from 'react-router-dom'
import { useHelperProfile } from '../../hooks/useApi'
import { PageLoader, StarRating, Badge, Button } from '../../components/ui'
import { MapPin, Clock, BookOpen, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

export default function HelperProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: helper, isLoading } = useHelperProfile(id!)

  if (isLoading) return <PageLoader />
  if (!helper) return <div className="text-center py-20 text-gray-400">المساعد غير موجود</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-l from-wasla-green to-wasla-teal h-24" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="w-20 h-20 rounded-2xl border-4 border-white bg-wasla-green/10 flex items-center justify-center text-3xl font-bold text-wasla-green shadow-lg">
              {helper.profileImageUrl
                ? <img src={helper.profileImageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                : helper.fullName?.charAt(0)
              }
            </div>
            {helper.verificationStatus === 'VERIFIED' && (
              <Badge variant="verified">✓ موثّق</Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{helper.fullName}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <div className="flex items-center gap-1">
              <StarRating value={Number(helper.ratingAvg)} size={14} />
              <span className="text-sm text-gray-600">{Number(helper.ratingAvg).toFixed(1)}</span>
            </div>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{helper.totalSessions} جلسة مكتملة</span>
            {helper.governorate && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin size={13} /> {helper.governorate}
                </span>
              </>
            )}
          </div>

          {helper.bio && (
            <p className="text-gray-600 text-sm mt-3 leading-relaxed">{helper.bio}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {helper.skills?.map((s: string) => (
              <span key={s} className="bg-green-50 text-green-700 text-sm px-3 py-1.5 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Rate & book */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-wasla-green">{Number(helper.hourlyRateEgp)} جنيه</p>
            <p className="text-sm text-gray-400">في الساعة</p>
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-500 flex items-center gap-1 justify-end">
              <Clock size={14} />
              متوسط الرد: {helper.responseTimeMinutes || '—'} دقيقة
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1 justify-end mt-0.5">
              <BookOpen size={14} />
              {helper.experienceLevel === 'EXPERT' ? 'خبير' : helper.experienceLevel === 'INTERMEDIATE' ? 'متوسط' : 'مبتدئ'}
            </p>
          </div>
        </div>
        <Link to={`/helpers/${id}/book`}>
          <Button className="w-full">احجز جلسة الآن</Button>
        </Link>
      </div>

      {/* Reviews */}
      {helper.reviewsReceived?.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">تقييمات المساعد</h2>
          <div className="space-y-4">
            {helper.reviewsReceived.map((r: any) => (
              <div key={r.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {r.reviewer?.fullName?.charAt(0)}
                  </div>
                  <span className="font-medium text-sm text-gray-900">{r.reviewer?.fullName}</span>
                  <StarRating value={r.ratingOverall} size={12} />
                </div>
                {r.comment && <p className="text-sm text-gray-600 mr-10">{r.comment}</p>}
                <p className="text-xs text-gray-400 mr-10 mt-1">
                  {r.publishedAt && format(new Date(r.publishedAt), 'd MMM yyyy', { locale: ar })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
