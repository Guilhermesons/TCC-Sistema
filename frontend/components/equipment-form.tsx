'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Client, Equipment } from '@/lib/types'
import { Loader2, Monitor } from 'lucide-react'

interface EquipmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment?: Equipment | null
  clients: Client[]
  initialClientId?: string
  onSave: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'clientName'> & { id?: string }) => Promise<void> | void
}

export function EquipmentForm({
  open,
  onOpenChange,
  equipment,
  clients,
  initialClientId = '',
  onSave,
}: EquipmentFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', brand: '', model: '', serialNumber: '', clientId: '' })

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        brand: equipment.brand,
        model: equipment.model,
        serialNumber: equipment.serialNumber || '',
        clientId: String(equipment.clientId),
      })
    } else {
      setFormData({ name: '', brand: '', model: '', serialNumber: '', clientId: initialClientId })
    }
  }, [equipment, open, initialClientId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setSaving(true)
      await onSave({ ...formData, id: equipment?.id })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/80 bg-card/95 sm:max-w-[540px]">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
            <Monitor className="h-5 w-5" />
          </div>
          <DialogTitle>{equipment ? 'Editar equipamento' : 'Novo equipamento'}</DialogTitle>
          <DialogDescription>
            Vincule o equipamento ao cliente para manter o histórico de atendimentos organizado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente responsável</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              required
            >
              <SelectTrigger className="h-11 border-border/75 bg-background/45">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Tipo do equipamento</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              placeholder="Ex: Notebook, Desktop, Impressora"
              required
              className="h-11 border-border/75 bg-background/45"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(event) => setFormData({ ...formData, brand: event.target.value })}
                placeholder="Ex: Dell"
                required
                className="h-11 border-border/75 bg-background/45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(event) => setFormData({ ...formData, model: event.target.value })}
                placeholder="Ex: Inspiron 15"
                required
                className="h-11 border-border/75 bg-background/45"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNumber">Número de série <span className="text-muted-foreground">(opcional)</span></Label>
            <Input
              id="serialNumber"
              value={formData.serialNumber}
              onChange={(event) => setFormData({ ...formData, serialNumber: event.target.value })}
              placeholder="Ex: SN123456789"
              className="h-11 border-border/75 bg-background/45"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border/55 pt-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !formData.clientId}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {equipment ? 'Salvar alterações' : 'Cadastrar equipamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
