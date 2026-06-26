'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Importado para controle de rotas
import api from '@/services/api' 
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
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)
  const [authorized, setAuthorized] = useState(false) // Estado de controle de permissão

  // Validação de segurança ao carregar a página
  useEffect(() => {
    const role = localStorage.getItem('user_role')

    if (!role) {
      router.push('/') // Sem login vai para a tela inicial
    } else if (role !== 'admin') {
      router.push('/dashboard') // Se for técnico, barra o acesso e joga pro dashboard
    } else {
      setAuthorized(true) // Libera o acesso caso seja admin
      fetchClients()
    }
  }, [])

  const fetchClients = async () => {
    try {
      const response = await api.get('clientes/')
      setClients(response.data)
    } catch (error) {
      console.error("Erro ao carregar clientes do banco:", error)
    }
  }

  const columns = [
    { key: 'name' as const, header: 'Nome' },
    { key: 'phone' as const, header: 'Telefone' },
    { key: 'email' as const, header: 'E-mail' },
    { key: 'address' as const, header: 'Endereço' },
  ]

  const handleSave = async (data: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => {
    try {
      if (data.id) {
        await api.put(`clientes/${data.id}/`, data)
      } else {
        await api.post('clientes/', data)
      }
      setFormOpen(false)
      setEditingClient(null)
      fetchClients() 
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

  const confirmDelete = async () => {
    if (deleteClient) {
      try {
        await api.delete(`clientes/${deleteClient.id}/`)
        fetchClients() 
        setDeleteClient(null)
      } catch (error) {
        console.error("Erro ao deletar:", error)
        alert("Erro ao remover o registro do banco.")
      }
    }
  }

  // Enquanto valida a permissão, não renderiza a tabela na tela
  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Verificando permissões...
      </div>
    )
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