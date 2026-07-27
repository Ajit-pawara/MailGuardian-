"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/config/constants";
import { useAuthStore } from "@/store/auth-store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth";
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/40 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 h-64 w-64 rounded-full bg-blue-200/40 dark:bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 h-64 w-64 rounded-full bg-indigo-200/40 dark:bg-indigo-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="rounded-2xl border border-blue-100/50 dark:border-blue-900/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-blue-500/5 p-8 space-y-8">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20"
            >
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </motion.div>

            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {APP_NAME}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            size="lg"
            className="w-full h-12 gap-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 shadow-sm"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </Button>

          <div className="text-center space-y-1.5">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Your data is encrypted end-to-end.
            </p>
            <p className="text-[11px] text-slate-300 dark:text-slate-600">
              We only request read and label access to your Gmail.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Compatible with Gmail &amp; Google Workspace
          </p>
        </div>
      </motion.div>
    </div>
  );
}
