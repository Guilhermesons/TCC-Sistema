'use client'

import { useState } from 'react'
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
import { mockEquipments, mockClients } from '@/lib/store'
import { Equipment, Client } from '@/lib/types'
import { Plus, Monitor } from 'lucide-react'

export default function EquipmentPage() {
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipments)
  const [clients] = useState<Client[]>(mockClients)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [deleteEquipment, setDeleteEquipment] = useState<Equipment | null>(null)

  const columns = [
    { key: 'name' as const, header: 'Equipamento' },
    { key: 'brand' as const, header: 'Marca' },
    { key: 'model' as const, header: 'Modelo' },
    { key: 'clientName' as const, header: 'Cliente' },
  ]

  const handleSave = (data: Omit<Equipment, 'id' | 'createdAt' | 'clientName'> & { id?: string }) => {
    const client = clients.find((c) => c.id === data.clientId)
    if (data.id) {
      setEquipments(equipments.map((e) =>
        e.id === data.id
          ? { ...e, ...data, clientName: client?.name || '' }
          : e
      ))
    } else {
      const newEquipment: Equipment = {
        id: String(Date.now()),
        name: data.name,
        brand: data.brand,
        model: data.model,
        clientId: data.clientId,
        clientName: client?.name || '',
        createdAt: new Date(),
      }
      setEquipments([...equipments, newEquipment])
    }
    setEditingEquipment(null)
  }

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment)
    setFormOpen(true)
  }

  const handleDelete = (equipment: Equipment) => {
    setDeleteEquipment(equipment)
  }

  const confirmDelete = () => {
    if (deleteEquipment) {
      setEquipments(equipments.filter((e) => e.id !== deleteEquipment.id))
      setDeleteEquipment(null)
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
