import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Phone } from 'lucide-react'
import { useState } from 'react'
import { useLogin } from '../../hooks/useApi'
import { Input, Button } from '../../components/ui'

const schema = z.object({
  identifier: z.string().min(5, 'أدخل البريد الإلكتروني أو رقم الهاتف'),
  password: z.string().min(1, 'أدخل كلمة المرور'),
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const login = useLogin()

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    try {
      await login.mutateAsync(data)
      navigate('/dashboard')
    } catch { /* error toast handled in api.ts */ }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">مرحباً بعودتك</h2>
      <p className="text-gray-500 text-sm mb-7">سجّل دخولك للمتابعة</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="البريد الإلكتروني أو رقم الهاتف"
          placeholder="example@email.com أو 01012345678"
          error={errors.identifier?.message}
          startIcon={<Phone size={16} />}
          {...register('identifier')}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">كلمة المرور</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="text-left">
          <Link to="/forgot-password" className="text-sm text-wasla-green hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={login.isPending}>
          تسجيل الدخول
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <p className="text-gray-500 text-sm">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="text-wasla-green font-semibold hover:underline">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  )
}
