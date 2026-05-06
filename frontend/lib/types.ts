export interface Client {
  id: string
  name: string
  phone: string
  email: string
  address: string
  createdAt: Date
}

export interface Equipment {
  id: string
  name: string
  brand: string
  model: string
  clientId: string
  clientName: string
  createdAt: Date
}

export interface ServiceOrder {
  id: string
  clientId: string
  clientName: string
  equipmentId: string
  equipmentName: string
  problemDescription: string
  status: 'open' | 'in-progress' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export type ServiceOrderStatus = ServiceOrder['status']
