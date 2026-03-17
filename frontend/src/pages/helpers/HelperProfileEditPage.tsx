// HelperProfileEditPage
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMyProfile, useUpdateProfile } from '../../hooks/useApi'
import { Input, Button, Select, PageLoader } from '../../components/ui'

const schema = z.object({
  fullName: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),
  hourlyRateEgp: z.coerce.number().min(20).max(300),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERT']),
})
type Form = z.infer<typeof schema>

const GOVERNORATES = [
  'القاهرة','الجيزة','الإسكندرية','الشرقية','البحيرة','الدقهلية',
  'كفر الشيخ','الغربية','المنوفية','القليوبية','الفيوم','بني سويف',
  'المنيا','أسيوط','سوهاج','قنا','الأقصر','أسوان',
]

export default function HelperProfileEditPage() {
  const { data: profile, isLoading } = useMyProfile()
  const update = useUpdateProfile()

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    values: profile ? {
      fullName: profile.fullName,
      bio: profile.bio || '',
      governorate: profile.governorate || '',
      city: profile.city || '',
      hourlyRateEgp: Number(profile.hourlyRateEgp) || 50,
      experienceLevel: profile.experienceLevel || 'BEGINNER',
    } : undefined,
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">تعديل الملف الشخصي</h1>
      <form onSubmit={handleSubmit((data) => update.mutate(data))} className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">المعلومات الأساسية</h2>
          <Input label="الاسم الكامل" error={errors.fullName?.message} {...register('fullName')} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">نبذة شخصية</label>
            <textarea className="input resize-none" rows={3} placeholder="اكتب نبذة عن خبرتك..." {...register('bio')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="المحافظة" options={[{ value: '', label: 'اختر...' }, ...GOVERNORATES.map(g => ({ value: g, label: g }))]} {...register('governorate')} />
            <Input label="المدينة" placeholder="مثال: مدينة نصر" {...register('city')} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">التخصص والتسعير</h2>
          <Select label="مستوى الخبرة"
            options={[
              { value: 'BEGINNER', label: 'مبتدئ' },
              { value: 'INTERMEDIATE', label: 'متوسط' },
              { value: 'EXPERT', label: 'خبير' },
            ]}
            error={errors.experienceLevel?.message}
            {...register('experienceLevel')}
          />
          <Input
            label="السعر بالساعة (جنيه)"
            type="number"
            min={20}
            max={300}
            error={errors.hourlyRateEgp?.message}
            hint="بين 20 و 300 جنيه"
            {...register('hourlyRateEgp')}
          />
        </div>

        <Button type="submit" className="w-full" loading={update.isPending}>
          حفظ التغييرات
        </Button>
      </form>
    </div>
  )
}
