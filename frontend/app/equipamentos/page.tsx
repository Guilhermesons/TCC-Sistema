'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api' // Sua conexão Axios com o Django
import { Sidebar } from '@/components/sidebar'
import { DataTable } from '@/components/data-table'
import { EquipmentForm } from '@/components/equipment-form'
import { Button } from '@/components/ui/button'
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
import { Equipment, Client } from '@/lib/types'
import { Plus, Monitor } from 'lucide-react'

export default function EquipmentPage() {
  // Estados dinâmicos iniciando vazios para carregar do Banco de Dados real
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [deleteEquipment, setDeleteEquipment] = useState<Equipment | null>(null)

  // Função para buscar Equipamentos do Django
  const fetchEquipments = async () => {
    try {
      const response = await api.get('equipamentos/')
      setEquipments(response.data)
    } catch (error) {
      console.error("Erro ao carregar equipamentos do banco:", error)
    }
  }

  // Função para buscar Clientes do Django (alimenta o Select do formulário)
  const fetchClients = async () => {
    try {
      const response = await api.get('clientes/')
      setClients(response.data)
    } catch (error) {
      console.error("Erro ao carregar clientes do banco:", error)
    }
  }

  // Dispara a busca automática ao carregar a página
  useEffect(() => {
    fetchEquipments()
    fetchClients()
  }, [])

  const columns = [
    { key: 'name', accessorKey: 'name', dataIndex: 'name', header: 'Equipamento' },
    { key: 'brand', accessorKey: 'brand', dataIndex: 'brand', header: 'Marca' },
    { key: 'model', accessorKey: 'model', dataIndex: 'model', header: 'Modelo' },
    { key: 'clientName', accessorKey: 'clientName', dataIndex: 'clientName', header: 'Cliente' },
  ]

  // Salvar ou atualizar dados direto na API
  const handleSave = async (data: Omit<Equipment, 'id' | 'createdAt' | 'clientName'> & { id?: string }) => {
    try {
      if (data.id) {
        // Atualiza no Django (PUT)
        await api.put(`equipamentos/${data.id}/`, data)
      } else {
        // Cria no Django (POST)
        await api.post('equipamentos/', data)
      }
      setFormOpen(false)
      setEditingEquipment(null)
      fetchEquipments() // Recarrega a tabela com os dados atualizados
    } catch (error) {
      console.error("Erro ao salvar equipamento na API:", error)
      alert("Erro ao salvar o equipamento. Verifique a conexão com o servidor.")
    }
  }

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment)
    setFormOpen(true)
  }

  const handleDelete = (equipment: Equipment) => {
    setDeleteEquipment(equipment)
  }

  // Deleta o item selecionado direto no Banco de Dados
  const confirmDelete = async () => {
    if (deleteEquipment) {
      try {
        await api.delete(`equipamentos/${deleteEquipment.id}/`)
        setDeleteEquipment(null)
        fetchEquipments() // Atualiza a lista após deletar
      } catch (error) {
        console.error("Erro ao deletar equipamento na API:", error)
        alert("Erro ao excluir o equipamento.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Equipamentos</h1>
            <p className="text-muted-foreground">Gerencie os equipamentos cadastrados</p>
          </div>
          <Button
            onClick={() => {
              setEditingEquipment(null)
              setFormOpen(true)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Equipamento
          </Button>
        </div>

        {/* COMPONENTE CARD TOTALMENTE FECHADO E CORRIGIDO AQUI */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Monitor className="h-5 w-5 text-primary" />
              Lista de Equipamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={equipments}
              columns={columns}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>

        <EquipmentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          equipment={editingEquipment}
          clients={clients}
          onSave={handleSave}
        />

        <AlertDialog open={!!deleteEquipment} onOpenChange={() => setDeleteEquipment(null)}>
          <AlertDialogContent className="border-border bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-card-foreground">
                Confirmar exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Tem certeza que deseja excluir o equipamento {deleteEquipment?.brand} {deleteEquipment?.model}? Esta ação não pode ser desfeita.
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