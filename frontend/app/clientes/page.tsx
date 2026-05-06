'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api' // Certifique-se de que o arquivo services/api.ts está configurado
import { Sidebar } from '@/components/sidebar'
import { DataTable } from '@/components/data-table'
import { ClientForm } from '@/components/client-form'
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
import { Client } from '@/lib/types'
import { Plus, Users } from 'lucide-react'

export default function ClientsPage() {
  // 1. Estado inicial vazio. Os dados virão do banco via API.
  const [clients, setClients] = useState<Client[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)

  // 2. Função para buscar os dados no Django (GET)
  const fetchClients = async () => {
    try {
      const response = await api.get('clientes/')
      setClients(response.data)
    } catch (error) {
      console.error("Erro ao carregar clientes do banco:", error)
    }
  }

  // 3. Efeito que dispara a busca ao carregar a página (Garante que o F5 funcione)
  useEffect(() => {
    fetchClients()
  }, [])

  const columns = [
    { key: 'name' as const, header: 'Nome' },
    { key: 'phone' as const, header: 'Telefone' },
    { key: 'email' as const, header: 'E-mail' },
    { key: 'address' as const, header: 'Endereço' },
  ]

  // 4. Salvar ou Atualizar enviando dados reais para o backend
  const handleSave = async (data: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => {
    try {
      if (data.id) {
        // Atualiza no Django (PUT)
        await api.put(`clientes/${data.id}/`, data)
      } else {
        // Cria no Django (POST)
        await api.post('clientes/', data)
      }
      setFormOpen(false)
      setEditingClient(null)
      fetchClients() // Recarrega a lista do banco para refletir a mudança
    } catch (error) {
      console.error("Erro na comunicação com o servidor:", error)
      alert("Não foi possível salvar. Verifique se o backend está rodando.")
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormOpen(true)
  }

  const handleDelete = (client: Client) => {
    setDeleteClient(client)
  }

  // 5. Excluir cliente do banco de dados (DELETE)
  const confirmDelete = async () => {
    if (deleteClient) {
      try {
        await api.delete(`clientes/${deleteClient.id}/`)
        fetchClients() // Atualiza a lista após deletar
        setDeleteClient(null)
      } catch (error) {
        console.error("Erro ao deletar:", error)
        alert("Erro ao remover o registro do banco.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Sistema de Gestão - Dados Reais do Banco</p>
          </div>
          <Button
            onClick={() => {
              setEditingClient(null)
              setFormOpen(true)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Users className="h-5 w-5 text-primary" />
              Lista de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={clients}
              columns={columns}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>

        <ClientForm
          open={formOpen}
          onOpenChange={setFormOpen}
          client={editingClient}
          onSave={handleSave}
        />

        <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
          <AlertDialogContent className="border-border bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-card-foreground">
                Confirmar exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Deseja realmente excluir o registro de <strong>{deleteClient?.name}</strong>?
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