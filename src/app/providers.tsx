"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { supabase } from "@/services/supabase";
import { useUIStore } from "@/store/ui-store";
import { usePeriodicSync } from "@/hooks/use-sync";

function SessionHandler({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error }) => {
          if (!error) {
            window.history.replaceState(null, "", "/");
          }
          setReady(true);
        });
        return;
      }
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

function SyncManager({ children }: { children: React.ReactNode }) {
  usePeriodicSync();
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
