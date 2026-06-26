"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";
import { Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    setDemoError(null);
    try {
      const res = await fetch("/api/demo-login", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setDemoError(data.error ?? "Demo login failed. Please try again.");
        setDemoLoading(false);
      }
    } catch {
      setDemoError("Network error. Please try again.");
      setDemoLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="aurora-bg min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          {/* One-click demo */}
          <div className="glass-card rounded-2xl p-6 text-center space-y-3 border border-violet-500/30">
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Receipt AI</h1>
              <p className="text-sm text-white/50 mt-1">
                AI-powered receipt extraction &amp; expense tracking
              </p>
            </div>
            <Button
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold h-10"
            >
              {demoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Try Demo →"
              )}
            </Button>
            <p className="text-xs text-white/40">
              No signup required · Pre-loaded with sample data
            </p>
            {demoError && <p className="text-xs text-red-400">{demoError}</p>}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Regular auth forms */}
          {mode === "sign-in" ? (
            <SignInForm onSwitch={() => setMode("sign-up")} />
          ) : (
            <SignUpForm onSwitch={() => setMode("sign-in")} />
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
