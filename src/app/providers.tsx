"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { useUIStore } from "@/store/ui-store";
import { usePeriodicSync } from "@/hooks/use-sync";
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
        <SyncManager>
          {children}
        </SyncManager>
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
