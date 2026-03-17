import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-wasla-green rounded-2xl shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">و</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">وصلة</h1>
          <p className="text-gray-500 text-sm mt-1">منصة المساعدة الفورية في مصر</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <Outlet />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2024 وصلة — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}
