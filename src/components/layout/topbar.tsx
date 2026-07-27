"use client";

import { useUIStore } from "@/store/ui-store";
import { useEmailStore } from "@/store/email-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-media-query";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/utils/cn";

export function Topbar() {
  const { sidebarOpen, toggleSidebar, setMobileMenuOpen } = useUIStore();
  const totalUnread = useEmailStore((s) => s.totalUnread);
  const { user, logout } = useAuthStore();
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="shrink-0"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </Button>
        )}
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
            <svg className={cn("h-5 w-5 transition-transform", sidebarOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Button>
        )}
        <h1 className="text-lg font-semibold hidden sm:block">Dashboard</h1>
      </div>

      <div className="flex items-center gap-2">
        {totalUnread > 0 && (
          <Badge variant="default" className="mr-2">
            {totalUnread} unread
          </Badge>
        )}

        <ThemeToggle />

        {user && (
          <div className="relative group">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar src={user.avatarUrl} alt={user.name} size="sm" />
            </Button>
            <div className="absolute right-0 top-full mt-1 w-56 origin-top-right scale-95 rounded-2xl border bg-background/80 backdrop-blur-xl p-2 opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
              <div className="px-3 py-2 text-sm">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="border-t" />
              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
