import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  tone?: 'cyan' | 'blue' | 'amber' | 'emerald'
  href?: string
}

const toneClasses = {
  cyan: {
    icon: 'border-cyan-400/15 bg-cyan-400/10 text-cyan-300',
    glow: 'group-hover:shadow-cyan-400/10',
    line: 'from-cyan-300/70',
  },
  blue: {
    icon: 'border-blue-400/15 bg-blue-400/10 text-blue-300',
    glow: 'group-hover:shadow-blue-400/10',
    line: 'from-blue-300/70',
  },
  amber: {
    icon: 'border-amber-400/15 bg-amber-400/10 text-amber-300',
    glow: 'group-hover:shadow-amber-400/10',
    line: 'from-amber-300/70',
  },
  emerald: {
    icon: 'border-emerald-400/15 bg-emerald-400/10 text-emerald-300',
    glow: 'group-hover:shadow-emerald-400/10',
    line: 'from-emerald-300/70',
  },
}

export function StatsCard({ title, value, icon: Icon, description, tone = 'cyan', href }: StatsCardProps) {
  const styles = toneClasses[tone]

  const content = (
    <Card
      className={cn(
        'group tech-panel relative h-full overflow-hidden border-border/75 bg-card/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-2xl',
        styles.glow,
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent', styles.line)} />
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-card-foreground sm:text-[34px]">{value}</p>
            {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">{description}</p>}
          </div>
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105', styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{content}</Link>
  }

  return content
}
