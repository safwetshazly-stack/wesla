import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, X, Star } from 'lucide-react'
import { useSearchHelpers } from '../../hooks/useApi'
import { Input, Button, StarRating, PageLoader, EmptyState, Badge } from '../../components/ui'

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'البحيرة', 'الدقهلية',
  'كفر الشيخ', 'الغربية', 'المنوفية', 'القليوبية', 'الفيوم', 'بني سويف',
  'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
]

const SKILLS = [
  'برمجة ومواقع', 'تدريس خصوصي', 'تدريس رياضيات', 'تدريس لغة إنجليزية',
  'تصميم جرافيك', 'استشارات أعمال', 'تسويق رقمي', 'محاسبة',
  'فيديو ومونتاج', 'كتابة ومحتوى', 'ترجمة', 'تطوير تطبيقات',
]

export default function SearchHelpersPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    skill: '', governorate: '', minPrice: '', maxPrice: '',
    minRating: '', experienceLevel: '', sortBy: 'rating', page: 1,
  })
  const [search, setSearch] = useState('')

  const queryFilters = {
    ...filters,
    skill: search || filters.skill || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    governorate: filters.governorate || undefined,
    experienceLevel: filters.experienceLevel || undefined,
  }

  const { data, isLoading } = useSearchHelpers(queryFilters)
  const helpers = data?.helpers || []
  const pagination = data?.pagination

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-5">ابحث عن مساعد</h1>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="ابحث بالمهارة أو الاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pr-10"
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} size="sm">
          <SlidersHorizontal size={16} />
          فلترة
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المهارة</label>
              <select className="input text-sm" value={filters.skill}
                onChange={(e) => setFilters(f => ({ ...f, skill: e.target.value }))}>
                <option value="">كل المهارات</option>
                {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
              <select className="input text-sm" value={filters.governorate}
                onChange={(e) => setFilters(f => ({ ...f, governorate: e.target.value }))}>
                <option value="">كل المحافظات</option>
                {EGYPT_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مستوى الخبرة</label>
              <select className="input text-sm" value={filters.experienceLevel}
                onChange={(e) => setFilters(f => ({ ...f, experienceLevel: e.target.value }))}>
                <option value="">كل المستويات</option>
                <option value="BEGINNER">مبتدئ</option>
                <option value="INTERMEDIATE">متوسط</option>
                <option value="EXPERT">خبير</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر من (جنيه)</label>
              <input type="number" className="input text-sm" placeholder="20" value={filters.minPrice}
                onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر إلى (جنيه)</label>
              <input type="number" className="input text-sm" placeholder="300" value={filters.maxPrice}
                onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ترتيب حسب</label>
              <select className="input text-sm" value={filters.sortBy}
                onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}>
                <option value="rating">الأعلى تقييماً</option>
                <option value="price_asc">السعر: الأقل</option>
                <option value="price_desc">السعر: الأعلى</option>
                <option value="sessions">الأكثر جلسات</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <button
              onClick={() => setFilters({ skill: '', governorate: '', minPrice: '', maxPrice: '', minRating: '', experienceLevel: '', sortBy: 'rating', page: 1 })}
              className="text-sm text-red-500 hover:underline flex items-center gap-1"
            >
              <X size={14} /> مسح الفلاتر
            </button>
            <span className="text-xs text-gray-400">{pagination?.total || 0} نتيجة</span>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? <PageLoader /> : helpers.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title="لم يتم العثور على مساعدين"
          description="جرّب تغيير معايير البحث"
        />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{pagination?.total} مساعد متاح</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {helpers.map((h: any) => (
              <Link key={h.id} to={`/helpers/${h.id}`} className="card p-5 block">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-wasla-green/10 flex items-center justify-center flex-shrink-0 text-xl font-bold text-wasla-green">
                    {h.profileImageUrl
                      ? <img src={h.profileImageUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                      : h.fullName?.charAt(0)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 truncate">{h.fullName}</p>
                      {h.verificationStatus === 'VERIFIED' && (
                        <Badge variant="verified" className="text-xs py-0">✓</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StarRating value={Number(h.ratingAvg)} size={13} />
                      <span className="text-xs text-gray-500">
                        {Number(h.ratingAvg).toFixed(1)} ({h.totalSessions} جلسة)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {h.skills?.slice(0, 3).map((s: string) => (
                    <span key={s} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">السعر/ساعة</p>
                    <p className="font-bold text-wasla-green">{Number(h.hourlyRateEgp)} جنيه</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-400">{h.governorate}</p>
                    <p className="text-xs text-gray-400">
                      {h.experienceLevel === 'EXPERT' ? 'خبير' : h.experienceLevel === 'INTERMEDIATE' ? 'متوسط' : 'مبتدئ'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilters(f => ({ ...f, page: p }))}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                    filters.page === p
                      ? 'bg-wasla-green text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-wasla-green'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
