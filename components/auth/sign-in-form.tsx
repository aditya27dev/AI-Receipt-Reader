"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanLine, Loader2 } from "lucide-react";

interface SignInFormProps {
  onSwitch: () => void;
}

export function SignInForm({ onSwitch }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error)
      setError(error.message ?? "Sign in failed. Check your credentials.");
  };

  return (
    <Card className="glass-card w-full max-w-sm">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
        </div>
        <CardTitle className="text-xl text-white">Welcome back</CardTitle>
        <p className="text-sm text-white/50">Sign in to your account</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-white/70">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input text-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-white/70">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="glass-input text-white"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full bg-violet-400 hover:bg-violet-500 text-white"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sign in
          </Button>
          <p className="text-center text-sm text-white/50">
            No account?{" "}
            <button
              type="button"
              onClick={onSwitch}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Create one
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
