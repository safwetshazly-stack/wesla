import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useHelperProfile, useCreateSession } from '../../hooks/useApi'
import { PageLoader, Button } from '../../components/ui'
import { Mic, Video, MessageSquare, Clock, CreditCard } from 'lucide-react'
import clsx from 'clsx'

const SESSION_TYPES = [
  { value: 'VOICE', label: 'صوتي', icon: Mic, desc: 'مكالمة صوتية فقط' },
  { value: 'VIDEO', label: 'فيديو', icon: Video, desc: 'مكالمة بالصوت والصورة' },
  { value: 'CHAT', label: 'نصي', icon: MessageSquare, desc: 'محادثة نصية' },
] as const

const DURATIONS = [30, 60, 90, 120]

export default function BookSessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: helper, isLoading } = useHelperProfile(id!)
  const createSession = useCreateSession()

  const [type, setType] = useState<'VOICE' | 'VIDEO' | 'CHAT'>('VOICE')
  const [duration, setDuration] = useState(60)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')

  if (isLoading) return <PageLoader />
  if (!helper) return null

  const hourlyRate = Number(helper.hourlyRateEgp)
  const price = Math.round((hourlyRate / 60) * duration)
  const fee = price < 50 ? 5 : Math.round(price * 0.1)
  const helperEarns = price - fee

  async function handleBook() {
    if (!date || !time) return
    const scheduledStart = new Date(`${date}T${time}`).toISOString()
    try {
      const session = await createSession.mutateAsync({
        helperId: id,
        sessionType: type,
        durationMinutes: duration,
        scheduledStart,
        description,
      })
      navigate(`/sessions/${session.sessionId}`)
    } catch { }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">احجز جلسة مع {helper.fullName}</h1>

      {/* Session type */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">نوع الجلسة</h2>
        <div className="grid grid-cols-3 gap-3">
          {SESSION_TYPES.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={clsx(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center',
                type === value
                  ? 'border-wasla-green bg-wasla-green/5 text-wasla-green'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              <Icon size={20} />
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs text-gray-400">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock size={16} /> المدة
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={clsx(
                'py-3 rounded-xl text-sm font-semibold border-2 transition-all',
                duration === d
                  ? 'border-wasla-green bg-wasla-green/5 text-wasla-green'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {d} د
            </button>
          ))}
        </div>
      </div>

      {/* Date & time */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">التاريخ والوقت</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">التاريخ</label>
            <input
              type="date"
              className="input"
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">الوقت</label>
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <label className="block font-semibold text-gray-900 mb-2">وصف موضوع الجلسة (اختياري)</label>
        <textarea
          className="input resize-none"
          rows={3}
          maxLength={200}
          placeholder="اذكر موضوع الجلسة باختصار..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1">{description.length}/200</p>
      </div>

      {/* Price summary */}
      <div className="bg-wasla-green/5 rounded-2xl border border-wasla-green/20 p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CreditCard size={16} className="text-wasla-green" /> ملخص التكلفة
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>سعر الجلسة ({duration} دقيقة)</span>
            <span>{price} جنيه</span>
          </div>
          <div className="flex justify-between text-gray-400 text-xs">
            <span>رسوم المنصة</span>
            <span>{fee} جنيه</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-wasla-green/20">
            <span>الإجمالي</span>
            <span className="text-wasla-green">{price} جنيه</span>
          </div>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={handleBook}
        disabled={!date || !time}
        loading={createSession.isPending}
      >
        إرسال طلب الحجز
      </Button>
    </div>
  )
}
