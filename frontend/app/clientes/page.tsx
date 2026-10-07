'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Sidebar } from '@/components/sidebar'
import { DataTable } from '@/components/data-table'
import { ClientForm, formatPhoneBR } from '@/components/client-form'
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
  Mail,
  MapPin,
  Monitor,
  Phone,
  Plus,
  Search,
  UserRound,
  Users,
} from 'lucide-react'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
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
      console.error('Erro ao carregar clientes:', error)
      toast.error('Não foi possível carregar os clientes.')
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
    setSearch(params.get('q') || '')
    if (params.get('novo') === '1') {
      setEditingClient(null)
      setFormOpen(true)
    }
    setAuthorized(true)
    fetchData()
  }, [router])

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return clients

    return clients.filter((client) =>
      [client.name, client.phone, client.email, client.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [clients, search])

  const relatedEquipments = selectedClient
    ? equipments.filter((equipment) => String(equipment.clientId) === String(selectedClient.id) || equipment.clientName === selectedClient.name)
    : []
  const relatedOrders = selectedClient
    ? orders.filter((order) => String(order.clientId) === String(selectedClient.id) || order.clientName === selectedClient.name)
    : []

  const columns = [
    {
      key: 'name',
      header: 'Cliente',
      sortable: true,
      sortValue: (client: Client) => client.name,
      render: (client: Client) => (
        <div>
          <p className="font-medium text-foreground">{client.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{client.email}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Telefone', sortable: true, sortValue: (client: Client) => client.phone, render: (client: Client) => <span className="whitespace-nowrap">{formatPhoneBR(client.phone)}</span> },
    { key: 'address', header: 'Endereço', sortable: true, sortValue: (client: Client) => client.address },
    {
      key: 'activity',
      header: 'Atividade',
      sortable: true,
      sortValue: (client: Client) => orders.filter((order) => String(order.clientId) === String(client.id) || order.clientName === client.name).length,
      render: (client: Client) => {
        const equipmentCount = equipments.filter((equipment) => String(equipment.clientId) === String(client.id) || equipment.clientName === client.name).length
        const orderCount = orders.filter((order) => String(order.clientId) === String(client.id) || order.clientName === client.name).length
        return <span className="text-xs text-muted-foreground">{equipmentCount} equip. • {orderCount} OS</span>
      },
    },
  ]

  const handleSave = async (data: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => {
    try {
      if (data.id) {
        await api.put(`clientes/${data.id}/`, data)
        toast.success('Cliente atualizado com sucesso.')
      } else {
        const response = await api.post('clientes/', data)
        const createdId = response.data?.id
        toast.success('Cliente cadastrado com sucesso.', {
          description: 'Você já pode vincular um equipamento a este cliente.',
          action: createdId
            ? {
                label: 'Cadastrar equipamento',
                onClick: () => router.push(`/equipamentos?cliente=${createdId}&novo=1`),
              }
            : undefined,
        })
      }
      setFormOpen(false)
      setEditingClient(null)
      await fetchData()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      toast.error('Não foi possível salvar o cliente.', { description: 'Verifique a conexão com o servidor e tente novamente.' })
      throw error
    }
  }

  const handleDelete = (client: Client) => {
    const hasEquipment = equipments.some((equipment) => String(equipment.clientId) === String(client.id) || equipment.clientName === client.name)
    const hasOrders = orders.some((order) => String(order.clientId) === String(client.id) || order.clientName === client.name)

    if (hasEquipment || hasOrders) {
      toast.error('Este cliente possui histórico vinculado.', {
        description: 'Para preservar o histórico, remova ou trate os vínculos antes de excluir o cadastro.',
      })
      return
    }
    setDeleteClient(client)
  }

  const confirmDelete = async () => {
    if (!deleteClient) return
    try {
      await api.delete(`clientes/${deleteClient.id}/`)
      toast.success('Cliente excluído.')
      setDeleteClient(null)
      await fetchData()
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      toast.error('Não foi possível excluir o cliente.')
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
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                <Users className="h-3.5 w-3.5" />
                Cadastros
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Clientes</h1>
              <p className="mt-1 text-sm text-muted-foreground">{clients.length} clientes cadastrados • histórico centralizado por atendimento.</p>
            </div>
            <Button onClick={() => { setEditingClient(null); setFormOpen(true) }} className="h-10">
              <Plus className="mr-2 h-4 w-4" />
              Novo cliente
            </Button>
          </header>

          <section className="tech-panel overflow-hidden rounded-2xl border border-border/70 bg-card/70">
            <div className="flex flex-col gap-3 border-b border-border/55 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, telefone, e-mail ou endereço..."
                  className="h-10 border-border/70 bg-background/45 pl-10"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {filteredClients.length === clients.length ? `${clients.length} registros` : `${filteredClients.length} de ${clients.length} registros`}
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Carregando clientes...
                </div>
              ) : (
                <DataTable
                  data={filteredClients}
                  columns={columns}
                  defaultSortKey="name"
                  defaultSortDirection="asc"
                  onView={setSelectedClient}
                  onEdit={(client) => { setEditingClient(client); setFormOpen(true) }}
                  onDelete={handleDelete}
                  emptyTitle={search ? 'Nenhum cliente corresponde à busca' : 'Nenhum cliente cadastrado'}
                  emptyDescription={search ? 'Tente buscar por outro nome ou contato.' : 'Cadastre o primeiro cliente para iniciar um atendimento.'}
                />
              )}
            </div>
          </section>
        </div>

        <ClientForm open={formOpen} onOpenChange={setFormOpen} client={editingClient} onSave={handleSave} />

        <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
          <DialogContent className="border-border/80 bg-card/95 sm:max-w-2xl">
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <DialogTitle>{selectedClient?.name}</DialogTitle>
              <DialogDescription>Visão consolidada do cliente e do histórico relacionado.</DialogDescription>
            </DialogHeader>

            {selectedClient && (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5">
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" />Telefone</div>
                    <p className="text-sm font-medium">{selectedClient.phone}</p>
                  </div>
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5">
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" />E-mail</div>
                    <p className="truncate text-sm font-medium">{selectedClient.email}</p>
                  </div>
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5 sm:col-span-2">
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />Endereço</div>
                    <p className="text-sm font-medium">{selectedClient.address}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-blue-400/15 bg-blue-400/[0.045] p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium"><Monitor className="h-4 w-4 text-blue-300" />Equipamentos</span>
                      <Badge variant="outline" className="border-blue-400/20 text-blue-300">{relatedEquipments.length}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {relatedEquipments.slice(0, 3).map((equipment) => (
                        <div key={equipment.id} className="text-xs text-muted-foreground">{equipment.brand} {equipment.model} • {equipment.name}</div>
                      ))}
                      {relatedEquipments.length === 0 && <p className="text-xs text-muted-foreground">Nenhum equipamento vinculado.</p>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-primary/15 bg-primary/[0.045] p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium"><ClipboardList className="h-4 w-4 text-primary" />Ordens</span>
                      <Badge variant="outline" className="border-primary/20 text-primary">{relatedOrders.length}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {relatedOrders.slice(-3).reverse().map((order) => (
                        <div key={order.id} className="text-xs text-muted-foreground">OS #{String(order.id).padStart(4, '0')} • {order.equipmentName}</div>
                      ))}
                      {relatedOrders.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma OS registrada.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="outline"
                onClick={() => selectedClient && router.push(`/equipamentos?cliente=${selectedClient.id}&novo=1`)}
              >
                <Monitor className="mr-2 h-4 w-4" />Cadastrar equipamento
              </Button>
              <Button
                onClick={() => selectedClient && router.push(`/ordens?cliente=${selectedClient.id}&novo=1`)}
              >
                Nova OS <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteClient} onOpenChange={(open) => !open && setDeleteClient(null)}>
          <AlertDialogContent className="border-border/80 bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir cliente sem histórico?</AlertDialogTitle>
              <AlertDialogDescription>
                O cadastro de <strong>{deleteClient?.name}</strong> será removido permanentemente. Registros com histórico vinculado são protegidos pela interface.
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
