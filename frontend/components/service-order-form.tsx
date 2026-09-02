'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Client, Equipment, ServiceOrder, ServiceOrderStatus } from '@/lib/types'
import {
  SERVICE_CATEGORIES,
  ServiceCategory,
  formatBRL,
  getServiceCategory,
} from '@/lib/service-categories'
import { ClipboardPlus, Loader2, Tag } from 'lucide-react'

interface ServiceOrderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: ServiceOrder | null
  clients: Client[]
  equipments: Equipment[]
  initialClientId?: string
  initialEquipmentId?: string
  onSave: (order: {
    id?: string
    clientId: string
    equipmentId: string
    problemDescription: string
    category: ServiceCategory
    status: ServiceOrderStatus
  }) => Promise<void> | void
}

export function ServiceOrderForm({
  open,
  onOpenChange,
  order,
  clients,
  equipments,
  initialClientId = '',
  initialEquipmentId = '',
  onSave,
}: ServiceOrderFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    equipmentId: '',
    problemDescription: '',
    category: 'diagnostic' as ServiceCategory,
    status: 'open' as ServiceOrderStatus,
  })

  useEffect(() => {
    if (order) {
      setFormData({
        clientId: String(order.clientId),
        equipmentId: String(order.equipmentId),
        problemDescription: order.problemDescription,
        category: order.category || 'legacy',
        status: order.status,
      })
    } else {
      setFormData({
        clientId: initialClientId,
        equipmentId: initialEquipmentId,
        problemDescription: '',
        category: 'diagnostic',
        status: 'open',
      })
    }
  }, [order, open, initialClientId, initialEquipmentId])

  const filteredEquipments = useMemo(
    () => equipments.filter((equipment) => String(equipment.clientId) === String(formData.clientId)),
    [equipments, formData.clientId],
  )

  const selectedCategory = getServiceCategory(formData.category)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setSaving(true)
      await onSave({ ...formData, id: order?.id })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/80 bg-card/95 sm:max-w-[650px]">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardPlus className="h-5 w-5" />
          </div>
          <DialogTitle>{order ? 'Editar ordem de serviço' : 'Nova ordem de serviço'}</DialogTitle>
          <DialogDescription>
            Selecione o cliente, equipamento e a categoria. O valor-base é definido automaticamente e poderá ser ajustado no atendimento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value, equipmentId: '' })}
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
              <Label htmlFor="equipment">Equipamento</Label>
              <Select
                value={formData.equipmentId}
                onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}
                required
                disabled={!formData.clientId}
              >
                <SelectTrigger className="h-11 border-border/75 bg-background/45">
                  <SelectValue placeholder={formData.clientId ? 'Selecione o equipamento' : 'Escolha o cliente primeiro'} />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {filteredEquipments.map((equipment) => (
                    <SelectItem key={equipment.id} value={String(equipment.id)}>
                      {equipment.brand} {equipment.model} ({equipment.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.clientId && filteredEquipments.length === 0 && (
            <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.06] px-3.5 py-3 text-xs text-amber-200/90">
              Este cliente ainda não possui equipamento cadastrado. Cadastre o equipamento antes de abrir a OS.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Categoria do serviço</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as ServiceCategory })}
            >
              <SelectTrigger className="h-11 border-border/75 bg-background/45">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {order?.category === 'legacy' && (
                  <SelectItem value="legacy">Sem categoria (OS anterior)</SelectItem>
                )}
                {SERVICE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label} · {formatBRL(category.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-primary/15 bg-primary/[0.045] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedCategory.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{selectedCategory.description}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Valor-base</p>
                <p className="mt-1 text-lg font-semibold text-primary">{formatBRL(selectedCategory.price)}</p>
              </div>
            </div>
            <p className="mt-3 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
              O valor-base será gravado como preço inicial da OS. O técnico poderá ajustar o valor final conforme o serviço executado.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="problem">Problema relatado</Label>
            <Textarea
              id="problem"
              value={formData.problemDescription}
              onChange={(event) => setFormData({ ...formData, problemDescription: event.target.value })}
              placeholder="Descreva o defeito, sintomas e observações informadas pelo cliente..."
              required
              rows={5}
              className="resize-none border-border/75 bg-background/45"
            />
          </div>

          {order && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ServiceOrderStatus })}
              >
                <SelectTrigger className="h-11 border-border/75 bg-background/45">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="open">Aberta</SelectItem>
                  <SelectItem value="in-progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border/55 pt-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.clientId || !formData.equipmentId || !formData.problemDescription.trim() || formData.category === 'legacy'}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {order ? 'Salvar alterações' : 'Criar ordem'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
