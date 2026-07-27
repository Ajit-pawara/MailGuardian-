"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useUIStore } from "@/store/ui-store";
import { usePeriodicSync } from "@/hooks/use-sync";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/store/auth-store";

function SyncManager({ children }: { children: React.ReactNode }) {
  usePeriodicSync();
  return <>{children}</>;
}

function SessionHandler({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setup = params.get("setup");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (setup === "true" && accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        if (error) {
          console.error("Session setup error:", error);
        }
        window.history.replaceState({}, "", "/");
      });
    }
  }, [setUser]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchInterval: 60_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const theme = useUIStore((s) => s.theme);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme={theme === "system" ? "system" : theme}
      >
        <SessionHandler>
          <SyncManager>
            {children}
          </SyncManager>
        </SessionHandler>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "16px",
              backdropFilter: "blur(20px)",
              background: "var(--glass-bg, rgba(255, 255, 255, 0.9))",
              border: "1px solid var(--glass-border, rgba(255, 255, 255, 0.18))",
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
