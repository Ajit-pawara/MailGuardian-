# MailGuardian – Deployment Guide

## Prerequisites

1. **Google Cloud Project** with Gmail API enabled
2. **Supabase Project** (free tier)
3. **Vercel Account** (free tier)
4. **Domain** (optional – Vercel provides `.vercel.app`)

---

## Step 1: Google Cloud & Gmail API Setup

### Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable **Gmail API**:
   - Go to APIs & Services → Library
   - Search "Gmail API" → Enable
4. Configure OAuth consent:
   - User Type: **External**
   - Add test users if in testing mode
   - Scopes: Add `../auth/gmail.readonly`, `../auth/gmail.labels`, `../auth/gmail.modify`, `../auth/userinfo.email`, `../auth/userinfo.profile`
5. Create OAuth 2.0 credentials:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - For production: `https://your-domain.vercel.app/api/auth/callback`
     - For local: `http://localhost:3000/api/auth/callback`
   - Copy **Client ID** and **Client Secret**

---

## Step 2: Supabase Setup

### Create Project

1. Sign in at [supabase.com](https://supabase.com)
2. Create a new project (choose nearest region)
3. Wait for provisioning (~2 minutes)

### Run Migration

1. Go to **SQL Editor** in Supabase dashboard
2. Open `supabase/migrations/00001_initial.sql` from the repo
3. Paste and run → All tables, indexes, RLS policies will be created

### Get Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (keep secret!) → `SUPABASE_SERVICE_ROLE_KEY`

### (Optional) Generate TypeScript types

```bash
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

---

## Step 3: Generate Secrets

### Encryption Key

```bash
openssl rand -hex 32
```

### VAPID Keys (Web Push)

```bash
npx web-push generate-vapid-keys
```

This outputs:
```
Public Key: BEl...
Private Key: ...
```

---

## Step 4: Vercel Deployment

### Option A: Deploy with Git (Recommended)

1. Push code to **GitHub** repository
2. Go to [vercel.com](https://vercel.com) → Import Repository
3. Select your MailGuardian repo

### Option B: Deploy with CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Environment Variables

Add these in Vercel dashboard (Settings → Environment Variables):

| Variable                         | Description                    |
| -------------------------------- | ------------------------------ |
| `NEXT_PUBLIC_APP_URL`            | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL`       | From Supabase                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | From Supabase                  |
| `SUPABASE_SERVICE_ROLE_KEY`      | From Supabase                  |
| `GOOGLE_CLIENT_ID`               | From Google Cloud              |
| `GOOGLE_CLIENT_SECRET`           | From Google Cloud              |
| `ENCRYPTION_KEY`                 | Generated above                |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`   | Generated above                |
| `VAPID_PRIVATE_KEY`              | Generated above                |
| `VAPID_SUBJECT`                  | `mailto:you@example.com`       |
| `OPENAI_API_KEY`                 | Optional – for AI features     |

### Build Settings

- Framework: **Next.js**
- Build command: `npm run build`
- Output directory: `.next`
- Node version: **20.x** (default)

---

## Step 5: Post-Deployment

### Update Google OAuth Redirect URIs

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add the production redirect: `https://your-domain.vercel.app/api/auth/callback`
4. Remove `http://localhost:3000/api/auth/callback` (or keep for dev)

### Verify Everything

1. Visit `https://your-domain.vercel.app`
2. Click "Continue with Google"
3. Complete OAuth flow
4. Dashboard should load with sync starting automatically
5. First sync may take 10–30 seconds for 50 emails

---

## Free Tier Limits

| Service             | Limit               | Notes                                    |
| ------------------- | ------------------- | ---------------------------------------- |
| Vercel              | 100 GB bandwidth    | ~2M API calls/month                      |
| Vercel Serverless   | 10s execution limit | Sync fits well under 10s for 50 emails   |
| Supabase            | 500 MB database     | Emails ~5KB each → ~100K emails max       |
| Supabase            | 50,000 rows/month   | Sync latest 50 → stays within limits     |
| Gmail API           | 1B quota units/day  | Each request ~5-10 units                 |
| Google OAuth        | Free                | No limits for personal use               |
| Web Push (Browser)  | Free                | Built into browser, no server cost       |

---

## Scaling Considerations (if needed)

- **More email volume**: Increase sync interval or filter by label
- **Larger database needs**: Upgrade Supabase ($25/mo for 8 GB)
- **Real-time push**: Add a Pub/Sub endpoint with Google Cloud Functions
- **AI features**: OpenAI API costs ~$0.15/1M tokens with gpt-4o-mini

---

## Troubleshooting

### OAuth Error: redirect_uri_mismatch
→ Check your redirect URI in Google Cloud Console matches exactly (including trailing slash)

### Sync fails: "Token has expired"
→ Revoke access and re-authenticate. Refresh tokens are stored encrypted.

### Push notifications not working
→ Ensure VAPID keys are correct. Check browser notification permissions. HTTPS is required.

### "No emails found"
→ First sync runs after login. Wait 30 seconds and refresh. Check Gmail API is enabled.

### Database: "permission denied"
→ Run the SQL migration in Supabase SQL Editor. RLS policies are already included.
