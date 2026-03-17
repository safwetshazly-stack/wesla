import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useVerifyOtp } from '../../hooks/useApi'
import { Button } from '../../components/ui'
import { Phone } from 'lucide-react'

export default function OtpPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const phone = (location.state as any)?.phone || ''
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const verify = useVerifyOtp()

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  function handleChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
    if (!val && i > 0) inputRefs.current[i - 1]?.focus()

    // Auto-submit when all filled
    if (val && i === 5 && next.every((d) => d)) {
      handleVerify(next.join(''))
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(''))
      handleVerify(text)
    }
  }

  async function handleVerify(code: string) {
    try {
      await verify.mutateAsync({ phone, code })
      navigate('/dashboard')
    } catch { setDigits(['', '', '', '', '', '']); inputRefs.current[0]?.focus() }
  }

  const code = digits.join('')

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-wasla-green/10 rounded-2xl mb-5">
        <Phone className="text-wasla-green" size={24} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">أدخل رمز التحقق</h2>
      <p className="text-gray-500 text-sm mb-2">
        أرسلنا رمزاً مكوناً من 6 أرقام إلى
      </p>
      <p className="font-semibold text-gray-800 mb-8 dir-ltr">{phone}</p>

      <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl outline-none transition-all
              ${d ? 'border-wasla-green bg-wasla-green/5 text-wasla-green' : 'border-gray-200 focus:border-wasla-green'}`}
          />
        ))}
      </div>

      <Button
        className="w-full"
        onClick={() => handleVerify(code)}
        disabled={code.length < 6}
        loading={verify.isPending}
      >
        تحقق
      </Button>

      <p className="text-sm text-gray-400 mt-6">
        لم تستلم الرمز؟{' '}
        <button className="text-wasla-green font-semibold hover:underline">
          إعادة الإرسال
        </button>
      </p>
    </div>
  )
}
