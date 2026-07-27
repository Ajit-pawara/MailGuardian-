# MailGuardian

**Personal Email Dashboard** — Monitor multiple Gmail accounts, classify important emails, and get instant notifications.

![MailGuardian](public/icons/icon-512x512.png)

---

## Features

- **Multi-Account Dashboard** – Unified inbox for unlimited Gmail accounts
- **Smart Classification** – Auto-categorize emails (OTP, security, recruiter, GitHub, bank, etc.)
- **Priority Scoring** – AI-powered importance detection (0–100)
- **AI Summary** – Condense long emails, extract deadlines, tasks, and meetings
- **Instant Notifications** – Browser push, desktop, and mobile (PWA)
- **Advanced Search** – Filter by sender, subject, date, category, attachments
- **Analytics** – Category pie chart, hourly heatmap, top senders
- **Email Actions** – Read, archive, star, label, delete, mark important
- **Glassmorphism UI** – Modern Apple-like design with dark/light mode
- **PWA** – Installable, offline-capable, mobile-optimized
- **Secure** – OAuth-only, no passwords, encrypted tokens, CSP headers

---

## Tech Stack

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Frontend | Next.js 15, React 19, TypeScript         |
| Styling  | TailwindCSS, Framer Motion, Shadcn UI    |
| State    | Zustand, TanStack React Query            |
| Backend  | Next.js Route Handlers                   |
| Database | Supabase PostgreSQL (Free)               |
| Auth     | Google OAuth 2.0                         |
| Email    | Gmail API (REST, read/modify)            |
| Push     | Web Push API (VAPID)                     |
| Hosting  | Vercel (Frontend), Supabase (Database)   |

---

## Project Structure

```
src/
├── app/
│   ├── api/          # Route Handlers (auth, gmail, classify, notifications, user)
│   ├── (auth)/       # Login page & OAuth callback
│   └── (dashboard)/  # Main dashboard pages & layout
├── components/
│   ├── ui/           # Reusable primitives (Button, Card, Badge, Avatar)
│   ├── layout/       # Sidebar, Topbar, ThemeToggle
│   ├── email/        # EmailCard, EmailList
│   ├── dashboard/    # StatsCards, CategoryPie
│   └── ...           # Auth, Notifications, Search
├── hooks/            # React Query hooks (useEmails, useAuth, useSearch)
├── services/         # Gmail API, Supabase, Classification, Sync, Notifications
├── store/            # Zustand stores (auth, email, ui, notifications, settings)
├── types/            # TypeScript types
├── utils/            # cn, date, crypto, rate-limit, validation, email-helpers
├── config/           # Constants & env config
└── middleware.ts     # Rate limiting & security headers
```

---

## Free-Tier Design

| Service   | Limit                          | MailGuardian Usage                          |
| --------- | ------------------------------ | ------------------------------------------- |
| Vercel    | 100 GB bandwidth, 6000 build min | Static + ISR pages, small API payloads      |
| Supabase  | 500 MB database, 50K row limit  | ~10 KB/email, ~50K emails = 0.5 GB (sync latest only) |
| Gmail API | 1B quota units/day              | ~50 API calls/sync, ~86K/day max            |
| Web Push  | Free (browser API)              | Only for important emails, self-hosted      |

### Sync Architecture (Polling, not Push)

Gmail API does not support true push delivery without a paid Google Workspace subscription or a dedicated push endpoint. MailGuardian uses **efficient polling**:

1. Initial sync: Fetches last 50 emails per account
2. Periodic sync: Every 60 seconds via `usePeriodicSync`
3. History check: Uses Gmail `history.list` for incremental changes
4. Classification: Runs locally, uses OpenAI only if configured

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- Supabase account (free)
- Google Cloud project with Gmail API enabled

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/mailguardian.git
cd mailguardian
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

### 3. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migration from `supabase/migrations/00001_initial.sql` in the Supabase SQL editor
3. Copy your project URL and anon key to `.env.local`
4. **Configure Google Auth provider** in Supabase:
   - Go to **Authentication → Providers → Google**
   - Enable it, paste your **Client ID** and **Client Secret**
   - Check **Skip nonce checks** (required for Google ID token flow)

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Gmail API**
3. Go to **Credentials** → **Create OAuth 2.0 Client ID**
4. Set redirect URI: `http://localhost:3000/api/auth/callback`
5. Copy Client ID and Secret to `.env.local`
6. **Add scopes** (required): Go to **OAuth consent screen → Scopes**, manually add:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/gmail.modify`
7. **Add test users**: Under **OAuth consent screen → Test users**, add your email address(es)

### 5. VAPID Keys (Push Notifications)

```bash
npx web-push generate-vapid-keys
```

Add the public and private keys to `.env.local`.

### 6. Encryption Key

```bash
openssl rand -hex 32
```

Add to `ENCRYPTION_KEY` in `.env.local`.

### 7. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

---

## Deployment

### Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Set all environment variables from `.env.local` in the Vercel dashboard.

### Supabase

No additional setup needed — the database is managed via the Supabase dashboard. Run the SQL migration once.

---

## API Routes

| Route                        | Method | Description                   |
| ---------------------------- | ------ | ----------------------------- |
| `/api/auth`                  | GET    | Redirect to Google OAuth      |
| `/api/auth/callback`         | GET    | OAuth callback handler        |
| `/api/gmail/emails`          | GET    | List emails                   |
| `/api/gmail/emails`          | POST   | Perform email actions         |
| `/api/gmail/sync`            | GET    | Get sync status               |
| `/api/gmail/sync`            | POST   | Trigger email sync            |
| `/api/gmail/labels`          | GET    | List Gmail labels             |
| `/api/gmail/attach/[id]`     | GET    | Download attachment           |
| `/api/classify`              | GET    | Classify a single email       |
| `/api/classify`              | POST   | Classify and store result     |
| `/api/notifications/subscribe` | POST | Subscribe to push notifications |
| `/api/notifications/unsubscribe` | POST | Unsubscribe from push       |
| `/api/user`                  | GET    | Get user profile & analytics  |
| `/api/user`                  | DELETE | Delete account                |

---

## Keyboard Shortcuts

| Key         | Action       |
| ----------- | ------------ |
| `?`         | Show help    |
| `j` / `k`   | Navigate     |
| `u`         | Mark unread  |
| `i`         | Mark read    |
| `s`         | Star/unstar  |
| `e`         | Archive      |
| `#`         | Delete       |
| `/`         | Search       |

---

## License

MIT

---

## Limitations

- **No real-time push**: Gmail push notifications require a paid Google Workspace subscription or a publicly-accessible webhook endpoint. MailGuardian uses polling (every 60s) which keeps within free tiers.
- **No exchange/outlook**: Only Gmail via OAuth is supported.
- **AI features**: OpenAI integration is optional. Without it, classification uses local pattern matching (still effective for common categories).
- **Offline**: Basic static assets are cached; full offline email viewing requires additional service worker caching.
