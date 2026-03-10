'use client'

import { useState } from 'react'
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
import { mockClients } from '@/lib/store'
import { Client } from '@/lib/types'
import { Plus, Users } from 'lucide-react'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients)
  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)

  const columns = [
    { key: 'name' as const, header: 'Nome' },
    { key: 'phone' as const, header: 'Telefone' },
    { key: 'email' as const, header: 'E-mail' },
    { key: 'address' as const, header: 'Endereço' },
  ]

  const handleSave = (data: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => {
    if (data.id) {
      setClients(clients.map((c) =>
        c.id === data.id ? { ...c, ...data } : c
      ))
    } else {
      const newClient: Client = {
        id: String(Date.now()),
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        createdAt: new Date(),
      }
      setClients([...clients, newClient])
    }
    setEditingClient(null)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormOpen(true)
  }

  const handleDelete = (client: Client) => {
    setDeleteClient(client)
  }

  const confirmDelete = () => {
    if (deleteClient) {
      setClients(clients.filter((c) => c.id !== deleteClient.id))
      setDeleteClient(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gerencie os clientes cadastrados</p>
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
                Tem certeza que deseja excluir o cliente {deleteClient?.name}? Esta ação não pode ser desfeita.
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
