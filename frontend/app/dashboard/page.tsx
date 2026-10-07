'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Sidebar } from '@/components/sidebar'
import { StatsCard } from '@/components/stats-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Client, Equipment, ServiceOrder } from '@/lib/types'
import { toast } from 'sonner'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DollarSign,
  Monitor,
  PlayCircle,
  Plus,
  ServerCog,
  Users,
  Wrench,
} from 'lucide-react'

type DashboardView = 'operational' | 'analytics'
type OperationalPeriod = 'day' | 'week'
type AnalyticsPreset = 'today' | 'week' | '30d' | 'month' | 'all' | 'custom'
type AnalyticsSort = 'recent' | 'oldest' | 'created' | 'completed' | 'revenue'

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

function parseDate(value?: Date | string | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function endOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

function startOfWeek(date: Date) {
  const value = startOfDay(date)
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day
  value.setDate(value.getDate() + diff)
  return value
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function isWithin(value: Date | string | null | undefined, start: Date | null, end: Date | null) {
  const date = parseDate(value)
  if (!date) return false
  if (start && date < start) return false
  if (end && date > end) return false
  return true
}

function dateKey(value: Date | string | null | undefined) {
  const date = parseDate(value)
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function displayDate(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(year, month - 1, day))
}

export default function DashboardPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<DashboardView>('operational')
  const [operationalPeriod, setOperationalPeriod] = useState<OperationalPeriod>('day')
  const [analyticsPreset, setAnalyticsPreset] = useState<AnalyticsPreset>('week')
  const [analyticsSort, setAnalyticsSort] = useState<AnalyticsSort>('recent')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    const savedRole = localStorage.getItem('user_role')
    if (!savedRole) {
      router.replace('/')
      return
    }
    setRole(savedRole)

    const load = async () => {
      try {
        setLoading(true)
        const [clientsRes, equipmentsRes, ordersRes] = await Promise.all([
          api.get('clientes/'),
          api.get('equipamentos/'),
          api.get('os/'),
        ])
        setClients(clientsRes.data || [])
        setEquipments(equipmentsRes.data || [])
        setOrders(ordersRes.data || [])
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
        toast.error('Não foi possível atualizar o dashboard.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const now = new Date()

  const operationalRange = useMemo(() => {
    if (operationalPeriod === 'day') {
      return { start: startOfDay(now), end: endOfDay(now), label: 'Hoje' }
    }
    return { start: startOfWeek(now), end: endOfDay(now), label: 'Esta semana' }
  }, [operationalPeriod])

  const operationalMetrics = useMemo(() => {
    const created = orders.filter((order) => isWithin(order.createdAt, operationalRange.start, operationalRange.end)).length
    const started = orders.filter((order) => isWithin(order.startedAt, operationalRange.start, operationalRange.end)).length
    const completedOrders = orders.filter((order) => isWithin(order.completedAt || (order.status === 'completed' ? order.updatedAt : null), operationalRange.start, operationalRange.end))
    const completed = completedOrders.length
    const revenue = completedOrders.reduce((total, order) => total + Number(order.price || 0), 0)
    const waitingNow = orders.filter((order) => order.status === 'open').length
    const runningNow = orders.filter((order) => order.status === 'in-progress').length
    return { created, started, completed, revenue, waitingNow, runningNow }
  }, [orders, operationalRange])

  const operationalOrders = useMemo(() => orders
    .filter((order) => isWithin(order.createdAt, operationalRange.start, operationalRange.end))
    .slice()
    .sort((a, b) => (parseDate(b.createdAt)?.getTime() || 0) - (parseDate(a.createdAt)?.getTime() || 0)), [orders, operationalRange])

  const analyticsRange = useMemo(() => {
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    if (analyticsPreset === 'today') return { start: todayStart, end: todayEnd, label: 'Hoje' }
    if (analyticsPreset === 'week') return { start: startOfWeek(now), end: todayEnd, label: 'Esta semana' }
    if (analyticsPreset === '30d') {
      const start = startOfDay(now)
      start.setDate(start.getDate() - 29)
      return { start, end: todayEnd, label: 'Últimos 30 dias' }
    }
    if (analyticsPreset === 'month') return { start: startOfMonth(now), end: todayEnd, label: 'Mês atual' }
    if (analyticsPreset === 'all') return { start: null, end: null, label: 'Todo o período' }

    const start = customStart ? startOfDay(new Date(`${customStart}T00:00:00`)) : null
    const end = customEnd ? endOfDay(new Date(`${customEnd}T00:00:00`)) : null
    return { start, end, label: 'Período personalizado' }
  }, [analyticsPreset, customEnd, customStart])

  const analyticsMetrics = useMemo(() => {
    const created = orders.filter((order) => isWithin(order.createdAt, analyticsRange.start, analyticsRange.end)).length
    const started = orders.filter((order) => isWithin(order.startedAt, analyticsRange.start, analyticsRange.end)).length
    const completedOrders = orders.filter((order) => isWithin(order.completedAt || (order.status === 'completed' ? order.updatedAt : null), analyticsRange.start, analyticsRange.end))
    const completed = completedOrders.length
    const revenue = completedOrders.reduce((total, order) => total + Number(order.price || 0), 0)
    const createdClients = clients.filter((client) => isWithin(client.createdAt, analyticsRange.start, analyticsRange.end)).length
    const createdEquipments = equipments.filter((equipment) => isWithin(equipment.createdAt, analyticsRange.start, analyticsRange.end)).length
    return { created, started, completed, revenue, createdClients, createdEquipments }
  }, [analyticsRange, clients, equipments, orders])

  const dailyRows = useMemo(() => {
    const rows = new Map<string, { date: string; created: number; started: number; completed: number; revenue: number }>()

    const ensure = (key: string) => {
      if (!rows.has(key)) rows.set(key, { date: key, created: 0, started: 0, completed: 0, revenue: 0 })
      return rows.get(key)!
    }

    orders.forEach((order) => {
      if (isWithin(order.createdAt, analyticsRange.start, analyticsRange.end)) {
        const key = dateKey(order.createdAt)
        if (key) ensure(key).created += 1
      }
      if (isWithin(order.startedAt, analyticsRange.start, analyticsRange.end)) {
        const key = dateKey(order.startedAt)
        if (key) ensure(key).started += 1
      }
      const completedDate = order.completedAt || (order.status === 'completed' ? order.updatedAt : null)
      if (isWithin(completedDate, analyticsRange.start, analyticsRange.end)) {
        const key = dateKey(completedDate)
        if (key) {
          ensure(key).completed += 1
          ensure(key).revenue += Number(order.price || 0)
        }
      }
    })

    const list = Array.from(rows.values())
    return list.sort((a, b) => {
      if (analyticsSort === 'oldest') return a.date.localeCompare(b.date)
      if (analyticsSort === 'created') return b.created - a.created || b.date.localeCompare(a.date)
      if (analyticsSort === 'completed') return b.completed - a.completed || b.date.localeCompare(a.date)
      if (analyticsSort === 'revenue') return b.revenue - a.revenue || b.date.localeCompare(a.date)
      return b.date.localeCompare(a.date)
    })
  }, [analyticsRange, analyticsSort, orders])

  const getStatusBadge = (status: ServiceOrder['status']) => {
    if (status === 'open') {
      return <Badge variant="outline" className="border-amber-400/20 bg-amber-400/[0.08] text-amber-300">Aberta</Badge>
    }
    if (status === 'in-progress') {
      return <Badge variant="outline" className="border-blue-400/20 bg-blue-400/[0.08] text-blue-300">Em andamento</Badge>
    }
    return <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">Concluída</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="p-4 pt-20 md:ml-64 md:p-6 lg:p-8 xl:p-10">
        <div className="mx-auto w-full max-w-[1500px]">
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                {view === 'operational' ? <ServerCog className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                {view === 'operational' ? 'Painel operacional' : 'Visão gerencial'}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {view === 'operational'
                  ? 'Acompanhe o que aconteceu hoje ou nesta semana e o que precisa de atenção agora.'
                  : 'Analise volume, conclusão, faturamento e evolução histórica por período.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {role === 'admin' ? (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/clientes?novo=1"><Users className="mr-2 h-4 w-4" />Novo cliente</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/ordens?novo=1"><Plus className="mr-2 h-4 w-4" />Nova OS</Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href="/ordens?status=open"><Wrench className="mr-2 h-4 w-4" />Ver fila de atendimento</Link>
                </Button>
              )}
            </div>
          </header>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-xl border border-border/70 bg-card/65 p-1">
              <button
                type="button"
                onClick={() => setView('operational')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${view === 'operational' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Operacional
              </button>
              <button
                type="button"
                onClick={() => setView('analytics')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${view === 'analytics' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Analítico
              </button>
            </div>

            {view === 'operational' && (
              <div className="inline-flex w-fit rounded-xl border border-border/70 bg-card/65 p-1">
                <button
                  type="button"
                  onClick={() => setOperationalPeriod('day')}
                  className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${operationalPeriod === 'day' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >Hoje</button>
                <button
                  type="button"
                  onClick={() => setOperationalPeriod('week')}
                  className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${operationalPeriod === 'week' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >Esta semana</button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-[142px] animate-pulse rounded-2xl border border-border/60 bg-card/55" />)}
              </div>
              <div className="h-[420px] animate-pulse rounded-2xl border border-border/60 bg-card/55" />
            </div>
          ) : view === 'operational' ? (
            <>
              <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatsCard title="OS criadas" value={operationalMetrics.created} icon={ClipboardList} description={`${operationalRange.label} • novas ordens registradas`} tone="cyan" href="/ordens" />
                <StatsCard title="Iniciaram atendimento" value={operationalMetrics.started} icon={PlayCircle} description={`${operationalRange.label} • entraram em execução`} tone="blue" href="/ordens?status=in-progress" />
                <StatsCard title="Concluídas" value={operationalMetrics.completed} icon={CheckCircle2} description={`${operationalRange.label} • serviços finalizados`} tone="emerald" href="/ordens?status=completed" />
                <StatsCard title="Faturamento" value={moneyFormatter.format(operationalMetrics.revenue)} icon={DollarSign} description={`${operationalRange.label} • OS concluídas`} tone="cyan" href="/ordens?status=completed" />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <Card className="tech-panel overflow-hidden border-border/70 bg-card/75 py-0">
                  <CardHeader className="border-b border-border/55 px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><CalendarDays className="h-4 w-4" /></span>
                          Ordens de {operationalRange.label.toLowerCase()}
                        </CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">Somente OS criadas no período selecionado.</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-primary">
                        <Link href="/ordens">Ver todas <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    {operationalOrders.length === 0 ? (
                      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 text-center">
                        <ClipboardList className="mb-3 h-7 w-7 text-muted-foreground/35" />
                        <p className="text-sm font-medium text-foreground/75">Nenhuma OS criada neste período</p>
                        <p className="mt-1 text-xs text-muted-foreground/65">Troque para a semana ou registre uma nova ordem.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {operationalOrders.slice(0, 8).map((order) => (
                          <Link
                            href={`/ordens?q=${encodeURIComponent(String(order.id))}`}
                            key={order.id}
                            className="group flex items-center justify-between gap-4 rounded-xl border border-transparent px-3 py-3 transition-all hover:border-border/60 hover:bg-secondary/35"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/35 font-mono text-[10px] font-bold text-primary">
                                #{String(order.id).padStart(2, '0')}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-card-foreground">{order.clientName}</p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">{order.equipmentName} • {order.problemDescription}</p>
                              </div>
                            </div>
                            {getStatusBadge(order.status)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="tech-panel overflow-hidden border-border/70 bg-card/75 py-0">
                  <CardHeader className="border-b border-border/55 px-5 py-4 sm:px-6">
                    <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300"><Activity className="h-4 w-4" /></span>
                      Situação agora
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    <div className="space-y-3">
                      <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.045] p-4">
                        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Aguardando início</span><strong className="text-amber-300">{operationalMetrics.waitingNow}</strong></div>
                        <p className="mt-1 text-xs text-muted-foreground/70">Fila atual de ordens ainda não iniciadas.</p>
                      </div>
                      <div className="rounded-xl border border-blue-400/15 bg-blue-400/[0.045] p-4">
                        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Em execução agora</span><strong className="text-blue-300">{operationalMetrics.runningNow}</strong></div>
                        <p className="mt-1 text-xs text-muted-foreground/70">Serviços que estão sob atendimento técnico.</p>
                      </div>
                      <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-4">
                        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Conclusão no período</span><strong className="text-emerald-300">{operationalMetrics.created ? Math.round((operationalMetrics.completed / operationalMetrics.created) * 100) : 0}%</strong></div>
                        <p className="mt-1 text-xs text-muted-foreground/70">Relação entre OS criadas e concluídas no período selecionado.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </>
          ) : (
            <>
              <section className="mb-5 rounded-2xl border border-border/70 bg-card/65 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['today', 'Hoje'],
                      ['week', 'Esta semana'],
                      ['30d', '30 dias'],
                      ['month', 'Mês atual'],
                      ['all', 'Todo período'],
                      ['custom', 'Personalizado'],
                    ] as Array<[AnalyticsPreset, string]>).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAnalyticsPreset(key)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${analyticsPreset === key ? 'border-primary/25 bg-primary/10 text-primary' : 'border-border/60 bg-background/25 text-muted-foreground hover:text-foreground'}`}
                      >{label}</button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {analyticsPreset === 'custom' && (
                      <>
                        <Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="h-9 w-auto bg-background/45 text-xs" aria-label="Data inicial" />
                        <span className="hidden text-xs text-muted-foreground sm:inline">até</span>
                        <Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="h-9 w-auto bg-background/45 text-xs" aria-label="Data final" />
                      </>
                    )}
                    <select
                      value={analyticsSort}
                      onChange={(event) => setAnalyticsSort(event.target.value as AnalyticsSort)}
                      className="h-9 rounded-md border border-border/70 bg-background/45 px-3 text-xs text-foreground outline-none"
                      aria-label="Ordenar analítico"
                    >
                      <option value="recent">Mais recentes</option>
                      <option value="oldest">Mais antigos</option>
                      <option value="created">Mais OS criadas</option>
                      <option value="completed">Mais conclusões</option>
                      <option value="revenue">Maior faturamento</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatsCard title="OS criadas" value={analyticsMetrics.created} icon={ClipboardList} description={analyticsRange.label} tone="cyan" />
                <StatsCard title="Iniciaram execução" value={analyticsMetrics.started} icon={PlayCircle} description={analyticsRange.label} tone="blue" />
                <StatsCard title="Concluídas" value={analyticsMetrics.completed} icon={CheckCircle2} description={analyticsRange.label} tone="emerald" />
                <StatsCard title="Faturamento" value={moneyFormatter.format(analyticsMetrics.revenue)} icon={DollarSign} description={analyticsRange.label} tone="cyan" />
              </section>

              <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-border/65 bg-card/45 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Clientes no período</p>
                  <p className="mt-1 text-xl font-semibold">{analyticsMetrics.createdClients}</p>
                </div>
                <div className="rounded-xl border border-border/65 bg-card/45 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Equip. no período</p>
                  <p className="mt-1 text-xl font-semibold">{analyticsMetrics.createdEquipments}</p>
                </div>
                <div className="rounded-xl border border-border/65 bg-card/45 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Clientes históricos</p>
                  <p className="mt-1 text-xl font-semibold">{clients.length}</p>
                </div>
                <div className="rounded-xl border border-border/65 bg-card/45 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Equip. históricos</p>
                  <p className="mt-1 text-xl font-semibold">{equipments.length}</p>
                </div>
                <div className="rounded-xl border border-border/65 bg-card/45 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">OS históricas</p>
                  <p className="mt-1 text-xl font-semibold">{orders.length}</p>
                </div>
              </section>

              <Card className="tech-panel overflow-hidden border-border/70 bg-card/75 py-0">
                <CardHeader className="border-b border-border/55 px-5 py-4 sm:px-6">
                  <div>
                    <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><BarChart3 className="h-4 w-4" /></span>
                      Movimentação diária
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">Criações, inícios de atendimento, conclusões e faturamento por dia.</p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border/60 bg-secondary/25 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold">Data</th>
                          <th className="px-5 py-3 text-right font-semibold">Criadas</th>
                          <th className="px-5 py-3 text-right font-semibold">Iniciadas</th>
                          <th className="px-5 py-3 text-right font-semibold">Concluídas</th>
                          <th className="px-5 py-3 text-right font-semibold">Faturamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyRows.length === 0 ? (
                          <tr><td colSpan={5} className="h-36 px-5 text-center text-sm text-muted-foreground">Nenhuma movimentação encontrada no período.</td></tr>
                        ) : dailyRows.map((row) => (
                          <tr key={row.date} className="border-b border-border/45 last:border-0 hover:bg-primary/[0.025]">
                            <td className="px-5 py-3.5 font-medium">{displayDate(row.date)}</td>
                            <td className="px-5 py-3.5 text-right text-primary">{row.created}</td>
                            <td className="px-5 py-3.5 text-right text-blue-300">{row.started}</td>
                            <td className="px-5 py-3.5 text-right text-emerald-300">{row.completed}</td>
                            <td className="px-5 py-3.5 text-right font-medium">{moneyFormatter.format(row.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
