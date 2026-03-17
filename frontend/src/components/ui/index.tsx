import { forwardRef } from 'react'
import { Loader2, Star, X } from 'lucide-react'
import clsx from 'clsx'

// ─── Button ───────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
        {
          'bg-wasla-green text-white hover:bg-wasla-teal': variant === 'primary',
          'bg-white text-wasla-green border border-wasla-green hover:bg-green-50': variant === 'secondary',
          'text-gray-600 hover:bg-gray-100': variant === 'ghost',
          'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
          'text-sm px-4 py-2': size === 'sm',
          'px-6 py-3': size === 'md',
          'text-lg px-8 py-4': size === 'lg',
        },
        className
      )}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

// ─── Input ────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  startIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, startIcon, className, ...rest }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {startIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {startIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'input',
            startIcon && 'pr-10',
            error && 'input-error',
            className
          )}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...rest }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        ref={ref}
        className={clsx('input resize-none', error && 'input-error', className)}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ─── Select ───────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...rest }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select
        ref={ref}
        className={clsx('input', error && 'input-error', className)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

// ─── Badge ────────────────────────────────────────────────
type BadgeVariant = 'verified' | 'pending' | 'suspended' | 'info' | 'success' | 'warning' | 'gray'

const badgeVariants: Record<BadgeVariant, string> = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-orange-100 text-orange-700',
  gray: 'bg-gray-100 text-gray-600',
}

export function Badge({ variant = 'gray', children, className }: {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={clsx('badge', badgeVariants[variant], className)}>
      {children}
    </span>
  )
}

// ─── StarRating ───────────────────────────────────────────
export function StarRating({ value, max = 5, size = 16 }: {
  value: number; max?: number; size?: number
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(value) ? 'star-filled fill-yellow-400' : 'star-empty fill-gray-200'}
          strokeWidth={0}
        />
      ))}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────
export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx('animate-spin text-wasla-green', className)} />
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={36} />
        <p className="text-sm text-gray-400">جاري التحميل…</p>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-bold text-lg text-gray-900">{title}</h2>
            <button onClick={onClose} className="btn-ghost p-1">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
      {description && <p className="text-gray-400 text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'green' }: {
  label: string; value: string | number; icon: React.ReactNode; color?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`p-2 rounded-xl bg-${color}-100 text-${color}-600`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
