"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/services/supabase";
import type { UserProfile } from "@/types/auth";

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || session.user.email || "",
          avatarUrl: session.user.user_metadata?.avatar_url || "",
          accounts: [],
          createdAt: new Date(session.user.created_at),
          updatedAt: new Date(session.user.last_sign_in_at || session.user.created_at),
        };

        const { data: accounts } = await supabase
          .from("mail_accounts")
          .select("*")
          .eq("user_id", session.user.id);

        if (accounts) {
          profile.accounts = accounts.map((a) => ({
            ...a,
            accessToken: "",
            refreshToken: "",
            createdAt: new Date(a.created_at),
            updatedAt: new Date(a.updated_at),
            lastSync: a.last_sync ? new Date(a.last_sync) : null,
            expiresAt: Number(a.expires_at),
            provider: a.provider as "gmail",
          }));
        }

        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [setUser]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
      logout();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated,
    logout: logoutMutation.mutate,
    login: () => {
      window.location.href = "/api/auth/login";
    },
  };
}

export function useAccounts() {
  const user = useAuthStore((s) => s.user);
  return user?.accounts || [];
}

export function useActiveAccount() {
  const user = useAuthStore((s) => s.user);
  const activeId = useAuthStore((s) => s.activeAccountId);
  if (!activeId) return user?.accounts[0] || null;
  return user?.accounts.find((a) => a.id === activeId) || null;
}
