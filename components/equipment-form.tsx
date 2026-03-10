'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Equipment, Client } from '@/lib/types'

interface EquipmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment?: Equipment | null
  clients: Client[]
  onSave: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'clientName'> & { id?: string }) => void
}

export function EquipmentForm({ open, onOpenChange, equipment, clients, onSave }: EquipmentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    clientId: '',
  })

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        brand: equipment.brand,
        model: equipment.model,
        clientId: equipment.clientId,
      })
    } else {
      setFormData({
        name: '',
        brand: '',
        model: '',
        clientId: '',
      })
    }
  }, [equipment, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      id: equipment?.id,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-card-foreground">Nome do Equipamento</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Notebook, Impressora, Desktop"
              required
              className="border-border bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-card-foreground">Marca</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Ex: Dell, HP, Lenovo"
              required
              className="border-border bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model" className="text-card-foreground">Modelo</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Ex: Inspiron 15, LaserJet Pro"
              required
              className="border-border bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client" className="text-card-foreground">Cliente</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              required
            >
              <SelectTrigger className="border-border bg-input text-foreground">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              {equipment ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
