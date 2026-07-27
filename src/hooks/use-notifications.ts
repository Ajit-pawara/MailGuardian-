"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNotificationStore } from "@/store/notification-store";
import { useAuthStore } from "@/store/auth-store";

export function useNotifications() {
  const { preferences, setPermission, addNotification } = useNotificationStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);

    const handlePush = (event: MessageEvent) => {
      if (event.data?.type === "new-email") {
        addNotification(event.data.notification);
      }
    };

    navigator.serviceWorker?.addEventListener("message", handlePush);
    return () => navigator.serviceWorker?.removeEventListener("message", handlePush);
  }, [addNotification, setPermission]);

  const requestPermissionMutation = useMutation({
    mutationFn: async () => {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted" && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
          ) as unknown as BufferSource,
        });

        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      }
    },
  });

  return {
    permission: useNotificationStore((s) => s.permission),
    requestPermission: requestPermissionMutation.mutate,
    preferences,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
