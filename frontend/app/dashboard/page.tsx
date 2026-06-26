'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Importado para fazer o redirecionamento
import api from '@/services/api' // Conexão Axios com o Django
import { Sidebar } from '@/components/sidebar'
import { StatsCard } from '@/components/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button' // Importado para manter o padrão de estilo
import { Users, Monitor, ClipboardList, CheckCircle, Clock, AlertCircle, LogOut } from 'lucide-react'

// Tipagem básica baseada no retorno esperado do Django
interface DashboardOrder {
  id: string | number
  clientName: string
  equipmentName: string
  status: 'open' | 'in-progress' | 'completed' | string
}

interface DashboardEquipment {
  id: string | number
  name: string
  brand?: string
  model?: string
  clientName: string
}

export default function DashboardPage() {
  const router = useRouter() // Inicializando o roteador do Next.js
  
  // Estados para armazenar os dados dinâmicos do banco
  const [orders, setOrders] = useState<DashboardOrder[]>([])
  const [equipments, setEquipments] = useState<DashboardEquipment[]>([])
  const [totalClients, setTotalClients] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Dispara todas as requisições em paralelo para máxima performance
        const [clientsRes, equipmentsRes, ordersRes] = await Promise.all([
          api.get('clientes/'),
          api.get('equipamentos/'),
          api.get('os/')
        ])

        setTotalClients(clientsRes.data.length || 0)
        setEquipments(equipmentsRes.data || [])
        setOrders(ordersRes.data || [])
      } catch (error) {
        console.error("Erro ao carregar dados do Dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Função para limpar os dados de sessão e mandar de volta para a tela de login
  const handleLogout = () => {
    localStorage.clear() // Limpa os dados salvos (como o user_role)
    router.push('/') // Joga o usuário de volta na página de Login
  }

  // Cálculos baseados nos estados dinâmicos vindos do Django
  const totalOrders = orders.length
  const ordersInProgress = orders.filter((o) => o.status === 'in-progress').length
  const completedOrders = orders.filter((o) => o.status === 'completed').length
  const openOrders = orders.filter((o) => o.status === 'open').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500">Aberta</Badge>
      case 'in-progress':
        return <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-blue-500">Em Andamento</Badge>
      case 'completed':
        return <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">Concluída</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        
        {/* Cabeçalho do Dashboard ajustado para incluir o botão alinhado à direita */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do sistema de ordens de serviço</p>
          </div>
          
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="flex items-center gap-2 font-medium"
          >
            <LogOut className="h-4 w-4" />
            Sair do Sistema
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Carregando indicadores em tempo real...
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total de Clientes"
                value={totalClients}
                icon={Users}
                description="Clientes cadastrados"
              />
              <StatsCard
                title="Total de Ordens"
                value={totalOrders}
                icon={ClipboardList}
                description="Ordens de serviço"
              />
              <StatsCard
                title="Em Andamento"
                value={ordersInProgress}
                icon={Clock}
                description="Ordens em progresso"
              />
              <StatsCard
                title="Concluídas"
                value={completedOrders}
                icon={CheckCircle}
                description="Ordens finalizadas"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Card de Ordens Recentes */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Ordens Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma ordem recente encontrada.</p>
                    ) : (
                      orders.slice(-5).reverse().map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-card-foreground">{order.clientName}</p>
                            <p className="text-sm text-muted-foreground">{order.equipmentName}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card de Equipamentos Recentes */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Monitor className="h-5 w-5 text-primary" />
                    Equipamentos Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {equipments.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Nenhum equipamento recente encontrado.</p>
                    ) : (
                      equipments.slice(-5).reverse().map((equipment) => (
                        <div
                          key={equipment.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-card-foreground">
                              {equipment.brand || equipment.model 
                                ? `${equipment.brand || ''} ${equipment.model || ''}`.trim()
                                : equipment.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{equipment.clientName}</p>
                          </div>
                          <Badge variant="secondary">{equipment.name}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resumo de Status inferior */}
              <Card className="border-border bg-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Resumo de Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-500">{openOrders}</p>
                        <p className="text-sm text-muted-foreground">Abertas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-500">{ordersInProgress}</p>
                        <p className="text-sm text-muted-foreground">Em Andamento</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{completedOrders}</p>
                        <p className="text-sm text-muted-foreground">Concluídas</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  )
}