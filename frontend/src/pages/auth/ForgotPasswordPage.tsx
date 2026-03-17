import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForgotPassword, useResetPassword } from '../../hooks/useApi'
import { Input, Button } from '../../components/ui'
import { ArrowRight } from 'lucide-react'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'phone' | 'reset'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPass, setNewPass] = useState('')
  const forgot = useForgotPassword()
  const reset = useResetPassword()

  async function handleSend() {
    await forgot.mutateAsync(phone)
    setStep('reset')
  }

  async function handleReset() {
    await reset.mutateAsync({ phone, otp, newPassword: newPass })
    navigate('/login')
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6">
        <ArrowRight size={16} /> رجوع
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        {step === 'phone' ? 'نسيت كلمة المرور؟' : 'تعيين كلمة مرور جديدة'}
      </h2>
      <p className="text-gray-500 text-sm mb-7">
        {step === 'phone'
          ? 'أدخل رقم هاتفك وسنرسل لك رمز التحقق'
          : 'أدخل الرمز الذي أرسلناه وكلمة المرور الجديدة'}
      </p>

      {step === 'phone' ? (
        <div className="space-y-5">
          <Input
            label="رقم الهاتف"
            placeholder="01012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button className="w-full" onClick={handleSend} loading={forgot.isPending}>
            إرسال رمز التحقق
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <Input label="رمز التحقق" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <Input label="كلمة المرور الجديدة" type="password" placeholder="••••••••" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <Button className="w-full" onClick={handleReset} loading={reset.isPending}>
            تعيين كلمة المرور
          </Button>
        </div>
      )}
    </div>
  )
}
