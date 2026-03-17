// WalletPage.tsx
import { useState } from 'react'
import { useMyProfile, usePaymentHistory, useTopupWallet, useWithdraw } from '../../hooks/useApi'
import { Button, Modal, PageLoader } from '../../components/ui'
import { Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

export function WalletPage() {
  const { user } = useAuthStore()
  const { data: profile } = useMyProfile()
  const { data: txData, isLoading } = usePaymentHistory()
  const topup = useTopupWallet()
  const withdraw = useWithdraw()

  const [showTopup, setShowTopup] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState(100)
  const [method, setMethod] = useState('VODAFONE_CASH')
  const [walletPhone, setWalletPhone] = useState('')

  const balance = Number(profile?.walletBalanceEgp || 0)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">المحفظة</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-l from-wasla-green to-wasla-teal rounded-3xl p-6 text-white">
        <p className="text-green-200 text-sm">الرصيد الحالي</p>
        <p className="text-5xl font-bold mt-1">{balance.toFixed(2)}</p>
        <p className="text-green-200">جنيه مصري</p>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setShowTopup(true)}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
          >
            <ArrowUpCircle size={16} /> شحن
          </button>
          {user?.userType === 'HELPER' && (
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <ArrowDownCircle size={16} /> سحب
            </button>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="font-bold text-gray-900 mb-3">سجل المعاملات</h2>
        {isLoading ? <PageLoader /> : (
          <div className="space-y-2">
            {(txData?.payments || []).map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  p.status === 'RELEASED' ? 'bg-green-100' : p.status === 'REFUNDED' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Wallet size={18} className={
                    p.status === 'RELEASED' ? 'text-green-600' : p.status === 'REFUNDED' ? 'text-blue-600' : 'text-gray-500'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">
                    جلسة مع {p.session?.helper?.fullName || p.session?.seeker?.fullName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(p.createdAt), 'd MMM yyyy', { locale: ar })} · {
                      p.method === 'WALLET_BALANCE' ? 'محفظة' : p.method === 'VODAFONE_CASH' ? 'فودافون كاش' : 'بطاقة'
                    }
                  </p>
                </div>
                <span className={`font-bold ${p.status === 'REFUNDED' ? 'text-blue-600' : 'text-gray-900'}`}>
                  {Number(p.amountEgp)} جنيه
                </span>
              </div>
            ))}
            {!(txData?.payments?.length) && (
              <p className="text-center text-gray-400 py-10 text-sm">لا توجد معاملات بعد</p>
            )}
          </div>
        )}
      </div>

      {/* Topup modal */}
      <Modal open={showTopup} onClose={() => setShowTopup(false)} title="شحن المحفظة">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ (جنيه)</label>
            <input type="number" min={50} max={5000} className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
            <div className="space-y-2">
              {[
                { value: 'VODAFONE_CASH', label: '📱 فودافون كاش' },
                { value: 'ORANGE_CASH', label: '🟠 أورانج كاش' },
                { value: 'CREDIT_CARD', label: '💳 بطاقة بنكية' },
              ].map((m) => (
                <label key={m.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${method === m.value ? 'border-wasla-green bg-wasla-green/5' : 'border-gray-200'}`}>
                  <input type="radio" className="hidden" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} />
                  <span className="font-medium text-sm">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
          <Button className="w-full" loading={topup.isPending}
            onClick={async () => { await topup.mutateAsync({ amountEgp: amount, method: method as any }); setShowTopup(false) }}>
            شحن {amount} جنيه
          </Button>
        </div>
      </Modal>

      {/* Withdraw modal */}
      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title="سحب الأموال">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ (حد أدنى 100 جنيه)</label>
            <input type="number" min={100} className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم المحفظة</label>
            <input type="text" placeholder="01012345678" className="input" value={walletPhone} onChange={(e) => setWalletPhone(e.target.value)} />
          </div>
          <Button className="w-full" loading={withdraw.isPending}
            onClick={async () => { await withdraw.mutateAsync({ amountEgp: amount, method: 'VODAFONE_CASH', walletPhone }); setShowWithdraw(false) }}>
            سحب {amount} جنيه
          </Button>
        </div>
      </Modal>
    </div>
  )
}
export default WalletPage
