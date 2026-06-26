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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ServiceOrder, Client, Equipment, ServiceOrderStatus } from '@/lib/types'
import { Plus, ClipboardList, DollarSign, FileText } from 'lucide-react'

// Importações para geração do PDF
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [role, setRole] = useState<string | null>(null)
  
  // Controle de formulário Admin
  const [formOpen, setFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null)
  const [deleteOrder, setDeleteOrder] = useState<ServiceOrder | null>(null)

  // Controle de formulário Técnico
  const [techModalOpen, setTechModalOpen] = useState(false)
  const [techOrder, setTechOrder] = useState<ServiceOrder | null>(null)
  const [servicePrice, setServicePrice] = useState('')
  const [serviceStatus, setServiceStatus] = useState<ServiceOrderStatus>('in-progress')
  const [serviceDone, setServiceDone] = useState('') // Estado para o que foi feito

  // Busca Ordens de Serviço
  const fetchOrders = async () => {
    try {
      const response = await api.get('os/') 
      setOrders(response.data)
    } catch (error) {
      console.error("Erro ao carregar ordens de serviço:", error)
    }
  }

  // Busca Clientes
  const fetchClients = async () => {
    try {
      const response = await api.get('clientes/')
      setClients(response.data)
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    }
  }

  // Busca Equipamentos
  const fetchEquipments = async () => {
    try {
      const response = await api.get('equipamentos/')
      setEquipments(response.data)
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
    }
  }

  useEffect(() => {
    setRole(localStorage.getItem('user_role'))
    fetchOrders()
    fetchClients()
    fetchEquipments()
  }, [])

  // Função para gerar e baixar o PDF detalhado do serviço
  const generatePDF = (order: ServiceOrder, currentServiceDone?: string, currentPrice?: string) => {
    // Encontra os dados completos do cliente associado à ordem
    const clientInfo = clients.find(c => c.id?.toString() === order.clientId?.toString() || c.name === order.clientName)
    const equipmentInfo = equipments.find(e => e.id?.toString() === order.equipmentId?.toString() || e.name === order.equipmentName)

    const doc = new jsPDF()

    // Topo / Cabeçalho do PDF
    doc.setFillColor(31, 41, 55) // Tom escuro elegante
    doc.rect(0, 0, 220, 35, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('TECHASSIST - RELATÓRIO DE SERVIÇO', 15, 22)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`OS NÚMERO: #00${order.id || '—'}`, 160, 22)

    // Dados do Cliente
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Dados do Cliente', 15, 50)

    autoTable(doc, {
      startY: 55,
      head: [['Campo', 'Informação']],
      body: [
        ['Nome do Cliente', clientInfo?.name || order.clientName || '—'],
        ['Telefone', clientInfo?.phone || '—'],
        ['E-mail', clientInfo?.email || '—'],
        ['Endereço', clientInfo?.address || '—'],
      ],
      theme: 'striped',
      headStyles: { fillHexColor: '#10b981' } // Verde esmeralda combinando com seu app
    })

    // Detalhes do Equipamento e do Serviço
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Detalhes da Ordem de Serviço', 15, (doc as any).lastAutoTable.finalY + 15)

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Item', 'Descrição']],
      body: [
        ['Equipamento', equipmentInfo?.name || order.equipmentName || '—'],
        ['Defeito Relatado', order.problemDescription || '—'],
        ['Serviço Realizado', currentServiceDone || (order as any).serviceDone || 'Não informado'],
        ['Valor Total', `R$ ${Number(currentPrice || (order as any).price || 0).toFixed(2)}`],
        ['Situação Final', order.status === 'completed' || serviceStatus === 'completed' ? 'Concluída / Pronto' : 'Em Andamento']
      ],
      theme: 'grid',
      headStyles: { fillHexColor: '#1f2937' }
    })

    // Rodapé simples de assinatura
    const finalY = (doc as any).lastAutoTable.finalY + 30
    doc.line(15, finalY, 90, finalY)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Assinatura do Técnico', 15, finalY + 5)

    doc.line(120, finalY, 195, finalY)
    doc.text('Assinatura do Cliente', 120, finalY + 5)

    // Faz o download do arquivo PDF automaticamente
    doc.save(`OS_00${order.id || 'fechamento'}_${order.clientName || 'cliente'}.pdf`)
  }

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
    {
      key: 'price',
      accessorKey: 'price',
      dataIndex: 'price',
      header: 'Valor (R$)',
      render: (order: any) => (
        <span>{order.price ? `R$ ${Number(order.price).toFixed(2)}` : '—'}</span>
      )
    },
    {
      key: 'pdf',
      header: 'PDF',
      render: (order: ServiceOrder) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation()
            generatePDF(order)
          }}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
        >
          <FileText className="h-4 w-4" />
        </Button>
      )
    }
  ]

  // Envia os dados atualizados do Técnico pro Django e na sequência gera o PDF
  const handleSaveTechData = async () => {
    if (!techOrder) return
    try {
      await api.patch(`os/${techOrder.id}/`, {
        price: servicePrice,
        status: serviceStatus,
        serviceDone: serviceDone // Certifique-se de ter esse campo de texto no Model do Django
      })
      
      // Gera o PDF na hora com os valores preenchidos no formulário atual
      generatePDF(techOrder, serviceDone, servicePrice)
      
      setTechModalOpen(false)
      setTechOrder(null)
      fetchOrders()
    } catch (error) {
      console.error("Erro ao salvar dados do técnico:", error)
      alert("Erro ao salvar o valor do serviço.")
    }
  }

  const handleEditClick = (order: ServiceOrder) => {
    if (role === 'admin') {
      setEditingOrder(order)
      setFormOpen(true)
    } else {
      setTechOrder(order)
      setServicePrice((order as any).price?.toString() || '')
      setServiceStatus(order.status)
      setServiceDone((order as any).serviceDone || '')
      setTechModalOpen(true)
    }
  }

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
    }
  }

  const handleDelete = (order: ServiceOrder) => {
    setDeleteOrder(order)
  }

  const confirmDelete = async () => {
    if (deleteOrder) {
      try {
        await api.delete(`os/${deleteOrder.id}/`)
        setDeleteOrder(null)
        fetchOrders()
      } catch (error) {
        console.error("Erro ao deletar ordem:", error)
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
            <p className="text-muted-foreground">
              {role === 'admin' ? 'Gerencie as ordens de serviço' : 'Lançamento e finalização de ordens técnicas'}
            </p>
          </div>
          
          {role === 'admin' && (
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
          )}
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
              onEdit={handleEditClick}
              onDelete={role === 'admin' ? handleDelete : undefined}
            />
          </CardContent>
        </Card>

        {/* Form Admin */}
        <ServiceOrderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          order={editingOrder}
          clients={clients}
          equipments={equipments}
          onSave={handleSave}
        />

        {/* Modal do Técnico Modificado (Lançar Fechamento + Laudo + PDF) */}
        <Dialog open={techModalOpen} onOpenChange={setTechModalOpen}>
          <DialogContent className="border-border bg-card max-w-md">
            <DialogHeader>
              <DialogTitle className="text-card-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Lançar Fechamento de Serviço
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Informe o valor cobrado do cliente <strong>{techOrder?.clientName}</strong> e mude o status do reparo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-card-foreground">Valor do Serviço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="200,00"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  className="border-border bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceDone" className="text-card-foreground">O que foi feito (Laudo Técnico)</Label>
                <Textarea
                  id="serviceDone"
                  placeholder="Descreva detalhadamente a manutenção realizada..."
                  value={serviceDone}
                  onChange={(e) => setServiceDone(e.target.value)}
                  className="border-border bg-background min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-card-foreground">Atualizar Situação</Label>
                <select
                  id="status"
                  value={serviceStatus}
                  onChange={(e) => setServiceStatus(e.target.value as ServiceOrderStatus)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="open">Aberta</option>
                  <option value="in-progress">Em Andamento</option>
                  <option value="completed">Concluída / Pronto</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTechModalOpen(false)} className="border-border">
                Cancelar
              </Button>
              <Button onClick={handleSaveTechData} className="bg-primary text-primary-foreground">
                Salvar Valores & Gerar PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmação de exclusão Admin */}
        <AlertDialog open={!!deleteOrder} onOpenChange={() => setDeleteOrder(null)}>
          <AlertDialogContent className="border-border bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-card-foreground">Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Tem certeza que deseja excluir a ordem de serviço de {deleteOrder?.clientName}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}