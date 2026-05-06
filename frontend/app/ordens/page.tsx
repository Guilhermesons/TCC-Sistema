'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { DataTable } from '@/components/data-table'
import { ServiceOrderForm } from '@/components/service-order-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { mockServiceOrders, mockClients, mockEquipments } from '@/lib/store'
import { ServiceOrder, Client, Equipment, ServiceOrderStatus } from '@/lib/types'
import { Plus, ClipboardList } from 'lucide-react'

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>(mockServiceOrders)
  const [clients] = useState<Client[]>(mockClients)
  const [equipments] = useState<Equipment[]>(mockEquipments)
  const [formOpen, setFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null)
  const [deleteOrder, setDeleteOrder] = useState<ServiceOrder | null>(null)

  const getStatusBadge = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500">Aberta</Badge>
      case 'in-progress':
        return <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-blue-500">Em Andamento</Badge>
      case 'completed':
        return <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">Concluída</Badge>
      default:
        return null
    }
  }

  const columns = [
    { key: 'clientName' as const, header: 'Cliente' },
    { key: 'equipmentName' as const, header: 'Equipamento' },
    {
      key: 'problemDescription' as const,
      header: 'Problema',
      render: (order: ServiceOrder) => (
        <span className="line-clamp-2 max-w-xs">{order.problemDescription}</span>
      ),
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (order: ServiceOrder) => getStatusBadge(order.status),
    },
  ]

  const handleSave = (data: {
    id?: string
    clientId: string
    equipmentId: string
    problemDescription: string
    status: ServiceOrderStatus
  }) => {
    const client = clients.find((c) => c.id === data.clientId)
    const equipment = equipments.find((e) => e.id === data.equipmentId)

    if (data.id) {
      setOrders(orders.map((o) =>
        o.id === data.id
          ? {
              ...o,
              clientId: data.clientId,
              clientName: client?.name || '',
              equipmentId: data.equipmentId,
              equipmentName: `${equipment?.brand} ${equipment?.model}` || '',
              problemDescription: data.problemDescription,
              status: data.status,
              updatedAt: new Date(),
            }
          : o
      ))
    } else {
      const newOrder: ServiceOrder = {
        id: String(Date.now()),
        clientId: data.clientId,
        clientName: client?.name || '',
        equipmentId: data.equipmentId,
        equipmentName: `${equipment?.brand} ${equipment?.model}` || '',
        problemDescription: data.problemDescription,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setOrders([...orders, newOrder])
    }
    setEditingOrder(null)
  }

  const handleEdit = (order: ServiceOrder) => {
    setEditingOrder(order)
    setFormOpen(true)
  }

  const handleDelete = (order: ServiceOrder) => {
    setDeleteOrder(order)
  }

  const confirmDelete = () => {
    if (deleteOrder) {
      setOrders(orders.filter((o) => o.id !== deleteOrder.id))
      setDeleteOrder(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ordens de Serviço</h1>
            <p className="text-muted-foreground">Gerencie as ordens de serviço</p>
          </div>
          <Button
            onClick={() => {
              setEditingOrder(null)
              setFormOpen(true)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Ordem
          </Button>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <ClipboardList className="h-5 w-5 text-primary" />
              Lista de Ordens de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={orders}
              columns={columns}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>

        <ServiceOrderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          order={editingOrder}
          clients={clients}
          equipments={equipments}
          onSave={handleSave}
        />

        <AlertDialog open={!!deleteOrder} onOpenChange={() => setDeleteOrder(null)}>
          <AlertDialogContent className="border-border bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-card-foreground">
                Confirmar exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Tem certeza que deseja excluir a ordem de serviço de {deleteOrder?.clientName}? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
