export const SERVICE_CATEGORIES = [
  {
    value: 'diagnostic',
    label: 'Diagnóstico / avaliação',
    price: 80,
    description: 'Avaliação técnica, testes iniciais e identificação do defeito.',
  },
  {
    value: 'software',
    label: 'Software / formatação',
    price: 150,
    description: 'Formatação, sistema operacional, drivers e ajustes de software.',
  },
  {
    value: 'preventive',
    label: 'Manutenção preventiva',
    price: 180,
    description: 'Limpeza, revisão, testes e manutenção preventiva do equipamento.',
  },
  {
    value: 'hardware',
    label: 'Reparo de hardware',
    price: 250,
    description: 'Diagnóstico avançado e reparo relacionado a componentes físicos.',
  },
  {
    value: 'part-installation',
    label: 'Instalação / troca de peça',
    price: 120,
    description: 'Mão de obra para instalação ou substituição de componentes.',
  },
  {
    value: 'network',
    label: 'Rede / configuração',
    price: 180,
    description: 'Configuração de rede, conectividade, periféricos ou serviços relacionados.',
  },
  {
    value: 'data-recovery',
    label: 'Backup / recuperação de dados',
    price: 300,
    description: 'Procedimentos de cópia, recuperação ou migração de dados.',
  },
] as const

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]['value'] | 'legacy'

export function getServiceCategory(category?: string | null) {
  if (category === 'legacy') {
    return {
      value: 'legacy',
      label: 'Sem categoria (OS anterior)',
      price: 0,
      description: 'Ordem criada antes da categorização de serviços.',
    }
  }

  return SERVICE_CATEGORIES.find((item) => item.value === category) || SERVICE_CATEGORIES[0]
}

export function formatBRL(value?: number | string | null) {
  const numeric = Number(value || 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(numeric) ? numeric : 0)
}
