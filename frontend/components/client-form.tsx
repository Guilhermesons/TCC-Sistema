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
import { Client } from '@/lib/types'
import { Loader2, UserRound } from 'lucide-react'


export function formatPhoneBR(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  const ddd = digits.slice(0, 2)
  const number = digits.slice(2)
  if (digits.length <= 6) return `(${ddd}) ${number}`
  if (digits.length <= 10) {
    return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`
  }
  return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
}

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSave: (client: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => Promise<void> | void
}

export function ClientForm({ open, onOpenChange, client, onSave }: ClientFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' })

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phone: formatPhoneBR(client.phone),
        email: client.email,
        address: client.address,
      })
    } else {
      setFormData({ name: '', phone: '', email: '', address: '' })
    }
  }, [client, open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setSaving(true)
      await onSave({ ...formData, id: client?.id })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/80 bg-card/95 sm:max-w-[520px]">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserRound className="h-5 w-5" />
          </div>
          <DialogTitle>{client ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
          <DialogDescription>
            {client ? 'Atualize os dados cadastrais do cliente.' : 'Cadastre os dados principais para iniciar um atendimento.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              placeholder="Ex: João da Silva"
              required
              className="h-11 border-border/75 bg-background/45"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: formatPhoneBR(event.target.value) })}
                placeholder="(00) 00000-0000"
                inputMode="numeric"
                maxLength={15}
                required
                className="h-11 border-border/75 bg-background/45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder="cliente@email.com"
                required
                className="h-11 border-border/75 bg-background/45"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(event) => setFormData({ ...formData, address: event.target.value })}
              placeholder="Rua, número - Cidade, Estado"
              required
              className="h-11 border-border/75 bg-background/45"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border/55 pt-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {client ? 'Salvar alterações' : 'Cadastrar cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
