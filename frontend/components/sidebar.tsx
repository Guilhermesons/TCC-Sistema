'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { GlobalSearch } from '@/components/global-search'
import {
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Search,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react'

const navigation = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'tecnico'] },
  { title: 'Clientes', href: '/clientes', icon: Users, roles: ['admin'] },
  { title: 'Equipamentos', href: '/equipamentos', icon: Monitor, roles: ['admin'] },
  { title: 'Ordens de Serviço', href: '/ordens', icon: ClipboardList, roles: ['admin', 'tecnico'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setRole(localStorage.getItem('user_role'))
  }, [])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const items = useMemo(
    () => navigation.filter((item) => !role || item.roles.includes(role)),
    [role],
  )

  const roleLabel = role === 'admin' ? 'Administrador' : role === 'tecnico' ? 'Técnico' : 'Usuário'

  const handleLogout = () => {
    localStorage.removeItem('user_role')
    router.push('/')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-border/75 bg-card/90 text-foreground shadow-xl backdrop-blur md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border/70 bg-sidebar/95 shadow-2xl backdrop-blur-xl transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/[0.055] to-transparent" />

        <div className="relative flex h-[76px] items-center border-b border-sidebar-border/70 px-4">
          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_32px_-16px_currentColor]">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline">
                <span className="text-[17px] font-bold tracking-tight text-sidebar-foreground">Tech</span>
                <span className="text-[17px] font-bold tracking-tight text-primary">Assist</span>
              </div>
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">Service Management</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto px-3 py-4">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="mb-5 flex w-full items-center gap-3 rounded-xl border border-sidebar-border/65 bg-white/[0.025] px-3 py-2.5 text-left text-sm text-sidebar-foreground/55 transition-all hover:border-primary/20 hover:bg-primary/[0.055] hover:text-sidebar-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1">Buscar no sistema</span>
            <kbd className="rounded-md border border-sidebar-border/70 bg-sidebar px-1.5 py-0.5 text-[9px] font-medium text-sidebar-foreground/35">Ctrl K</kbd>
          </button>

          <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/30">Navegação</p>
          <nav className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/[0.085] text-sidebar-foreground'
                      : 'text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                  )}
                >
                  {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />}
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'bg-white/[0.025] text-sidebar-foreground/55 group-hover:text-primary',
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1">{item.title}</span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 transition-all',
                      isActive
                        ? 'translate-x-0 text-primary/70 opacity-100'
                        : '-translate-x-1 text-sidebar-foreground/25 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                    )}
                  />
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="relative border-t border-sidebar-border/70 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-sidebar-border/60 bg-white/[0.025] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{roleLabel}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-sidebar-foreground/45">
                <span className="status-pulse h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
                Sessão ativa
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span className="flex-1 text-left">Sair do sistema</span>
            <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-70" />
          </button>
        </div>
      </aside>

      <GlobalSearch role={role} open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
