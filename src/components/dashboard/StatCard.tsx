import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  trend: { value: number; label: string }
  gradient?: boolean
  className?: string
}

export function StatCard({
  title, value, subtitle, icon: Icon, iconBg, iconColor, trend, gradient, className
}: StatCardProps) {
  const isPositive = trend.value > 0
  const isNegative = trend.value < 0
  const isNeutral = trend.value === 0

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-5 relative overflow-hidden flex flex-col',
      className
    )}>
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
      )}
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={cn('w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
          isPositive ? 'text-emerald-400 bg-emerald-400/10' : 
          isNegative ? 'text-red-400 bg-red-400/10' : 
          'text-muted-foreground bg-secondary'
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> :
           isNegative ? <TrendingDown className="w-3 h-3" /> :
           <Minus className="w-3 h-3" />}
          <span>{Math.abs(trend.value)}%</span>
        </div>
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col justify-end">
        <h3 className="text-3xl font-bold text-foreground mb-1 tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-muted-foreground mb-0.5">{title}</p>
        <p className="text-xs text-muted-foreground/70">{subtitle} • {trend.label}</p>
      </div>
    </div>
  )
}
