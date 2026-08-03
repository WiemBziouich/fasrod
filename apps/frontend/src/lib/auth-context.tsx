"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AuthClient = {
  id: string;
  nom: string;
  telephone: string;
  telephone_secondaire: string | null;
  email: string;
  is_admin: boolean;
};

type AuthTokenResponse = {
  access_token: string;
  expires_in: number;
  client: AuthClient;
};

type AuthContextValue = {
  client: AuthClient | null;
  accessToken: string | null;
  isLoading: boolean;
  setSession: (session: AuthTokenResponse) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

function resolveApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (typeof window === "undefined") {
    return configuredBaseUrl ?? "http://localhost:8000/api/v1";
  }

  if (!configuredBaseUrl) {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }

  try {
    const configuredHost = new URL(configuredBaseUrl).hostname;
    if (configuredHost === "localhost" || configuredHost === "127.0.0.1") {
      return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
    }
  } catch {
    // Keep the configured URL if it cannot be parsed.
  }

  return configuredBaseUrl;
}

const baseUrl = resolveApiBaseUrl();

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function requestSession(): Promise<AuthTokenResponse> {
  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Refresh session failed");
  }

  return (await response.json()) as AuthTokenResponse;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<AuthClient | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((session: AuthTokenResponse) => {
    setClient(session.client);
    setAccessToken(session.access_token);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await requestSession();
      setSession(session);
    } catch {
      setClient(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${baseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
    } finally {
      setClient(null);
      setAccessToken(null);
    }
  }, [accessToken]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({ client, accessToken, isLoading, setSession, refreshSession, logout }),
    [client, accessToken, isLoading, setSession, refreshSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}