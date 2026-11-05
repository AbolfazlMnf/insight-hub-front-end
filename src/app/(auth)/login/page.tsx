"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/modules/auth/api";
import { useAuthStore } from "@/modules/auth/store";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: async (data) => {
      // Decode JWT payload or basic user object
      try {
        const payloadBase64 = data.accessToken.split(".")[1];
        const payload = JSON.parse(atob(payloadBase64));
        setAuth(data.accessToken, {
          id: payload.id,
          email,
          username: email.split("@")[0],
          role: payload.role || "USER",
        });
      } catch {
        setAuth(data.accessToken, {
          id: "user",
          email,
          username: email.split("@")[0],
          role: "USER",
        });
      }
      router.push("/");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      console.log("Login error:", msg);
      setError(msg);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-sm border-border bg-card shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-wide mx-auto mb-2">
            IH
          </div>
          <CardTitle className="text-xl">Sign in to Insight Hub</CardTitle>
          <CardDescription className="text-xs">
            Enter your credentials to access your workspaces
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              loginMutation.mutate();
            }}
            className="space-y-4"
          >
            {error && (
              <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-medium block mb-1">Email</label>
              <Input
                type="email"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-2">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
