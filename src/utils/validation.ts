import { z } from "zod";

export const emailSchema = z.string().email().max(254);

export const subjectSchema = z.string().max(500);

export const messageSchema = z.string().max(200_000);

export const googleTokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  token_type: z.string(),
  expiry_date: z.number(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const notificationRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  enabled: z.boolean(),
  conditions: z.array(
    z.object({
      field: z.enum(["category", "sender", "subject", "priority", "hasAttachment", "account"]),
      operator: z.enum(["equals", "contains", "greaterThan", "lessThan", "is"]),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
  ),
  sound: z.string().default("default"),
  vibration: z.boolean().default(true),
});

export const notificationPreferencesSchema = z.object({
  enabled: z.boolean(),
  importantOnly: z.boolean(),
  minPriority: z.number().min(0).max(100),
  soundEnabled: z.boolean(),
  vibration: z.boolean(),
  desktopEnabled: z.boolean(),
  mobileEnabled: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
});

export const searchQuerySchema = z.object({
  q: z.string().max(500),
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  after: z.string().optional(),
  before: z.string().optional(),
  hasAttachment: z.boolean().optional(),
  category: z.string().optional(),
  account: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});
