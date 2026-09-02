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
import { Client, Equipment, ServiceOrder } from '@/lib/types'
import { toast } from 'sonner'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DollarSign,
  Monitor,
  Plus,
  ServerCog,
  Users,
  Wrench,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  const metrics = useMemo(() => {
    const open = orders.filter((order) => order.status === 'open').length
    const inProgress = orders.filter((order) => order.status === 'in-progress').length
    const completed = orders.filter((order) => order.status === 'completed').length
    const revenue = orders
      .filter((order) => order.status === 'completed')
      .reduce((total, order) => total + Number(order.price || 0), 0)
    return { open, inProgress, completed, revenue }
  }, [orders])

  const getStatusBadge = (status: ServiceOrder['status']) => {
    if (status === 'open') {
      return <Badge variant="outline" className="border-amber-400/20 bg-amber-400/[0.08] text-amber-300">Aberta</Badge>
    }
    if (status === 'in-progress') {
      return <Badge variant="outline" className="border-blue-400/20 bg-blue-400/[0.08] text-blue-300">Em andamento</Badge>
    }
    return <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">Concluída</Badge>
  }

  const money = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(metrics.revenue)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-6 lg:p-8 xl:p-10">
        <div className="mx-auto w-full max-w-[1500px]">
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                <ServerCog className="h-3.5 w-3.5" />
                Painel operacional
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">O que precisa de atenção agora e um resumo rápido da operação.</p>
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

          {loading ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-[142px] animate-pulse rounded-2xl border border-border/60 bg-card/55" />)}
              </div>
              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="h-[420px] animate-pulse rounded-2xl border border-border/60 bg-card/55" />
                <div className="h-[420px] animate-pulse rounded-2xl border border-border/60 bg-card/55" />
              </div>
            </div>
          ) : (
            <>
              <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatsCard title="Aguardando" value={metrics.open} icon={Clock3} description="Ordens que ainda precisam iniciar" tone="amber" href="/ordens?status=open" />
                <StatsCard title="Em atendimento" value={metrics.inProgress} icon={Wrench} description="Serviços atualmente em execução" tone="blue" href="/ordens?status=in-progress" />
                <StatsCard title="Concluídas" value={metrics.completed} icon={CheckCircle2} description="Histórico de serviços finalizados" tone="emerald" href="/ordens?status=completed" />
                <StatsCard title="Faturamento concluído" value={money} icon={DollarSign} description="Soma dos valores das OS concluídas" tone="cyan" href="/ordens?status=completed" />
              </section>

              <section className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/65 bg-card/45 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Clientes</p>
                  <p className="mt-1 text-xl font-semibold">{clients.length}</p>
                </div>
                <div className="rounded-xl border border-border/65 bg-card/45 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Equipamentos</p>
                  <p className="mt-1 text-xl font-semibold">{equipments.length}</p>
                </div>
                <div className="rounded-xl border border-border/65 bg-card/45 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ordens registradas</p>
                  <p className="mt-1 text-xl font-semibold">{orders.length}</p>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <Card className="tech-panel overflow-hidden border-border/70 bg-card/75 py-0">
                  <CardHeader className="border-b border-border/55 px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><ClipboardList className="h-4 w-4" /></span>
                        Ordens recentes
                      </CardTitle>
                      <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-primary">
                        <Link href="/ordens">Ver todas <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    {orders.length === 0 ? (
                      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 text-center">
                        <ClipboardList className="mb-3 h-7 w-7 text-muted-foreground/35" />
                        <p className="text-sm font-medium text-foreground/75">Nenhuma ordem registrada</p>
                        <p className="mt-1 text-xs text-muted-foreground/65">As novas ordens aparecerão aqui.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {orders.slice(-7).reverse().map((order) => (
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
                      Resumo operacional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    <div className="space-y-3">
                      <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.045] p-4">
                        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Aguardando início</span><strong className="text-amber-300">{metrics.open}</strong></div>
                        <p className="mt-1 text-xs text-muted-foreground/70">Priorize ordens abertas para reduzir tempo de espera.</p>
                      </div>
                      <div className="rounded-xl border border-blue-400/15 bg-blue-400/[0.045] p-4">
                        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Em execução</span><strong className="text-blue-300">{metrics.inProgress}</strong></div>
                        <p className="mt-1 text-xs text-muted-foreground/70">Serviços que já estão sob atendimento técnico.</p>
                      </div>
                      <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-4">
                        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Taxa de conclusão</span><strong className="text-emerald-300">{orders.length ? Math.round((metrics.completed / orders.length) * 100) : 0}%</strong></div>
                        <p className="mt-1 text-xs text-muted-foreground/70">Percentual de ordens já finalizadas no histórico.</p>
                      </div>
                    </div>

                    {role === 'admin' && equipments.length > 0 && (
                      <div className="mt-5 border-t border-border/55 pt-4">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Equipamentos recentes</p>
                        <div className="space-y-2">
                          {equipments.slice(-3).reverse().map((equipment) => (
                            <Link key={equipment.id} href={`/equipamentos?q=${encodeURIComponent(`${equipment.brand} ${equipment.model}`)}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary/30">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300"><Monitor className="h-4 w-4" /></span>
                              <span className="min-w-0"><span className="block truncate text-xs font-medium">{equipment.brand} {equipment.model}</span><span className="block truncate text-[11px] text-muted-foreground">{equipment.clientName}</span></span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
