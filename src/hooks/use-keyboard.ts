"use client";

import { useEffect } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

const shortcuts = new Map<string, KeyHandler>();

export function useKeyboardShortcut(key: string, handler: KeyHandler, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const wrapped = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      const keyCombo = [
        e.ctrlKey || e.metaKey ? "Ctrl" : "",
        e.shiftKey ? "Shift" : "",
        e.altKey ? "Alt" : "",
        key.toUpperCase(),
      ]
        .filter(Boolean)
        .join("+");

      if (keyCombo === key || e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener("keydown", wrapped);
    return () => window.removeEventListener("keydown", wrapped);
  }, [key, handler, enabled]);
}

export function useGlobalKeyboardShortcuts(handlers: Record<string, KeyHandler>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const [key, fn] of Object.entries(handlers)) {
        const parts = key.split("+");
        const mainKey = parts.pop()!.toLowerCase();
        const ctrl = parts.includes("Ctrl");
        const shift = parts.includes("Shift");
        const alt = parts.includes("Alt");

        if (
          e.key.toLowerCase() === mainKey &&
          (ctrl === (e.ctrlKey || e.metaKey)) &&
          shift === e.shiftKey &&
          alt === e.altKey
        ) {
          e.preventDefault();
          fn(e);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlers]);
}
