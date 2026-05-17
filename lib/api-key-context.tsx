"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface ApiKeyContextValue {
  apiKey: string;
  setApiKey: (key: string) => void;
  /** Drop-in replacement for `fetch` that injects X-OpenAI-Key when set */
  apiFetch: typeof fetch;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState("");

  const apiFetch: typeof fetch = useCallback(
    (input, init) =>
      fetch(input, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          ...(apiKey ? { "x-openai-key": apiKey } : {}),
        },
      }),
    [apiKey],
  );

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, apiFetch }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKey must be used within ApiKeyProvider");
  return ctx;
}
