'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Monitor,
  ClipboardList,
  Wrench,
  LogOut
} from 'lucide-react'

const allNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    requiredRole: 'both', // Ambos podem ver
  },
  {
    title: 'Clientes',
    href: '/clientes',
    icon: Users,
    requiredRole: 'admin', // Só admin
  },
  {
    title: 'Equipamentos',
    href: '/equipamentos',
    icon: Monitor,
    requiredRole: 'admin', // Só admin
  },
  {
    title: 'Ordens de Serviço',
    href: '/ordens', // CORRIGIDO: Mudado de '/os' para '/ordens' para bater com sua pasta
    icon: ClipboardList,
    requiredRole: 'both', // Ambos podem ver
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    // Pega o cargo do usuário logado
    setRole(localStorage.getItem('user_role'))
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  // Filtra os itens do menu com base no cargo do usuário
  const filteredItems = allNavItems.filter(item => 
    item.requiredRole === 'both' || item.requiredRole === role
  )

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar flex flex-col justify-between">
      <div>
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            TechAssist
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  )
}