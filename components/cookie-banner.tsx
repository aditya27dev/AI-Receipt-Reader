"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie_consent";

type ConsentValue = "granted" | "denied";

// gtag must push `arguments` (not a plain array) so GTM's consent mode recognises the command
function gtag(
  command: string,
  action: string,
  params: Record<string, string>,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).dataLayer = (window as any).dataLayer || [];
  // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-explicit-any
  (window as any).dataLayer.push(arguments);
}

function updateConsent(value: ConsentValue) {
  gtag("consent", "update", {
    analytics_storage: value,
  });
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
    else updateConsent(stored as ConsentValue);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "granted");
    updateConsent("granted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, "denied");
    updateConsent("denied");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-2xl">
      <p className="text-sm text-zinc-300 mb-3">
        This site uses cookies to understand visitor traffic via Google
        Analytics. No personal data is collected.
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleAccept}
          className="bg-violet-600 hover:bg-violet-700 text-white flex-1"
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDecline}
          className="text-zinc-400 hover:text-white flex-1"
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
