import { Link } from 'react-router-dom'
import { Search, ShieldCheck, Star, Zap, ArrowLeft } from 'lucide-react'

const FEATURES = [
  { icon: Search, title: 'ابحث بسهولة', desc: 'ابحث عن مساعد متخصص في ثوانٍ حسب المهارة والسعر والموقع' },
  { icon: ShieldCheck, title: 'موثّق وآمن', desc: 'كل المساعدين تم التحقق من هويتهم ببطاقة الرقم القومي' },
  { icon: Star, title: 'تقييمات حقيقية', desc: 'تقييمات شفافة من مستخدمين حقيقيين لمساعدتك في الاختيار' },
  { icon: Zap, title: 'دفع آمن', desc: 'ادفع بفودافون كاش أو أورانج كاش أو بطاقة بنكية بأمان تام' },
]

const SKILLS = [
  'برمجة ومواقع', 'تدريس خصوصي', 'تصميم جرافيك',
  'استشارات أعمال', 'تسويق رقمي', 'محاسبة',
  'ترجمة', 'كتابة محتوى',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-wasla-green rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">و</span>
          </div>
          <span className="font-bold text-xl text-gray-900">وصلة</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            تسجيل الدخول
          </Link>
          <Link to="/register" className="btn-primary text-sm px-5 py-2.5">
            ابدأ الآن
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-green-50 text-wasla-green text-sm font-medium px-4 py-2 rounded-full mb-6">
          <Zap size={14} />
          منصة المساعدة الأولى في مصر
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          احصل على المساعدة
          <br />
          <span className="text-wasla-green">فوراً من خبراء موثّقين</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          وصلة تربطك بآلاف الخبراء في البرمجة والتدريس والاستشارات والتصميم وأكثر.
          جلسات صوتية أو فيديو أو نصية بأسعار مناسبة.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
            ابدأ مجاناً
            <ArrowLeft size={18} />
          </Link>
          <Link to="/register?type=HELPER" className="btn-secondary text-lg px-8 py-4">
            سجّل كمساعد
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-5">
          أكثر من 1,000 مساعد موثّق ينتظرون مساعدتك
        </p>
      </section>

      {/* Skills */}
      <section className="px-6 py-10 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500 text-sm mb-5">مجالات شائعة</p>
          <div className="flex flex-wrap justify-center gap-3">
            {SKILLS.map((s) => (
              <Link
                key={s}
                to={`/helpers?skill=${encodeURIComponent(s)}`}
                className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full font-medium hover:border-wasla-green hover:text-wasla-green transition-all shadow-sm"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          لماذا وصلة؟
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="w-12 h-12 bg-wasla-green/10 rounded-2xl flex items-center justify-center mb-4">
                <Icon size={22} className="text-wasla-green" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">أسعار شفافة وعادلة</h2>
          <p className="text-gray-500 mb-10">
            تبدأ الجلسات من <span className="text-wasla-green font-bold">20 جنيه</span> للنصف ساعة.
            المنصة تأخذ فقط 10% عمولة — الباقي للمساعد مباشرةً.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { dur: '30 دقيقة', range: '20 - 150 جنيه', badge: 'الأكثر طلباً' },
              { dur: '60 دقيقة', range: '40 - 300 جنيه', badge: '' },
              { dur: '90 دقيقة', range: '60 - 450 جنيه', badge: '' },
            ].map((p) => (
              <div key={p.dur} className="bg-white rounded-2xl border border-gray-200 p-5 text-center relative">
                {p.badge && (
                  <span className="absolute -top-3 right-1/2 translate-x-1/2 bg-wasla-green text-white text-xs px-3 py-1 rounded-full">
                    {p.badge}
                  </span>
                )}
                <p className="font-bold text-gray-900">{p.dur}</p>
                <p className="text-wasla-green font-semibold mt-1">{p.range}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-gradient-to-l from-wasla-green to-wasla-teal text-white text-center">
        <h2 className="text-3xl font-bold mb-4">جاهز تبدأ؟</h2>
        <p className="text-green-100 text-lg mb-8">سجّل الآن مجاناً وابدأ في الحصول على المساعدة أو تقديمها</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link to="/register" className="bg-white text-wasla-green font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition-colors">
            ابدأ كطالب مساعدة
          </Link>
          <Link to="/register?type=HELPER" className="bg-white/20 hover:bg-white/30 text-white font-bold px-8 py-4 rounded-xl transition-colors">
            سجّل كمساعد
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-sm">
          © 2024 وصلة — منصة المساعدة الفورية في مصر
        </p>
      </footer>
    </div>
  )
}
