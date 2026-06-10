"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

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
        {mode === "sign-in" ? (
          <SignInForm onSwitch={() => setMode("sign-up")} />
        ) : (
          <SignUpForm onSwitch={() => setMode("sign-in")} />
        )}
      </div>
    );
  }

  return <>{children}</>;
}
