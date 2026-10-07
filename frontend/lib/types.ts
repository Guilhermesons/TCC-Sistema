import type { ServiceCategory } from '@/lib/service-categories'

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  address: string
  createdAt: Date | string
}

export interface Equipment {
  id: string
  name: string
  brand: string
  model: string
  serialNumber?: string | null
  clientId: string
  clientName: string
  createdAt: Date | string
}

export interface ServiceOrder {
  id: string
  clientId: string
  clientName: string
  equipmentId: string
  equipmentName: string
  problemDescription: string
  category: ServiceCategory
  basePrice?: number | string | null
  status: 'open' | 'in-progress' | 'completed'
  createdAt: Date | string
  updatedAt: Date | string
  startedAt?: Date | string | null
  completedAt?: Date | string | null
  price?: number | string | null
  serviceDone?: string | null
}

export type ServiceOrderStatus = ServiceOrder['status']
