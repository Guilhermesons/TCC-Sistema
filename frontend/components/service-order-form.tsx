'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ServiceOrder, Client, Equipment, ServiceOrderStatus } from '@/lib/types'

interface ServiceOrderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: ServiceOrder | null
  clients: Client[]
  equipments: Equipment[]
  onSave: (order: {
    id?: string
    clientId: string
    equipmentId: string
    problemDescription: string
    status: ServiceOrderStatus
  }) => void
}

export function ServiceOrderForm({
  open,
  onOpenChange,
  order,
  clients,
  equipments,
  onSave,
}: ServiceOrderFormProps) {
  const [formData, setFormData] = useState({
    clientId: '',
    equipmentId: '',
    problemDescription: '',
    status: 'open' as ServiceOrderStatus,
  })

  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([])

  useEffect(() => {
    if (order) {
      setFormData({
        clientId: order.clientId,
        equipmentId: order.equipmentId,
        problemDescription: order.problemDescription,
        status: order.status,
      })
    } else {
      setFormData({
        clientId: '',
        equipmentId: '',
        problemDescription: '',
        status: 'open',
      })
    }
  }, [order, open])

useEffect(() => {
    if (formData.clientId) {
      setFilteredEquipments(
        equipments.filter((e) => String(e.clientId) === String(formData.clientId))
      );
    } else {
      setFilteredEquipments([]);
    }
  }, [formData.clientId, equipments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      id: order?.id,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            {order ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client" className="text-card-foreground">Cliente</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value, equipmentId: '' })}
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
          <div className="space-y-2">
            <Label htmlFor="equipment" className="text-card-foreground">Equipamento</Label>
            <Select
              value={formData.equipmentId}
              onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}
              required
              disabled={!formData.clientId}
            >
              <SelectTrigger className="border-border bg-input text-foreground">
                <SelectValue placeholder={formData.clientId ? "Selecione o equipamento" : "Selecione um cliente primeiro"} />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {filteredEquipments.map((equipment) => (
                  <SelectItem key={equipment.id} value={equipment.id}>
                    {equipment.brand} {equipment.model} ({equipment.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="problem" className="text-card-foreground">Descrição do Problema</Label>
            <Textarea
              id="problem"
              value={formData.problemDescription}
              onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
              placeholder="Descreva o problema detalhadamente..."
              required
              rows={4}
              className="border-border bg-input text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-card-foreground">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as ServiceOrderStatus })}
              required
            >
              <SelectTrigger className="border-border bg-input text-foreground">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="open">Aberta</SelectItem>
                <SelectItem value="in-progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
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
              {order ? 'Salvar' : 'Criar Ordem'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
