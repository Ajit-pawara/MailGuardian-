import { env } from "@/config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

export function encryptToken(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedText: string): string {
  const key = getKey();
  const parts = encryptedText.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Dynamic import for edge-compatible crypto
let crypto: typeof import("node:crypto");
try {
  crypto = require("node:crypto");
} catch {
  // Edge runtime fallback — use Web Crypto API
  const webCrypto = globalThis.crypto;
  crypto = {
    randomBytes: (size: number) => {
      const buf = Buffer.alloc(size);
      webCrypto.getRandomValues(buf);
      return buf;
    },
    createCipheriv: () => {
      throw new Error("Cipher not available in edge runtime");
    },
    createDecipheriv: () => {
      throw new Error("Decipher not available in edge runtime");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}
