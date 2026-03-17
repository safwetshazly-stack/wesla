import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/auth.store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach token ──────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response interceptor — handle 401, show Arabic errors
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const { refreshToken, setAuth, logout } = useAuthStore.getState()

      if (!refreshToken) {
        logout()
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/auth/refresh`,
          { refreshToken }
        )
        const newAccess = data.data.accessToken
        const newRefresh = data.data.refreshToken

        const user = useAuthStore.getState().user!
        setAuth(user, newAccess, newRefresh)

        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        logout()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    // Show Arabic error messages
    const msg = error.response?.data?.message
    if (msg && error.response?.status !== 401) {
      toast.error(msg)
    }

    return Promise.reject(error)
  }
)
