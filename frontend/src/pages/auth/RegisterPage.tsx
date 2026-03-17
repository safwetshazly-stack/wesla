import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useRegister } from '../../hooks/useApi'
import { Input, Button } from '../../components/ui'
import { Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('بريد إلكتروني غير صحيح'),
  phoneNumber: z.string().regex(/^(\+20|0)?1[0125][0-9]{8}$/, 'رقم هاتف مصري غير صحيح'),
  password: z.string()
    .min(8, 'كلمة المرور 8 أحرف على الأقل')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'يجب أن تحتوي على حرف صغير وكبير ورقم'),
  userType: z.enum(['SEEKER', 'HELPER']),
})
type Form = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const register_ = useRegister()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { userType: 'SEEKER' },
  })

  const userType = watch('userType')

  async function onSubmit(data: Form) {
    try {
      await register_.mutateAsync(data)
      navigate('/verify-otp', { state: { phone: data.phoneNumber } })
    } catch { }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">إنشاء حساب جديد</h2>
      <p className="text-gray-500 text-sm mb-6">انضم إلى وصلة اليوم</p>

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(['SEEKER', 'HELPER'] as const).map((type) => (
          <label
            key={type}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              userType === type
                ? 'border-wasla-green bg-wasla-green/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input type="radio" className="hidden" value={type} {...register('userType')} />
            <span className="text-2xl">{type === 'SEEKER' ? '🙋' : '🧑‍💼'}</span>
            <div className="text-center">
              <p className="font-semibold text-sm text-gray-900">
                {type === 'SEEKER' ? 'طالب مساعدة' : 'مساعد'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {type === 'SEEKER' ? 'أبحث عن خبرة' : 'أقدّم خبرتي'}
              </p>
            </div>
          </label>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="الاسم الكامل" placeholder="أحمد محمد" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="البريد الإلكتروني" type="email" placeholder="example@email.com" error={errors.email?.message} {...register('email')} />
        <Input label="رقم الهاتف" placeholder="01012345678" error={errors.phoneNumber?.message} {...register('phoneNumber')} />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">كلمة المرور</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
              {...register('password')}
            />
            <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" loading={register_.isPending}>
          إنشاء الحساب
        </Button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        بالتسجيل أنت توافق على{' '}
        <a href="#" className="text-wasla-green hover:underline">شروط الاستخدام</a>
        {' '}و{' '}
        <a href="#" className="text-wasla-green hover:underline">سياسة الخصوصية</a>
      </p>

      <div className="mt-5 pt-5 border-t border-gray-100 text-center">
        <p className="text-gray-500 text-sm">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-wasla-green font-semibold hover:underline">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  )
}
