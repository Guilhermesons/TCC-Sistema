'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Client, Equipment, ServiceOrder } from '@/lib/types'
import {
  ClipboardList,
  Loader2,
  Monitor,
  Search,
  UserRound,
} from 'lucide-react'

interface GlobalSearchProps {
  role: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ role, open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])

  useEffect(() => {
    if (!open) return

    const load = async () => {
      try {
        setLoading(true)

        if (role === 'admin') {
          const [clientsRes, equipmentsRes, ordersRes] = await Promise.all([
            api.get('clientes/'),
            api.get('equipamentos/'),
            api.get('os/'),
          ])
          setClients(clientsRes.data || [])
          setEquipments(equipmentsRes.data || [])
          setOrders(ordersRes.data || [])
        } else {
          const ordersRes = await api.get('os/')
          setOrders(ordersRes.data || [])
          setClients([])
          setEquipments([])
        }
      } catch (error) {
        console.error('Erro ao carregar busca global:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, role])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const normalized = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (normalized.length < 2) {
      return { clients: [], equipments: [], orders: [] }
    }

    return {
      clients: clients
        .filter((client) =>
          [client.name, client.email, client.phone, client.address]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalized)),
        )
        .slice(0, 5),
      equipments: equipments
        .filter((equipment) =>
          [equipment.name, equipment.brand, equipment.model, equipment.clientName]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalized)),
        )
        .slice(0, 5),
      orders: orders
        .filter((order) =>
          [order.id, order.clientName, order.equipmentName, order.problemDescription]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalized)),
        )
        .slice(0, 7),
    }
  }, [clients, equipments, orders, normalized])

  const totalResults = results.clients.length + results.equipments.length + results.orders.length

  const goTo = (path: string) => {
    onOpenChange(false)
    router.push(path)
  }

  const statusLabel: Record<ServiceOrder['status'], string> = {
    open: 'Aberta',
    'in-progress': 'Em andamento',
    completed: 'Concluída',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[82vh] overflow-hidden border-border/80 bg-card/95 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" />
            Busca global
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={role === 'admin' ? 'Busque cliente, equipamento ou OS...' : 'Busque uma ordem de serviço...'}
              className="h-11 border-border/75 bg-background/55 pl-10"
            />
          </div>

          <div className="mt-4 max-h-[58vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Carregando registros...
              </div>
            ) : normalized.length < 2 ? (
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <Search className="mb-3 h-7 w-7 text-muted-foreground/35" />
                <p className="text-sm font-medium text-foreground/80">Digite pelo menos 2 caracteres</p>
                <p className="mt-1 text-xs text-muted-foreground">Use nome, equipamento, número da OS ou descrição.</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <Search className="mb-3 h-7 w-7 text-muted-foreground/35" />
                <p className="text-sm font-medium text-foreground/80">Nenhum resultado encontrado</p>
                <p className="mt-1 text-xs text-muted-foreground">Tente outro termo de busca.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {results.clients.length > 0 && (
                  <section>
                    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Clientes</p>
                    <div className="space-y-1">
                      {results.clients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => goTo(`/clientes?q=${encodeURIComponent(client.name)}`)}
                          className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-border/70 hover:bg-secondary/35"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                            <UserRound className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">{client.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{client.email || client.phone}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {results.equipments.length > 0 && (
                  <section>
                    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Equipamentos</p>
                    <div className="space-y-1">
                      {results.equipments.map((equipment) => (
                        <button
                          key={equipment.id}
                          onClick={() => goTo(`/equipamentos?q=${encodeURIComponent(`${equipment.brand} ${equipment.model}`)}`)}
                          className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-border/70 hover:bg-secondary/35"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300">
                            <Monitor className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">{equipment.brand} {equipment.model}</span>
                            <span className="block truncate text-xs text-muted-foreground">{equipment.name} • {equipment.clientName}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {results.orders.length > 0 && (
                  <section>
                    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ordens de serviço</p>
                    <div className="space-y-1">
                      {results.orders.map((order) => (
                        <button
                          key={order.id}
                          onClick={() => goTo(`/ordens?q=${encodeURIComponent(String(order.id))}`)}
                          className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-border/70 hover:bg-secondary/35"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ClipboardList className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">OS #{String(order.id).padStart(4, '0')} • {order.clientName}</span>
                            <span className="block truncate text-xs text-muted-foreground">{order.equipmentName} • {order.problemDescription}</span>
                          </span>
                          <Badge variant="outline" className="shrink-0 border-border/70 bg-background/40 text-[10px] text-muted-foreground">
                            {statusLabel[order.status] || order.status}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
