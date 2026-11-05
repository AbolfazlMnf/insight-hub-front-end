'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/modules/auth/api';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/shared/components/ui/card';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: () =>
      authApi.register({
        name: name || undefined,
        username,
        email,
        password,
      }),
    onSuccess: () => {
      toast.success('Account created successfully! Please sign in.');
      router.push('/login');
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err, 'Registration failed');
      setError(msg);
      toast.error(msg);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-sm border-border bg-card shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-wide mx-auto mb-2">
            IH
          </div>
          <CardTitle className="text-xl">Create Account</CardTitle>
          <CardDescription className="text-xs">
            Register to join and create knowledge workspaces
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              registerMutation.mutate();
            }}
            className="space-y-4"
          >
            {error && (
              <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-medium block mb-1">Full Name</label>
              <Input
                type="text"
                placeholder="Alex Developer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Username</label>
              <Input
                type="text"
                placeholder="alexdev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Email</label>
              <Input
                type="email"
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-2">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
