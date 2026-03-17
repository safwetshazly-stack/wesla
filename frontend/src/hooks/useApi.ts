import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import toast from 'react-hot-toast'

// ─── Auth ─────────────────────────────────────────────────

export function useLogin() {
  const { setAuth } = useAuthStore()
  return useMutation({
    mutationFn: (dto: { identifier: string; password: string }) =>
      api.post('/api/v1/auth/login', dto).then((r) => r.data.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast.success(`مرحباً، ${data.user.fullName}!`)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (dto: any) =>
      api.post('/api/v1/auth/register', dto).then((r) => r.data.data),
  })
}

export function useVerifyOtp() {
  const { setAuth } = useAuthStore()
  return useMutation({
    mutationFn: (dto: { phone: string; code: string }) =>
      api.post('/api/v1/auth/verify-otp', dto).then((r) => r.data.data),
    onSuccess: (data) => {
      if (data.accessToken) {
        const { user } = useAuthStore.getState()
        if (user) setAuth(user, data.accessToken, data.refreshToken)
      }
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (phoneNumber: string) =>
      api.post('/api/v1/auth/forgot-password', { phoneNumber }),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (dto: { phone: string; otp: string; newPassword: string }) =>
      api.post('/api/v1/auth/reset-password', dto),
    onSuccess: () => toast.success('تم تغيير كلمة المرور بنجاح.'),
  })
}

// ─── Users / Helpers ─────────────────────────────────────

export function useSearchHelpers(params: Record<string, any>) {
  return useQuery({
    queryKey: ['helpers', 'search', params],
    queryFn: () =>
      api.get('/api/v1/users/helpers', { params }).then((r) => r.data.data),
    staleTime: 60_000,
  })
}

export function useHelperProfile(id: string) {
  return useQuery({
    queryKey: ['helper', id],
    queryFn: () =>
      api.get(`/api/v1/users/helpers/${id}`).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 5 * 60_000,
  })
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => api.get('/api/v1/users/profile').then((r) => r.data.data),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: any) =>
      api.patch('/api/v1/users/profile', dto).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'me'] })
      toast.success('تم تحديث الملف الشخصي.')
    },
  })
}

export function useSavedHelpers() {
  return useQuery({
    queryKey: ['saved-helpers'],
    queryFn: () => api.get('/api/v1/users/saved').then((r) => r.data.data),
  })
}

export function useSaveHelper() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (helperId: string) =>
      api.post(`/api/v1/users/saved/${helperId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-helpers'] })
      toast.success('تم حفظ المساعد.')
    },
  })
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: () =>
      api.get('/api/v1/matching/recommendations').then((r) => r.data.data),
    staleTime: 60 * 60_000,
  })
}

export function useTrendingSkills() {
  return useQuery({
    queryKey: ['trending-skills'],
    queryFn: () =>
      api.get('/api/v1/matching/trending').then((r) => r.data.data),
    staleTime: 60 * 60_000,
  })
}

// ─── Sessions ─────────────────────────────────────────────

export function useSessions(filters?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: () =>
      api.get('/api/v1/sessions', { params: filters }).then((r) => r.data.data),
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () =>
      api.get(`/api/v1/sessions/${id}`).then((r) => r.data.data),
    enabled: !!id,
    refetchInterval: 30_000,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: any) =>
      api.post('/api/v1/sessions', dto).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('تم إرسال طلب الجلسة للمساعد.')
    },
  })
}

export function useAcceptSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/v1/sessions/${id}/accept`).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['session', id] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('تم قبول الطلب.')
    },
  })
}

export function useDeclineSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/api/v1/sessions/${id}/decline`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useCancelSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/api/v1/sessions/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('تم إلغاء الجلسة.')
    },
  })
}

export function useCompleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/sessions/${id}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('تم إنهاء الجلسة بنجاح!')
    },
  })
}

export function useSubmitReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: any) =>
      api.post(`/api/v1/sessions/${id}/review`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('تم إرسال تقييمك. سيتم نشره بعد 24 ساعة.')
    },
  })
}

export function useRoomToken(sessionId: string) {
  return useQuery({
    queryKey: ['room', sessionId],
    queryFn: () =>
      api.get(`/api/v1/sessions/${sessionId}/room`).then((r) => r.data.data),
    enabled: !!sessionId,
  })
}

// ─── Payments ─────────────────────────────────────────────

export function useInitiatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { sessionId: string; method: string; walletPhone?: string }) =>
      api.post('/api/v1/payments/initiate', dto).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function usePaymentHistory(page = 1) {
  return useQuery({
    queryKey: ['payments', page],
    queryFn: () =>
      api.get('/api/v1/payments/history', { params: { page } }).then((r) => r.data.data),
  })
}

export function useTopupWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { amountEgp: number; method: string }) =>
      api.post('/api/v1/payments/topup', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'me'] })
      toast.success('تم شحن المحفظة بنجاح.')
    },
  })
}

export function useWithdraw() {
  return useMutation({
    mutationFn: (dto: { amountEgp: number; method: string; walletPhone: string }) =>
      api.post('/api/v1/payments/withdraw', dto),
    onSuccess: () => toast.success('تم إرسال طلب السحب. سيصلك خلال 24-48 ساعة.'),
  })
}

// ─── Notifications ────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get('/api/v1/notifications').then((r) => r.data.data),
    refetchInterval: 30_000,
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch('/api/v1/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
