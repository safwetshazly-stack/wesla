import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useSession, useAcceptSession, useCancelSession, useCompleteSession, useInitiatePayment, useSubmitReview } from '../../hooks/useApi'
import { useAuthStore } from '../../stores/auth.store'
import { PageLoader, Button, Badge, StarRating, Modal } from '../../components/ui'
import { Calendar, Clock, Video, Mic, MessageSquare, CreditCard, Star } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'في انتظار المساعد', CONFIRMED: 'تم القبول - في انتظار الدفع',
  IN_PROGRESS: 'الجلسة جارية الآن', COMPLETED: 'مكتملة', CANCELLED: 'ملغاة', DISPUTED: 'نزاع',
}

const TYPE_ICONS: Record<string, any> = { VOICE: Mic, VIDEO: Video, CHAT: MessageSquare }

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: session, isLoading } = useSession(id!)
  const accept = useAcceptSession()
  const cancel = useCancelSession()
  const complete = useCompleteSession()
  const pay = useInitiatePayment()
  const review = useSubmitReview()

  const [payMethod, setPayMethod] = useState('WALLET_BALANCE')
  const [showPayModal, setShowPayModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  if (isLoading) return <PageLoader />
  if (!session) return <div className="text-center py-20 text-gray-400">الجلسة غير موجودة</div>

  const isHelper = user?.id === session.helperId
  const TypeIcon = TYPE_ICONS[session.sessionType] || Mic

  const canJoin = ['CONFIRMED', 'IN_PROGRESS'].includes(session.status)
  const canPay = !isHelper && session.status === 'CONFIRMED' && !session.payment
  const canReview = session.status === 'COMPLETED'
  const canCancel = ['REQUESTED', 'CONFIRMED'].includes(session.status)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Status banner */}
      <div className={`rounded-2xl p-4 text-center font-semibold ${
        session.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
        session.status === 'COMPLETED' ? 'bg-blue-50 text-blue-800' :
        session.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
        'bg-yellow-50 text-yellow-800'
      }`}>
        {STATUS_LABELS[session.status] || session.status}
      </div>

      {/* Details */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-wasla-green/10 rounded-2xl flex items-center justify-center">
              <TypeIcon size={20} className="text-wasla-green" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {isHelper ? session.seeker?.fullName : session.helper?.fullName}
              </p>
              <p className="text-sm text-gray-500">
                {session.sessionType === 'VOICE' ? 'صوتي' : session.sessionType === 'VIDEO' ? 'فيديو' : 'نصي'}
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="font-bold text-2xl text-wasla-green">{Number(session.priceEgp)} جنيه</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={15} className="text-wasla-green" />
            {format(new Date(session.scheduledStart), 'd MMM yyyy', { locale: ar })}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={15} className="text-wasla-green" />
            {format(new Date(session.scheduledStart), 'h:mm a', { locale: ar })} ({session.durationMinutes} دقيقة)
          </div>
        </div>

        {session.description && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm text-gray-600">{session.description}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {canJoin && (
          <Link to={`/room/${id}`}>
            <Button className="w-full" size="lg">
              انضم للجلسة الآن
            </Button>
          </Link>
        )}

        {canPay && (
          <Button className="w-full" variant="primary" onClick={() => setShowPayModal(true)}>
            <CreditCard size={16} />
            ادفع الآن لتأكيد الجلسة
          </Button>
        )}

        {isHelper && session.status === 'IN_PROGRESS' && (
          <Button variant="secondary" className="w-full" onClick={() => complete.mutate(id!)}>
            إنهاء الجلسة
          </Button>
        )}

        {canReview && (
          <Button variant="secondary" className="w-full" onClick={() => setShowReviewModal(true)}>
            <Star size={16} />
            أضف تقييمك
          </Button>
        )}

        {canCancel && (
          <div className="space-y-2">
            <textarea
              className="input resize-none text-sm"
              rows={2}
              placeholder="سبب الإلغاء..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <Button variant="danger" size="sm" className="w-full" onClick={() => cancel.mutate({ id: id!, reason: cancelReason })} disabled={!cancelReason}>
              إلغاء الجلسة
            </Button>
          </div>
        )}
      </div>

      {/* Pay modal */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="اختر طريقة الدفع">
        <div className="space-y-3">
          {['WALLET_BALANCE', 'VODAFONE_CASH', 'ORANGE_CASH', 'CREDIT_CARD'].map((m) => (
            <label key={m} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${payMethod === m ? 'border-wasla-green bg-wasla-green/5' : 'border-gray-200'}`}>
              <input type="radio" className="hidden" value={m} checked={payMethod === m} onChange={() => setPayMethod(m)} />
              <span className="font-medium text-sm">
                {m === 'WALLET_BALANCE' ? '💰 رصيد المحفظة' : m === 'VODAFONE_CASH' ? '📱 فودافون كاش' : m === 'ORANGE_CASH' ? '🟠 أورانج كاش' : '💳 بطاقة بنكية'}
              </span>
            </label>
          ))}
          <Button className="w-full mt-4" loading={pay.isPending}
            onClick={async () => {
              await pay.mutateAsync({ sessionId: id!, method: payMethod as any })
              setShowPayModal(false)
            }}>
            ادفع {Number(session.priceEgp)} جنيه
          </Button>
        </div>
      </Modal>

      {/* Review modal */}
      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="أضف تقييمك">
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star size={32} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
              </button>
            ))}
          </div>
          <textarea className="input resize-none" rows={3} placeholder="اكتب تعليقك (اختياري)..."
            value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button className="w-full" loading={review.isPending}
            onClick={async () => {
              await review.mutateAsync({ id: id!, ratingOverall: rating, comment })
              setShowReviewModal(false)
            }}>
            إرسال التقييم
          </Button>
        </div>
      </Modal>
    </div>
  )
}
