'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Sidebar } from '@/components/sidebar'
import { DataTable } from '@/components/data-table'
import { ServiceOrderForm } from '@/components/service-order-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Client, Equipment, ServiceOrder, ServiceOrderStatus } from '@/lib/types'
import { formatBRL, getServiceCategory, ServiceCategory } from '@/lib/service-categories'
import { toast } from 'sonner'
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  DollarSign,
  FileText,
  Loader2,
  Monitor,
  Plus,
  Search,
  UserRound,
  Wrench,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type StatusFilter = 'all' | ServiceOrderStatus

export default function ServiceOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null)
  const [deleteOrder, setDeleteOrder] = useState<ServiceOrder | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const [initialClientId, setInitialClientId] = useState('')
  const [initialEquipmentId, setInitialEquipmentId] = useState('')

  const [techModalOpen, setTechModalOpen] = useState(false)
  const [techOrder, setTechOrder] = useState<ServiceOrder | null>(null)
  const [servicePrice, setServicePrice] = useState('')
  const [serviceStatus, setServiceStatus] = useState<ServiceOrderStatus>('in-progress')
  const [serviceDone, setServiceDone] = useState('')
  const [savingTech, setSavingTech] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ordersRes, clientsRes, equipmentsRes] = await Promise.all([
        api.get('os/'),
        api.get('clientes/'),
        api.get('equipamentos/'),
      ])
      setOrders(ordersRes.data || [])
      setClients(clientsRes.data || [])
      setEquipments(equipmentsRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar ordens:', error)
      toast.error('Não foi possível carregar as ordens de serviço.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedRole = localStorage.getItem('user_role')
    if (!savedRole) {
      router.replace('/')
      return
    }

    const params = new URLSearchParams(window.location.search)
    const clientId = params.get('cliente') || ''
    const equipmentId = params.get('equipamento') || ''
    const status = params.get('status') as StatusFilter | null

    setRole(savedRole)
    setSearch(params.get('q') || '')
    if (status && ['all', 'open', 'in-progress', 'completed'].includes(status)) setStatusFilter(status)
    setInitialClientId(clientId)
    setInitialEquipmentId(equipmentId)

    if (savedRole === 'admin' && params.get('novo') === '1') {
      setEditingOrder(null)
      setFormOpen(true)
    }

    setAuthorized(true)
    fetchData()
  }, [router])

  const counts = useMemo(() => ({
    all: orders.length,
    open: orders.filter((order) => order.status === 'open').length,
    'in-progress': orders.filter((order) => order.status === 'in-progress').length,
    completed: orders.filter((order) => order.status === 'completed').length,
  }), [orders])

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders
      .filter((order) => statusFilter === 'all' || order.status === statusFilter)
      .filter((order) => {
        if (!query) return true
        return [order.id, order.clientName, order.equipmentName, order.problemDescription, order.serviceDone, getServiceCategory(order.category).label]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      })
      .slice()
      .reverse()
  }, [orders, search, statusFilter])

  const getStatusBadge = (status: ServiceOrderStatus) => {
    if (status === 'open') {
      return <Badge variant="outline" className="border-amber-400/20 bg-amber-400/[0.08] text-amber-300">Aberta</Badge>
    }
    if (status === 'in-progress') {
      return <Badge variant="outline" className="border-blue-400/20 bg-blue-400/[0.08] text-blue-300">Em andamento</Badge>
    }
    return <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">Concluída</Badge>
  }

  const formatDate = (value: Date | string | undefined) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
  }

  const generatePDF = (
    order: ServiceOrder,
    currentServiceDone?: string,
    currentPrice?: string,
    currentStatus?: ServiceOrderStatus,
  ) => {
    const clientInfo = clients.find(
      (client) => String(client.id) === String(order.clientId) || client.name === order.clientName,
    )
    const equipmentInfo = equipments.find(
      (equipment) => String(equipment.id) === String(order.equipmentId) || equipment.name === order.equipmentName,
    )
    const categoryInfo = getServiceCategory(order.category)
    const finalPrice = Number(currentPrice ?? order.price ?? order.basePrice ?? 0)
    const basePrice = Number(order.basePrice ?? categoryInfo.price ?? 0)
    const adjustment = finalPrice - basePrice
    const issueDateObj = new Date()
    const issueDate = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(issueDateObj)
    const onlyDate = new Intl.DateTimeFormat('pt-BR').format(issueDateObj)
    const onlyTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(issueDateObj)

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210
    const pageH = 297
    doc.setFont('times', 'normal')
    doc.setTextColor(0, 0, 0)

    const drawBox = (x: number, y: number, w: number, h: number, title?: string) => {
      doc.rect(x, y, w, h)
      if (title) {
        doc.setFont('times', 'normal')
        doc.setFontSize(5.8)
        doc.text(title.toUpperCase(), x + 1, y + 3.3)
      }
    }

    const drawText = (textValue: string, x: number, y: number, maxWidth?: number, fontSize = 7.5, style: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
      doc.setFont('times', style)
      doc.setFontSize(fontSize)
      if (maxWidth) {
        const lines = doc.splitTextToSize(textValue, maxWidth)
        doc.text(lines, x, y, { align })
      } else {
        doc.text(textValue, x, y, { align })
      }
    }

    const fakeBarcode = (x: number, y: number, w: number, h: number) => {
      doc.rect(x, y, w, h)
      let cursor = x + 2
      const end = x + w - 2
      const widths = [0.5, 0.8, 1.2, 0.7, 1.4, 0.6, 1.1, 0.9]
      let i = 0
      while (cursor < end) {
        const barW = widths[i % widths.length]
        doc.setFillColor(0, 0, 0)
        doc.rect(cursor, y + 1, Math.min(barW, end - cursor), h - 2, 'F')
        cursor += barW + 0.55
        i += 1
      }
    }

    const fakeWatermark = () => {
      doc.setTextColor(200, 200, 200)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(28)
      doc.text('DOCUMENTO FICTÍCIO', 105, 160, { align: 'center', angle: 28 })
      doc.setFontSize(22)
      doc.text('SEM VALOR FISCAL', 105, 178, { align: 'center', angle: 28 })
      doc.setTextColor(0, 0, 0)
    }

    const orderId = String(order.id || '0').padStart(6, '0')
    const emitterName = 'TECHASSIST TECNOLOGIA LTDA. — EMPRESA FICTÍCIA'
    const emitterAddress = 'Rua XXXX, nº XXXX — Bairro XXXX — Cidade XXXX/UF'
    const clientDoc = 'XXX.XXX.XXX-XX'
    const serviceDesc = currentServiceDone || order.serviceDone || order.problemDescription || 'Serviço técnico conforme ordem de serviço.'
    const equipmentDesc = `${equipmentInfo?.brand || ''} ${equipmentInfo?.model || ''} ${equipmentInfo?.name ? `(${equipmentInfo.name})` : ''}`.replace(/\s+/g, ' ').trim() || order.equipmentName || 'Equipamento não informado'
    const protocol = `XXXX${String(order.id || '0').padStart(10, '0')}`
    const accessKey = 'XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX'

    // Faixa superior de recebimento
    drawBox(4, 4, 166, 20)
    drawText(
      `Recebemos de ${emitterName} os serviços constantes deste Documento Auxiliar Demonstrativo. Emissão: ${onlyDate}   Dest/Rem: ${clientInfo?.name || order.clientName || 'CLIENTE NÃO INFORMADO'}   Valor Total: ${formatBRL(finalPrice)}`,
      5.5,
      10,
      160,
      7,
      'normal',
    )
    drawBox(170, 4, 36, 20)
    drawText('NF-e', 188, 10, undefined, 14, 'bold', 'center')
    drawText(`Nº ${orderId}`, 188, 15.5, undefined, 11, 'bold', 'center')
    drawText('Série XXXX', 188, 20, undefined, 10, 'bold', 'center')
    drawBox(4, 24, 83, 8, 'Data do recebimento')
    drawBox(87, 24, 83, 8, 'Identificação e assinatura do recebedor')
    drawBox(170, 24, 36, 8)

    // Cabeçalho principal estilo DANFE
    drawBox(4, 36, 80, 36)
    drawText('TECHASSIST', 44, 42, undefined, 13, 'bold', 'center')
    drawText('SERVICE MANAGEMENT', 44, 47, undefined, 8.5, 'bold', 'center')
    drawText(emitterName, 7, 54, 74, 7.6, 'bold')
    drawText(emitterAddress, 7, 59.5, 74, 6.6)
    drawText('CNPJ: XX.XXX.XXX/XXXX-XX', 7, 66.2, 74, 6.7)
    drawText('Inscrição Estadual: XXXXXXXX', 7, 70.2, 74, 6.7)

    drawBox(84, 36, 34, 36)
    drawText('DANFE', 101, 44, undefined, 15, 'bold', 'center')
    drawText('Documento Auxiliar do', 101, 49.5, undefined, 7, 'normal', 'center')
    drawText('Documento Fiscal Demonstrativo', 101, 53, undefined, 7, 'normal', 'center')
    drawText('0 - ENTRADA', 91, 59, undefined, 7.5, 'normal')
    drawText('1 - SAÍDA', 91, 63.5, undefined, 7.5, 'normal')
    doc.rect(107, 56.5, 8, 8)
    drawText('1', 111, 62, undefined, 10, 'bold', 'center')
    drawText(`Nº ${orderId}`, 101, 68, undefined, 10, 'bold', 'center')
    drawText('SÉRIE XXXX', 101, 72, undefined, 9.5, 'bold', 'center')

    drawBox(118, 36, 88, 18)
    fakeBarcode(121, 38.8, 82, 9.8)
    drawBox(118, 54, 88, 18, 'Chave de acesso')
    drawText(accessKey, 162, 60, 84, 8, 'bold', 'center')
    drawText('Consulta meramente ilustrativa — documento fictício', 162, 66, 82, 6.5, 'normal', 'center')

    drawBox(4, 72, 130, 10, 'Natureza da operação')
    drawText(`PRESTAÇÃO DE SERVIÇO TÉCNICO — ${categoryInfo.label.toUpperCase()}`, 6, 78, 126, 8, 'bold')
    drawBox(134, 72, 72, 10, 'Protocolo de autorização de uso')
    drawText(`NF-e sem autorização de uso da SEFAZ — protocolo ${protocol}`, 170, 78, 68, 7.2, 'bold', 'center')

    // Destinatário / Remetente
    drawText('DESTINATÁRIO / REMETENTE', 5, 87, undefined, 8.4, 'bold')
    drawBox(4, 88, 202, 24)
    drawBox(4, 88, 102, 8, 'Nome / Razão social')
    drawBox(106, 88, 44, 8, 'CPF / CNPJ')
    drawBox(150, 88, 28, 8, 'Data da emissão')
    drawBox(178, 88, 28, 8, 'Data da saída')
    drawText(clientInfo?.name || order.clientName || 'CLIENTE NÃO INFORMADO', 6, 94, 98, 8, 'bold')
    drawText(clientDoc, 128, 94, undefined, 8, 'normal', 'center')
    drawText(onlyDate, 164, 94, undefined, 8, 'normal', 'center')
    drawText(onlyDate, 192, 94, undefined, 8, 'normal', 'center')

    drawBox(4, 96, 96, 8, 'Endereço')
    drawBox(100, 96, 30, 8, 'Bairro / Distrito')
    drawBox(130, 96, 22, 8, 'CEP')
    drawBox(152, 96, 26, 8, 'Telefone / Fax')
    drawBox(178, 96, 28, 8, 'Hora da saída')
    drawText(clientInfo?.address || 'Endereço não informado', 6, 102, 92, 7.6)
    drawText('XXXX', 115, 102, undefined, 7.6, 'normal', 'center')
    drawText('00000-000', 141, 102, undefined, 7.6, 'normal', 'center')
    drawText(clientInfo?.phone || '—', 165, 102, 22, 7.2, 'normal', 'center')
    drawText(onlyTime, 192, 102, undefined, 7.6, 'normal', 'center')

    drawBox(4, 104, 70, 8, 'Município')
    drawBox(74, 104, 10, 8, 'UF')
    drawBox(84, 104, 46, 8, 'E-mail')
    drawBox(130, 104, 76, 8, 'Observação')
    drawText('Cidade XXXX', 6, 110, 66, 7.6)
    drawText('XX', 79, 110, undefined, 7.6, 'normal', 'center')
    drawText(clientInfo?.email || '—', 107, 110, 40, 7.4, 'normal', 'center')
    drawText('Documento emitido apenas para apresentação acadêmica.', 132, 110, 72, 7)

    // Cálculo do imposto / resumo financeiro
    drawText('CÁLCULO DO IMPOSTO / RESUMO FINANCEIRO', 5, 117, undefined, 8.4, 'bold')
    const taxHeaders = [
      'Base de cálculo', 'Valor do ISS', 'Base cálculo ISS ST', 'Valor ISS ST', 'Valor total dos serviços',
      'Desconto', 'Outras despesas', 'Valor do documento'
    ]
    const taxValues = [
      '0,00', '0,00', '0,00', '0,00', formatBRL(basePrice), formatBRL(Math.max(basePrice - finalPrice, 0)), formatBRL(Math.max(adjustment, 0)), formatBRL(finalPrice)
    ]
    const taxWidths = [25, 20, 25, 20, 26, 20, 24, 42]
    let tx = 4
    for (let i = 0; i < taxHeaders.length; i++) {
      drawBox(tx, 118, taxWidths[i], 12, taxHeaders[i])
      drawText(taxValues[i], tx + taxWidths[i] - 1.5, 127.4, undefined, 7.8, 'bold', 'right')
      tx += taxWidths[i]
    }

    // Transportador / volumes (preenchido como fictício)
    drawText('TRANSPORTADOR / VOLUMES TRANSPORTADOS', 5, 135, undefined, 8.4, 'bold')
    drawBox(4, 136, 202, 22)
    drawBox(4, 136, 92, 7, 'Nome / Razão social')
    drawBox(96, 136, 24, 7, 'Frete por conta')
    drawBox(120, 136, 18, 7, 'Código ANTT')
    drawBox(138, 136, 24, 7, 'Placa do veículo')
    drawBox(162, 136, 10, 7, 'UF')
    drawBox(172, 136, 34, 7, 'CNPJ / CPF')
    drawText('Não se aplica — prestação de serviço técnica', 6, 141.2, 88, 7.2)
    drawText('0 - REMETENTE', 108, 141.2, undefined, 7.2, 'bold', 'center')
    drawText('XXXX', 128.5, 141.2, undefined, 7.2, 'normal', 'center')
    drawText('XXXXXXX', 150, 141.2, undefined, 7.2, 'normal', 'center')
    drawText('XX', 167, 141.2, undefined, 7.2, 'normal', 'center')
    drawText('XXX.XXX.XXX-XX', 189, 141.2, undefined, 7.2, 'normal', 'center')
    drawBox(4, 143, 46, 7, 'Endereço')
    drawBox(50, 143, 32, 7, 'Município')
    drawBox(82, 143, 12, 7, 'UF')
    drawBox(94, 143, 24, 7, 'Inscrição estadual')
    drawBox(118, 143, 20, 7, 'Quantidade')
    drawBox(138, 143, 18, 7, 'Espécie')
    drawBox(156, 143, 18, 7, 'Marca')
    drawBox(174, 143, 16, 7, 'Numeração')
    drawBox(190, 143, 16, 7, 'Peso')
    drawText('Não se aplica', 27, 148.2, undefined, 7.1, 'normal', 'center')
    drawText('—', 66, 148.2, undefined, 7.1, 'normal', 'center')
    drawText('—', 88, 148.2, undefined, 7.1, 'normal', 'center')
    drawText('—', 106, 148.2, undefined, 7.1, 'normal', 'center')
    drawText('1', 128, 148.2, undefined, 7.1, 'normal', 'center')
    drawText('UN', 147, 148.2, undefined, 7.1, 'normal', 'center')
    drawText('SERV', 165, 148.2, undefined, 7.1, 'normal', 'center')
    drawText(orderId.slice(-4), 182, 148.2, undefined, 7.1, 'normal', 'center')
    drawText('0,00', 198, 148.2, undefined, 7.1, 'normal', 'center')

    // Tabela de dados dos produtos/serviços
    drawText('DADOS DOS SERVIÇOS', 5, 163, undefined, 8.4, 'bold')
    const startY = 164
    const rowH = 7
    const colX = [4, 20, 82, 96, 104, 111, 118, 131, 145, 160, 174, 188, 198, 206]
    const headers = ['CÓD.', 'DESCRIÇÃO DO SERVIÇO', 'NCM/SH', 'CST', 'CFOP', 'UN', 'QTD.', 'VALOR UNIT.', 'DESC.', 'VALOR TOTAL', 'BASE CÁLC.', 'ALIQ.', 'VALOR IMP.']
    for (let i = 0; i < headers.length; i++) {
      const x = colX[i]
      const next = colX[i + 1] || 206
      drawBox(x, startY, next - x, rowH)
      drawText(headers[i], x + (next - x) / 2, startY + 4.4, undefined, 5.7, 'bold', 'center')
    }
    const tableBottom = 236
    drawBox(4, startY + rowH, 202, tableBottom - (startY + rowH))
    for (let i = 1; i < colX.length; i++) {
      doc.line(colX[i], startY + rowH, colX[i], tableBottom)
    }
    drawText('1', 12, startY + 12, undefined, 7.2, 'normal', 'center')
    drawText(`${categoryInfo.label} — ${equipmentDesc}`, 22, startY + 10.3, 58, 7.1, 'normal')
    drawText(`Problema: ${order.problemDescription || '—'}`, 22, startY + 16.3, 58, 6.8, 'normal')
    drawText(`Laudo: ${serviceDesc}`, 22, startY + 22.2, 58, 6.8, 'normal')
    drawText('XXXX.XX.XX', 89, startY + 12, undefined, 6.7, 'normal', 'center')
    drawText('0400', 100, startY + 12, undefined, 6.7, 'normal', 'center')
    drawText('5933', 107.5, startY + 12, undefined, 6.7, 'normal', 'center')
    drawText('UN', 114.5, startY + 12, undefined, 6.7, 'normal', 'center')
    drawText('1,00', 124.5, startY + 12, undefined, 6.7, 'normal', 'center')
    drawText(formatBRL(basePrice), 138, startY + 12, undefined, 6.7, 'normal', 'center')
    drawText(formatBRL(Math.max(basePrice - finalPrice, 0)), 152.5, startY + 12, undefined, 6.7, 'normal', 'center')
    drawText(formatBRL(finalPrice), 167, startY + 12, undefined, 6.7, 'bold', 'center')
    drawText('0,00', 181, startY + 12, undefined, 6.7, 'normal', 'center')
    drawText('0,00', 193, startY + 12, undefined, 6.7, 'normal', 'center')
    drawText('0,00', 202, startY + 12, undefined, 6.7, 'normal', 'center')

    fakeWatermark()

    // Dados adicionais
    drawText('DADOS ADICIONAIS', 5, 241, undefined, 8.4, 'bold')
    drawBox(4, 242, 128, 42, 'Informações complementares')
    drawBox(132, 242, 74, 42, 'Reservado ao fisco')
    const obs = [
      'DOCUMENTO FICTÍCIO PARA FINS ACADÊMICOS.',
      `OS #${orderId} — Categoria: ${categoryInfo.label}.`,
      `Valor-base: ${formatBRL(basePrice)} | Ajuste: ${formatBRL(adjustment)} | Valor final: ${formatBRL(finalPrice)}.`,
      'Este arquivo imita a organização visual de um DANFE apenas para demonstração do TCC.',
      'CNPJ, inscrição, chave de acesso, protocolo e dados fiscais com XXXX são inválidos propositalmente.',
    ].join(' ')
    drawText(obs, 6, 248, 124, 7.3, 'normal')
    drawText('SEM VALOR FISCAL', 169, 262, 60, 10, 'bold', 'center')
    drawText('Uso exclusivo para apresentação / demonstração.', 169, 269, 60, 7.3, 'normal', 'center')

    drawText(`DATA E HORA DA IMPRESSÃO: ${issueDate}`, 4, 289.5, undefined, 6.6, 'normal')
    drawText('TechAssist — Documento demonstrativo não fiscal', 206, 289.5, undefined, 6.6, 'normal', 'right')

    doc.save(`DANFE_DEMONSTRATIVO_OS_${String(order.id || '0000').padStart(4, '0')}.pdf`)
  }

  const columns = [
    {
      key: 'id',
      header: 'OS',
      render: (order: ServiceOrder) => <span className="font-mono text-xs font-semibold text-primary">#{String(order.id).padStart(4, '0')}</span>,
    },
    {
      key: 'clientName',
      header: 'Cliente / Equipamento',
      render: (order: ServiceOrder) => (
        <div>
          <p className="font-medium text-foreground">{order.clientName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{order.equipmentName}</p>
        </div>
      ),
    },
    {
      key: 'problemDescription',
      header: 'Problema relatado',
      render: (order: ServiceOrder) => (
        <div className="max-w-md">
          <p className="line-clamp-2 text-sm">{order.problemDescription}</p>
          <p className="mt-1 text-[11px] font-medium text-primary/75">{getServiceCategory(order.category).label}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (order: ServiceOrder) => getStatusBadge(order.status) },
    {
      key: 'price',
      header: 'Valor',
      render: (order: ServiceOrder) => <span className="font-medium">{formatBRL(order.price ?? order.basePrice ?? 0)}</span>,
    },
  ]

  const handleSave = async (data: {
    id?: string
    clientId: string
    equipmentId: string
    problemDescription: string
    category: ServiceCategory
    status: ServiceOrderStatus
  }) => {
    try {
      if (data.id) {
        await api.put(`os/${data.id}/`, data)
        toast.success('Ordem atualizada com sucesso.')
      } else {
        await api.post('os/', data)
        toast.success('Ordem de serviço criada.', { description: 'Ela já está disponível na fila de atendimento.' })
      }
      setFormOpen(false)
      setEditingOrder(null)
      setInitialClientId('')
      setInitialEquipmentId('')
      await fetchData()
    } catch (error) {
      console.error('Erro ao salvar ordem:', error)
      toast.error('Não foi possível salvar a ordem de serviço.')
      throw error
    }
  }

  const openTechOrder = (order: ServiceOrder) => {
    setTechOrder(order)
    setServicePrice(order.price?.toString() || order.basePrice?.toString() || '')
    setServiceStatus(order.status === 'open' ? 'in-progress' : order.status)
    setServiceDone(order.serviceDone || '')
    setTechModalOpen(true)
  }

  const handleEditClick = (order: ServiceOrder) => {
    if (role === 'admin') {
      setEditingOrder(order)
      setFormOpen(true)
    } else {
      openTechOrder(order)
    }
  }

  const saveTechData = async (complete = false) => {
    if (!techOrder) return
    const targetStatus: ServiceOrderStatus = complete ? 'completed' : serviceStatus

    if (complete && !serviceDone.trim()) {
      toast.warning('Informe o serviço realizado antes de concluir a OS.')
      return
    }

    try {
      setSavingTech(true)
      await api.patch(`os/${techOrder.id}/`, {
        price: servicePrice,
        status: targetStatus,
        serviceDone,
      })

      if (complete) {
        generatePDF(techOrder, serviceDone, servicePrice, 'completed')
        toast.success(`OS #${String(techOrder.id).padStart(4, '0')} concluída.`, { description: 'A nota de serviço demonstrativa foi gerada.' })
      } else {
        toast.success('Andamento da OS salvo.')
      }

      setTechModalOpen(false)
      setTechOrder(null)
      await fetchData()
    } catch (error) {
      console.error('Erro ao salvar dados do técnico:', error)
      toast.error('Não foi possível atualizar a ordem.')
    } finally {
      setSavingTech(false)
    }
  }

  const handleDelete = (order: ServiceOrder) => {
    if (order.status === 'completed') {
      toast.error('Ordens concluídas são protegidas.', { description: 'O histórico finalizado não deve ser removido pela interface.' })
      return
    }
    setDeleteOrder(order)
  }

  const confirmDelete = async () => {
    if (!deleteOrder) return
    try {
      await api.delete(`os/${deleteOrder.id}/`)
      toast.success('Ordem removida.')
      setDeleteOrder(null)
      await fetchData()
    } catch (error) {
      console.error('Erro ao remover ordem:', error)
      toast.error('Não foi possível remover a ordem.')
    }
  }

  const filters: Array<{ key: StatusFilter; label: string; icon?: React.ComponentType<{ className?: string }> }> = [
    { key: 'all', label: 'Todas' },
    { key: 'open', label: 'Abertas', icon: Clock3 },
    { key: 'in-progress', label: 'Em andamento', icon: Wrench },
    { key: 'completed', label: 'Concluídas', icon: CheckCircle2 },
  ]

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Verificando sessão...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-6 lg:p-8 xl:p-10">
        <div className="mx-auto w-full max-w-[1500px]">
          <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                <ClipboardList className="h-3.5 w-3.5" />
                Operação
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ordens de Serviço</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {role === 'admin' ? 'Acompanhe a fila, prioridades e histórico dos atendimentos.' : 'Veja a fila de trabalho e registre a execução técnica.'}
              </p>
            </div>
            {role === 'admin' && (
              <Button onClick={() => { setEditingOrder(null); setInitialClientId(''); setInitialEquipmentId(''); setFormOpen(true) }} className="h-10">
                <Plus className="mr-2 h-4 w-4" />
                Nova OS
              </Button>
            )}
          </header>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filters.map((filter) => {
              const active = statusFilter === filter.key
              const Icon = filter.icon
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key)}
                  className={`rounded-xl border px-4 py-3 text-left transition-all ${active ? 'border-primary/25 bg-primary/[0.075]' : 'border-border/65 bg-card/55 hover:border-border hover:bg-card/80'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{filter.label}</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">{counts[filter.key]}</p>
                    </div>
                    {Icon && <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground/50'}`} />}
                  </div>
                </button>
              )
            })}
          </div>

          <section className="tech-panel overflow-hidden rounded-2xl border border-border/70 bg-card/70">
            <div className="flex flex-col gap-3 border-b border-border/55 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xl">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por número da OS, cliente, equipamento ou problema..."
                  className="h-10 border-border/70 bg-background/45 pl-10"
                />
              </div>
              <div className="text-xs text-muted-foreground">{filteredOrders.length} resultados</div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Carregando ordens...
                </div>
              ) : (
                <DataTable
                  data={filteredOrders}
                  columns={columns}
                  onView={setSelectedOrder}
                  onEdit={handleEditClick}
                  onDelete={role === 'admin' ? handleDelete : undefined}
                  canDelete={(order) => order.status !== 'completed'}
                  editLabel={role === 'admin' ? 'Editar ordem' : 'Atender ordem'}
                  deleteLabel="Remover ordem em aberto"
                  emptyTitle="Nenhuma ordem encontrada"
                  emptyDescription="Ajuste a busca/status ou crie uma nova ordem de serviço."
                />
              )}
            </div>
          </section>
        </div>

        <ServiceOrderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          order={editingOrder}
          clients={clients}
          equipments={equipments}
          initialClientId={initialClientId}
          initialEquipmentId={initialEquipmentId}
          onSave={handleSave}
        />

        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="border-border/80 bg-card/95 sm:max-w-2xl">
            <DialogHeader>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardList className="h-5 w-5" />
                </div>
                {selectedOrder && getStatusBadge(selectedOrder.status)}
              </div>
              <DialogTitle>OS #{selectedOrder ? String(selectedOrder.id).padStart(4, '0') : ''}</DialogTitle>
              <DialogDescription>Detalhes completos do atendimento.</DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/65 bg-background/35 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="h-3.5 w-3.5" />Cliente</div>
                    <p className="text-sm font-medium">{selectedOrder.clientName}</p>
                  </div>
                  <div className="rounded-xl border border-border/65 bg-background/35 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Monitor className="h-3.5 w-3.5" />Equipamento</div>
                    <p className="text-sm font-medium">{selectedOrder.equipmentName}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/65 bg-background/35 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Problema relatado</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{selectedOrder.problemDescription}</p>
                </div>

                {selectedOrder.serviceDone && (
                  <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-primary/80">Laudo / serviço realizado</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{selectedOrder.serviceDone}</p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Categoria</p>
                    <p className="mt-1 text-sm font-semibold">{getServiceCategory(selectedOrder.category).label}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Base: {formatBRL(selectedOrder.basePrice)}</p>
                  </div>
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Valor final</p>
                    <p className="mt-1 text-sm font-semibold">{formatBRL(selectedOrder.price ?? selectedOrder.basePrice ?? 0)}</p>
                  </div>
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Criada em</p>
                    <p className="mt-1 text-sm font-medium">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="rounded-xl border border-border/65 bg-background/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Atualizada em</p>
                    <p className="mt-1 text-sm font-medium">{formatDate(selectedOrder.updatedAt)}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="outline" onClick={() => selectedOrder && generatePDF(selectedOrder)}>
                <FileText className="mr-2 h-4 w-4" />Gerar nota demonstrativa
              </Button>
              {selectedOrder && (
                <Button
                  onClick={() => {
                    const order = selectedOrder
                    setSelectedOrder(null)
                    handleEditClick(order)
                  }}
                >
                  {role === 'admin' ? 'Editar OS' : selectedOrder.status === 'completed' ? 'Ver/atualizar laudo' : 'Atender OS'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={techModalOpen} onOpenChange={setTechModalOpen}>
          <DialogContent className="border-border/80 bg-card/95 sm:max-w-xl">
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wrench className="h-5 w-5" />
              </div>
              <DialogTitle>Atendimento da OS #{techOrder ? String(techOrder.id).padStart(4, '0') : ''}</DialogTitle>
              <DialogDescription>
                Registre o serviço executado. O valor já parte da categoria escolhida e pode ser ajustado. Ao concluir, o sistema gera um documento demonstrativo sem valor fiscal.
              </DialogDescription>
            </DialogHeader>

            {techOrder && (
              <div className="space-y-4 py-1">
                <div className="rounded-xl border border-border/60 bg-background/30 p-3.5 text-sm">
                  <p className="font-medium">{techOrder.clientName} • {techOrder.equipmentName}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{techOrder.problemDescription}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Categoria</p>
                    <p className="mt-1 text-sm font-medium">{getServiceCategory(techOrder.category).label}</p>
                  </div>
                  <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Valor-base</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{formatBRL(techOrder.basePrice ?? getServiceCategory(techOrder.category).price)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDone">Serviço realizado / laudo técnico</Label>
                  <Textarea
                    id="serviceDone"
                    placeholder="Descreva diagnóstico, procedimentos, peças e testes realizados..."
                    value={serviceDone}
                    onChange={(event) => setServiceDone(event.target.value)}
                    className="min-h-[120px] resize-none border-border/75 bg-background/45"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Valor do serviço (R$)</Label>
                    <div className="relative">
                      <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="200.00"
                        value={servicePrice}
                        onChange={(event) => setServicePrice(event.target.value)}
                        className="h-11 border-border/75 bg-background/45 pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Situação atual</Label>
                    <select
                      id="status"
                      value={serviceStatus}
                      onChange={(event) => setServiceStatus(event.target.value as ServiceOrderStatus)}
                      className="h-11 w-full rounded-md border border-border/75 bg-background/45 px-3 text-sm text-foreground outline-none"
                    >
                      <option value="open">Aberta</option>
                      <option value="in-progress">Em andamento</option>
                      <option value="completed">Concluída</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => setTechModalOpen(false)} disabled={savingTech}>Cancelar</Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="secondary" onClick={() => saveTechData(false)} disabled={savingTech}>
                  {savingTech && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar andamento
                </Button>
                <Button onClick={() => saveTechData(true)} disabled={savingTech} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  <CheckCircle2 className="mr-2 h-4 w-4" />Concluir OS
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteOrder} onOpenChange={(open) => !open && setDeleteOrder(null)}>
          <AlertDialogContent className="border-border/80 bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Remover ordem em aberto?</AlertDialogTitle>
              <AlertDialogDescription>
                A OS <strong>#{deleteOrder ? String(deleteOrder.id).padStart(4, '0') : ''}</strong> será removida permanentemente. Ordens concluídas são protegidas e não exibem esta ação.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover OS</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
