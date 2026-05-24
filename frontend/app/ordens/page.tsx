'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api' // Conexão Axios com o Django
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
import { ServiceOrder, Client, Equipment, ServiceOrderStatus } from '@/lib/types'
import { Plus, ClipboardList } from 'lucide-react'

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null)
  const [deleteOrder, setDeleteOrder] = useState<ServiceOrder | null>(null)

  // 1. Busca Ordens de Serviço usando a rota real do Django ('os/')
  const fetchOrders = async () => {
    try {
      const response = await api.get('os/') 
      console.log("Dados das ordens recebidos:", response.data)
      setOrders(response.data)
    } catch (error) {
      console.error("Erro ao carregar ordens de serviço:", error)
    }
  }

  // 2. Busca Clientes do Django
  const fetchClients = async () => {
    try {
      const response = await api.get('clientes/')
      setClients(response.data)
    } catch (error) {
      console.error("Erro ao carregar clientes do banco:", error)
    }
  }

  // 3. Busca Equipamentos do Django
  const fetchEquipments = async () => {
    try {
      const response = await api.get('equipamentos/')
      setEquipments(response.data)
    } catch (error) {
      console.error("Erro ao carregar equipamentos do banco:", error)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchClients()
    fetchEquipments()
  }, [])

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

  // Mapeamento das colunas pronto para injetar dados no componente DataTable
  const columns = [
    { key: 'clientName', accessorKey: 'clientName', dataIndex: 'clientName', header: 'Cliente' },
    { key: 'equipmentName', accessorKey: 'equipmentName', dataIndex: 'equipmentName', header: 'Equipamento' },
    {
      key: 'problemDescription',
      accessorKey: 'problemDescription',
      dataIndex: 'problemDescription',
      header: 'Problema',
      render: (order: ServiceOrder) => (
        <span className="line-clamp-2 max-w-xs">{order.problemDescription}</span>
      ),
    },
    {
      key: 'status',
      accessorKey: 'status',
      dataIndex: 'status',
      header: 'Status',
      render: (order: ServiceOrder) => getStatusBadge(order.status),
    },
  ]

  // Salva ou edita enviando para o endpoint 'os/'
  const handleSave = async (data: {
    id?: string
    clientId: string
    equipmentId: string
    problemDescription: string
    status: ServiceOrderStatus
  }) => {
    try {
      const url = data.id ? `os/${data.id}/` : 'os/'
      if (data.id) {
        await api.put(url, data)
      } else {
        await api.post(url, data)
      }
      setFormOpen(false)
      setEditingOrder(null)
      fetchOrders() 
    } catch (error) {
      console.error("Erro ao salvar ordem de serviço:", error)
      alert("Erro ao salvar a ordem de serviço. Verifique os dados enviados.")
    }
  }

  const handleEdit = (order: ServiceOrder) => {
    setEditingOrder(order)
    setFormOpen(true)
  }

  const handleDelete = (order: ServiceOrder) => {
    setDeleteOrder(order)
  }

  // Remove o registro do banco batendo em 'os/:id/'
  const confirmDelete = async () => {
    if (deleteOrder) {
      try {
        await api.delete(`os/${deleteOrder.id}/`)
        setDeleteOrder(null)
        fetchOrders()
      } catch (error) {
        console.error("Erro ao deletar ordem:", error)
        alert("Erro ao excluir a ordem de serviço.")
      }
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