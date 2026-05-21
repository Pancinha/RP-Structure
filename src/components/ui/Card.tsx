import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  color?: string
  icon?: ReactNode
}

export function StatCard({ label, value, color = 'text-gray-900', icon }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        {icon && (
          <div className="text-gray-400">{icon}</div>
        )}
      </div>
    </Card>
  )
}
