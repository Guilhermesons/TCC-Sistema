'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação baseada nos dois usuários criados no banco de dados
    if (email === 'admin@sistema.com' && password === 'senhaSuperSegura123') {
      // Armazena a regra no navegador para usarmos nas permissões das telas
      localStorage.setItem('user_role', 'admin');
      router.push('/dashboard');
    } else if (email === 'tecnico@sistema.com' && password === 'senhaTecnico123') {
      localStorage.setItem('user_role', 'tecnico');
      router.push('/dashboard');
    } else {
      setError('E-mail ou senha inválidos.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="flex flex-col items-center justify-center gap-2 text-card-foreground text-2xl font-bold">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            TechAssist
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Insira suas credenciais para gerenciar as ordens de serviço
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 text-center font-medium">
                {error}
              </div>
            )}

            {/* Campo de E-mail */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex h-10 w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Campo de Senha */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex h-10 w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-2 font-semibold shadow"
            >
              Entrar no Sistema
            </button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}