'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Sidebar } from '@/components/sidebar'
import { DataTable } from '@/components/data-table'
import { EquipmentForm } from '@/components/equipment-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Client, Equipment, ServiceOrder } from '@/lib/types'
import { toast } from 'sonner'
import {
  ArrowRight,
  ClipboardList,
  Loader2,
  Monitor,
  Plus,
  Search,
  UserRound,
} from 'lucide-react'

export default function EquipmentPage() {
  const router = useRouter()
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [deleteEquipment, setDeleteEquipment] = useState<Equipment | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('all')
  const [initialClientId, setInitialClientId] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [equipmentsRes, clientsRes, ordersRes] = await Promise.all([
        api.get('equipamentos/'),
        api.get('clientes/'),
        api.get('os/'),
      ])
      setEquipments(equipmentsRes.data || [])
      setClients(clientsRes.data || [])
      setOrders(ordersRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error)
      toast.error('Não foi possível carregar os equipamentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const role = localStorage.getItem('user_role')
    if (!role) {
      router.replace('/')
      return
    }
    if (role !== 'admin') {
      router.replace('/dashboard')
      return
    }

    const params = new URLSearchParams(window.location.search)
    const clientId = params.get('cliente') || ''
    setSearch(params.get('q') || '')
    setInitialClientId(clientId)
    if (clientId) setClientFilter(clientId)
    if (params.get('novo') === '1') {
      setEditingEquipment(null)
      setFormOpen(true)
    }

    setAuthorized(true)
    fetchData()
  }, [router])

  const filteredEquipments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return equipments.filter((equipment) => {
      const matchesClient = clientFilter === 'all' || String(equipment.clientId) === String(clientFilter)
      const matchesSearch = !query || [equipment.name, equipment.brand, equipment.model, equipment.serialNumber, equipment.clientName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
      return matchesClient && matchesSearch
    })
  }, [equipments, search, clientFilter])

  const relatedOrders = selectedEquipment
    ? orders.filter((order) => String(order.equipmentId) === String(selectedEquipment.id) || order.equipmentName === selectedEquipment.name)
    : []
  const owner = selectedEquipment
    ? clients.find((client) => String(client.id) === String(selectedEquipment.clientId) || client.name === selectedEquipment.clientName)
    : undefined

  const columns = [
    {
      key: 'name',
      header: 'Equipamento',
      sortable: true,
      sortValue: (equipment: Equipment) => `${equipment.brand} ${equipment.model} ${equipment.name}`,
      render: (equipment: Equipment) => (
        <div>
          <p className="font-medium text-foreground">{equipment.brand} {equipment.model}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{equipment.name}</p>
        </div>
      ),
    },
    { key: 'clientName', header: 'Cliente', sortable: true, sortValue: (equipment: Equipment) => equipment.clientName },
    {
      key: 'history',
      header: 'Histórico',
      sortable: true,
      sortValue: (equipment: Equipment) => orders.filter((order) => String(order.equipmentId) === String(equipment.id) || order.equipmentName === equipment.name).length,
      render: (equipment: Equipment) => {
        const count = orders.filter((order) => String(order.equipmentId) === String(equipment.id) || order.equipmentName === equipment.name).length
        return <span className="text-xs text-muted-foreground">{count} {count === 1 ? 'ordem' : 'ordens'}</span>
      },
    },
  ]

  const handleSave = async (data: Omit<Equipment, 'id' | 'createdAt' | 'clientName'> & { id?: string }) => {
    try {
      if (data.id) {
        await api.put(`equipamentos/${data.id}/`, data)
        toast.success('Equipamento atualizado com sucesso.')
      } else {
        const response = await api.post('equipamentos/', data)
        const createdId = response.data?.id
        toast.success('Equipamento cadastrado com sucesso.', {
          description: 'Agora você pode abrir uma ordem de serviço para este equipamento.',
          action: createdId
            ? {
                label: 'Abrir OS',
                onClick: () => router.push(`/ordens?cliente=${data.clientId}&equipamento=${createdId}&novo=1`),
              }
            : undefined,
        })
      }
      setFormOpen(false)
      setEditingEquipment(null)
      setInitialClientId('')
      await fetchData()
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error)
      toast.error('Não foi possível salvar o equipamento.')
      throw error
    }
  }

  const handleDelete = (equipment: Equipment) => {
    const hasOrders = orders.some((order) => String(order.equipmentId) === String(equipment.id) || order.equipmentName === equipment.name)
    if (hasOrders) {
      toast.error('Este equipamento possui histórico de ordens.', {
        description: 'A exclusão foi bloqueada para preservar o histórico de atendimento.',
      })
      return
    }
    setDeleteEquipment(equipment)
  }

  const confirmDelete = async () => {
    if (!deleteEquipment) return
    try {
      await api.delete(`equipamentos/${deleteEquipment.id}/`)
      toast.success('Equipamento excluído.')
      setDeleteEquipment(null)
      await fetchData()
    } catch (error) {
      console.error('Erro ao excluir equipamento:', error)
      toast.error('Não foi possível excluir o equipamento.')
    }
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Verificando permissões...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="p-4 pt-20 md:ml-64 md:p-6 lg:p-8 xl:p-10">
        <div className="mx-auto w-full max-w-[1500px]">
          <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300/80">
                <Monitor className="h-3.5 w-3.5" />
                Ativos
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Equipamentos</h1>
              <p className="mt-1 text-sm text-muted-foreground">{equipments.length} equipamentos cadastrados e vinculados aos clientes.</p>
            </div>
            <Button onClick={() => { setEditingEquipment(null); setInitialClientId(''); setFormOpen(true) }} className="h-10">
              <Plus className="mr-2 h-4 w-4" />
              Novo equipamento
            </Button>
          </header>

          <section className="tech-panel overflow-hidden rounded-2xl border border-border/70 bg-card/70">
            <div className="grid gap-3 border-b border-border/55 p-4 md:grid-cols-[minmax(0,1fr)_260px_auto] md:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar equipamento, marca, modelo, série ou cliente..."
                  className="h-10 border-border/70 bg-background/45 pl-10"
                />
              </div>

              <select
                value={clientFilter}
                onChange={(event) => setClientFilter(event.target.value)}
                className="h-10 rounded-md border border-border/70 bg-background/45 px-3 text-sm text-foreground outline-none"
                aria-label="Filtrar por cliente"
              >
                <option value="all">Todos os clientes</option>
                {clients.map((client) => <option key={client.id} value={String(client.id)}>{client.name}</option>)}
              </select>

              <div className="whitespace-nowrap text-xs text-muted-foreground">
                {filteredEquipments.length} de {equipments.length}
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Carregando equipamentos...
                </div>
              ) : (
                <DataTable
                  data={filteredEquipments}
                  columns={columns}
                  defaultSortKey="name"
                  defaultSortDirection="asc"
                  onView={setSelectedEquipment}
                  onEdit={(equipment) => { setEditingEquipment(equipment); setInitialClientId(''); setFormOpen(true) }}
                  onDelete={handleDelete}
                  emptyTitle={search || clientFilter !== 'all' ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado'}
                  emptyDescription={search || clientFilter !== 'all' ? 'Ajuste os filtros para tentar novamente.' : 'Cadastre o primeiro equipamento para vinculá-lo a um cliente.'}
                />
              )}
            </div>
          </section>
        </div>

        <EquipmentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          equipment={editingEquipment}
          clients={clients}
          initialClientId={initialClientId}
          onSave={handleSave}
        />

        <Dialog open={!!selectedEquipment} onOpenChange={(open) => !open && setSelectedEquipment(null)}>
          <DialogContent className="border-border/80 bg-card/95 sm:max-w-2xl">
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                <Monitor className="h-5 w-5" />
              </div>
              <DialogTitle>{selectedEquipment?.brand} {selectedEquipment?.model}</DialogTitle>
              <DialogDescription>{selectedEquipment?.name} • histórico e vínculo do equipamento.</DialogDescription>
            </DialogHeader>

            {selectedEquipment && (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="mt-1 text-sm font-medium">{selectedEquipment.name}</p>
                  </div>
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Marca</p>
                    <p className="mt-1 text-sm font-medium">{selectedEquipment.brand}</p>
                  </div>
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Modelo</p>
                    <p className="mt-1 text-sm font-medium">{selectedEquipment.model}</p>
                  </div>
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Número de série</p>
                    <p className="mt-1 text-sm font-medium">{selectedEquipment.serialNumber || 'Não informado'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/15 bg-primary/[0.045] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium"><UserRound className="h-4 w-4 text-primary" />Cliente responsável</div>
                  <p className="mt-2 text-sm">{owner?.name || selectedEquipment.clientName || '—'}</p>
                  {owner && <p className="mt-1 text-xs text-muted-foreground">{owner.phone} • {owner.email}</p>}
                </div>

                <div className="rounded-xl border border-border/65 bg-background/25 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium"><ClipboardList className="h-4 w-4 text-primary" />Histórico de ordens</span>
                    <Badge variant="outline" className="border-primary/20 text-primary">{relatedOrders.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {relatedOrders.slice(-5).reverse().map((order) => (
                      <div key={order.id} className="rounded-lg border border-border/50 bg-card/50 px-3 py-2.5">
                        <p className="text-xs font-medium text-foreground">OS #{String(order.id).padStart(4, '0')} • {order.clientName}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{order.problemDescription}</p>
                      </div>
                    ))}
                    {relatedOrders.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma ordem registrada para este equipamento.</p>}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => selectedEquipment && router.push(`/ordens?cliente=${selectedEquipment.clientId}&equipamento=${selectedEquipment.id}&novo=1`)}
              >
                Abrir nova OS <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteEquipment} onOpenChange={(open) => !open && setDeleteEquipment(null)}>
          <AlertDialogContent className="border-border/80 bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir equipamento sem histórico?</AlertDialogTitle>
              <AlertDialogDescription>
                O equipamento <strong>{deleteEquipment?.brand} {deleteEquipment?.model}</strong> será removido permanentemente. Equipamentos com ordens vinculadas são protegidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
