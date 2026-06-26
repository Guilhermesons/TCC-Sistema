import { Client, Equipment, ServiceOrder } from './types'

// Mock data for demonstration
export const mockClients: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '(11) 99999-1234',
    email: 'joao.silva@email.com',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '(11) 98888-5678',
    email: 'maria.santos@email.com',
    address: 'Av. Brasil, 456 - São Paulo, SP',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    phone: '(21) 97777-9012',
    email: 'carlos.oliveira@email.com',
    address: 'Rua do Comércio, 789 - Rio de Janeiro, RJ',
    createdAt: new Date('2024-03-10'),
  },
]

export const mockEquipments: Equipment[] = [
  {
    id: '1',
    name: 'Notebook',
    brand: 'Dell',
    model: 'Inspiron 15',
    clientId: '1',
    clientName: 'João Silva',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: 'Impressora',
    brand: 'HP',
    model: 'LaserJet Pro',
    clientId: '2',
    clientName: 'Maria Santos',
    createdAt: new Date('2024-02-25'),
  },
  {
    id: '3',
    name: 'Desktop',
    brand: 'Lenovo',
    model: 'ThinkCentre M720',
    clientId: '3',
    clientName: 'Carlos Oliveira',
    createdAt: new Date('2024-03-15'),
  },
]

export const mockServiceOrders: ServiceOrder[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'João Silva',
    equipmentId: '1',
    equipmentName: 'Notebook Dell Inspiron 15',
    problemDescription: 'Tela não liga após queda',
    status: 'in-progress',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'Maria Santos',
    equipmentId: '2',
    equipmentName: 'Impressora HP LaserJet Pro',
    problemDescription: 'Papel travando constantemente',
    status: 'open',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: '3',
    clientId: '3',
    clientName: 'Carlos Oliveira',
    equipmentId: '3',
    equipmentName: 'Desktop Lenovo ThinkCentre M720',
    problemDescription: 'Lentidão e travamentos frequentes',
    status: 'completed',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-28'),
  },
]
