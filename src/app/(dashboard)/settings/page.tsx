"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";
import { useSettingsStore } from "@/store/settings-store";
import { useNotifications } from "@/hooks/use-notifications";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { preferences, setPreferences } = useNotificationStore();
  const settings = useSettingsStore();
  const { requestPermission, permission } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your MailGuardian preferences
        </p>
      </motion.div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
            </div>
            <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
              {["light", "dark", "system"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    theme === t
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">
                Status: {permission === "granted" ? "Enabled" : permission === "denied" ? "Blocked" : permission === "unsupported" ? "Unsupported" : "Not requested"}
              </p>
            </div>
            <Button
              variant={permission === "granted" ? "secondary" : "default"}
              size="sm"
              onClick={requestPermission}
              disabled={permission === "denied" || permission === "unsupported"}
            >
              {permission === "granted" ? "Active" : "Enable"}
            </Button>
          </div>

          <ToggleSetting
            label="Important Only"
            description="Only show notifications for important emails"
            checked={preferences.importantOnly}
            onChange={(v) => setPreferences({ importantOnly: v })}
          />

          <ToggleSetting
            label="Sound"
            description="Play notification sound"
            checked={preferences.soundEnabled}
            onChange={(v) => setPreferences({ soundEnabled: v })}
          />

          <ToggleSetting
            label="Vibration"
            description="Vibrate on new notifications"
            checked={preferences.vibration}
            onChange={(v) => setPreferences({ vibration: v })}
          />

          <ToggleSetting
            label="Quiet Hours"
            description="Mute notifications during specific hours"
            checked={preferences.quietHoursEnabled}
            onChange={(v) => setPreferences({ quietHoursEnabled: v })}
          />

          {preferences.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Start</label>
                <input
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={(e) => setPreferences({ quietHoursStart: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End</label>
                <input
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={(e) => setPreferences({ quietHoursEnd: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground">Minimum Priority</label>
            <input
              type="range"
              min={0}
              max={100}
              value={preferences.minPriority}
              onChange={(e) => setPreferences({ minPriority: parseInt(e.target.value) })}
              className="w-full mt-1"
            />
            <span className="text-xs text-muted-foreground">{preferences.minPriority}+</span>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleSetting
            label="Auto Sync"
            description="Automatically sync emails every 60 seconds"
            checked={settings.autoSync}
            onChange={settings.setAutoSync}
          />

          <ToggleSetting
            label="Compact View"
            description="Show more emails with less spacing"
            checked={settings.compactView}
            onChange={settings.setCompactView}
          />

          <ToggleSetting
            label="Email Preview"
            description="Show email snippet in the inbox"
            checked={settings.showPreview}
            onChange={settings.setShowPreview}
          />

          <ToggleSetting
            label="Keyboard Shortcuts"
            description="Enable keyboard navigation (?) for help"
            checked={settings.keyboardShortcuts}
            onChange={settings.setKeyboardShortcuts}
          />
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {user?.accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-xl bg-secondary/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">{account.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Gmail</Badge>
              </div>
            ))}
            {(!user?.accounts || user.accounts.length === 0) && (
              <p className="text-sm text-muted-foreground">No accounts connected</p>
            )}
            <Button
              variant="glass"
              className="w-full"
              onClick={() => window.location.href = "/api/auth"}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Add Gmail Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-sm text-red-500">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full text-red-500 border-red-500/30 hover:bg-red-500/10"
            onClick={() => {
              if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                fetch("/api/user", { method: "DELETE" }).then(() => logout());
              }
            }}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
