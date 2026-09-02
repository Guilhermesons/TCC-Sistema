'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Lock,
  Mail,
  ShieldCheck,
  Wrench,
} from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (email === 'admin@sistema.com' && password === 'senhaSuperSegura123') {
      localStorage.setItem('user_role', 'admin')
      router.push('/dashboard')
    } else if (email === 'tecnico@sistema.com' && password === 'senhaTecnico123') {
      localStorage.setItem('user_role', 'tecnico')
      router.push('/dashboard')
    } else {
      setError('E-mail ou senha inválidos.')
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-48 -left-40 h-[420px] w-[420px] rounded-full bg-blue-500/[0.06] blur-[100px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden px-4 lg:block xl:px-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-medium text-primary">
            <span className="status-pulse h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
            Plataforma operacional
          </div>

          <div className="max-w-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_40px_-18px_currentColor]">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold tracking-tight text-foreground">Tech</span>
                  <span className="text-2xl font-bold tracking-tight text-primary">Assist</span>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Service Management
                </p>
              </div>
            </div>

            <h1 className="text-balance text-4xl font-semibold leading-[1.12] tracking-[-0.035em] text-foreground xl:text-5xl">
              Gestão técnica simples, organizada e eficiente.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Centralize clientes, equipamentos e ordens de serviço em uma interface criada para facilitar o trabalho do dia a dia.
            </p>

            <div className="mt-9 grid max-w-lg grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-card/45 p-4 backdrop-blur-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <Cpu className="h-[18px] w-[18px]" />
                </div>
                <p className="text-sm font-medium text-foreground">Fluxo centralizado</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Informações técnicas em um único ambiente.</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/45 p-4 backdrop-blur-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </div>
                <p className="text-sm font-medium text-foreground">Acesso por perfil</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Permissões adequadas para cada função.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-5 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="flex items-baseline">
              <span className="text-xl font-bold tracking-tight">Tech</span>
              <span className="text-xl font-bold tracking-tight text-primary">Assist</span>
            </div>
          </div>

          <Card className="tech-panel tech-glow overflow-hidden border-border/75 bg-card/85 p-0 backdrop-blur-xl">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/65 to-transparent" />

            <CardContent className="p-6 sm:p-8">
              <div className="mb-7">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                    <Lock className="h-[18px] w-[18px]" />
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                    <Activity className="h-3 w-3" />
                    Online
                  </div>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">Bem-vindo</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  Entre com suas credenciais para acessar o painel de gerenciamento.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/[0.08] px-3.5 py-3 text-sm text-destructive">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/15">
                      !
                    </span>
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.08em] text-card-foreground/75">
                    E-mail
                  </label>
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-12 w-full rounded-xl border border-border/80 bg-background/45 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-primary/50 focus:bg-background/70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.08em] text-card-foreground/75">
                    Senha
                  </label>
                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 w-full rounded-xl border border-border/80 bg-background/45 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-primary/50 focus:bg-background/70"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-cyan-950/20 transition-all hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Entrar no sistema
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 border-t border-border/55 pt-5 text-[11px] text-muted-foreground/65">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary/70" />
                Ambiente de gerenciamento • acesso restrito
              </div>
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-[11px] text-muted-foreground/45">
            TechAssist • Sistema de Ordens de Serviço
          </p>
        </section>
      </div>
    </main>
  )
}
