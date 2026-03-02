# InvitArr

**Serverless media server invite management with Telegram approval.**  
Works with Plex — Jellyfin and Emby support coming soon.

No Docker. No VPS. No maintenance. Runs free on Cloudflare.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Bryanmoon19/invitarr)
&nbsp;
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform: Cloudflare Workers](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange)](https://workers.cloudflare.com)

---

## How It Works

```
Friend fills out form → You get Telegram notification
                           ↓
                    [✅ Send Invite] [❌ Decline]
                           ↓
                    Library picker appears
                    (toggle each library on/off)
                           ↓
                    [📤 Send Invite]
                           ↓
                    Invite sent — restricted to
                    only the libraries you selected
```

---

## Features

- 🔒 **Per-invite library control** — choose exactly what each person gets, from Telegram
- 📱 **Telegram-native approval** — no dashboard to open, works from your phone
- ☁️ **Fully serverless** — Cloudflare Workers + KV, free tier, zero infrastructure
- 🛡️ **Security-first** — owner allowlist, rate limiting, honeypot, CORS lock, auto-expiring KV
- 🌐 **Guide page included** — drop-in onboarding page with request form (see `/guide`)
- 🎬 **Plex support** — restricted invites via the official Plex API

---

## Quick Start

### Prerequisites

- [Cloudflare account](https://cloudflare.com) (free)
- [wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) — `npm install -g wrangler`
- Telegram bot — create one at [@BotFather](https://t.me/BotFather)
- Plex Media Server

### Option A — Guided setup (recommended)

```bash
git clone https://github.com/Bryanmoon19/invitarr.git
cd invitarr/worker
chmod +x setup.sh && ./setup.sh
```

`setup.sh` walks you through secrets configuration, creates the KV namespace, deploys the worker, and registers the Telegram webhook.

### Option B — Manual

```bash
# 1. Clone
git clone https://github.com/Bryanmoon19/invitarr.git && cd invitarr/worker

# 2. Create KV namespace
wrangler kv namespace create invitarr
# Copy the ID into wrangler.toml

# 3. Set required secrets
wrangler secret put BOT_TOKEN        # Telegram bot token
wrangler secret put CHAT_ID          # Your Telegram user ID
wrangler secret put PLEX_TOKEN       # Your Plex auth token
wrangler secret put PLEX_SERVER_ID   # Your Plex machine identifier
wrangler secret put PLEX_LIBRARIES   # "Movies:107518710,TV Shows:107518703,..."

# 4. Optional secrets
wrangler secret put OWNER_NAME       # Your name (shown on request form)
wrangler secret put SERVER_NAME      # Your server name (shown on request form)
wrangler secret put ALLOWED_ORIGIN   # Lock CORS to your guide page domain

# 5. Deploy
wrangler deploy

# 6. Register Telegram webhook
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<YOUR-WORKER>.workers.dev/webhook"
```

---

## Configuration

All sensitive values are stored as **Cloudflare secrets** — never in code or config files.

| Secret | Required | Description |
|--------|----------|-------------|
| `BOT_TOKEN` | ✅ | Telegram bot token from [@BotFather](https://t.me/BotFather) |
| `CHAT_ID` | ✅ | Your Telegram user ID — also the security allowlist |
| `PLEX_TOKEN` | ✅ | Your Plex auth token ([how to find it](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)) |
| `PLEX_SERVER_ID` | ✅ | Your Plex server machine identifier |
| `PLEX_LIBRARIES` | ✅ | `Name:GlobalSectionId,Name:GlobalSectionId,...` |
| `OWNER_NAME` | Optional | Your display name on the request form |
| `SERVER_NAME` | Optional | Your server's name on the form |
| `ALLOWED_ORIGIN` | Optional | Lock CORS to your guide page domain |

### Finding your PLEX_LIBRARIES

> ⚠️ IDs must be **global plex.tv IDs** — not local server keys.  
> Local keys (1, 2, 3) will result in full-access invites regardless of selection.

```bash
# Quick way: invite yourself and inspect the response for section ids
# Or use the Plex API directly:
curl "https://plex.tv/api/servers/YOUR_SERVER_ID/shared_servers" \
  -H "X-Plex-Token: YOUR_PLEX_TOKEN" \
  -H "X-Plex-Client-Identifier: invitarr-setup" \
  | grep -o 'id="[0-9]*"'
```

Format for the secret: `Movies:107518710,TV Shows:107518703,Anime:107518735`

---

## Guide Page

`/guide` contains a ready-to-deploy onboarding page for your users:

- 4-step wizard: account creation → access request → invite accept → device setup
- Embedded request form that connects to your worker
- English + Spanish, mobile-friendly, dark-mode
- Configurable via a single `SITE_CONFIG` block at the top of `index.html`

```bash
cd invitarr/guide
# Edit SITE_CONFIG in index.html, then:
npx wrangler pages deploy . --project-name=invitarr-guide
```

See [guide/README.md](guide/README.md) for full instructions.

---

## Security

Security is the top priority. See [SECURITY.md](SECURITY.md) for the full breakdown.

| Protection | Details |
|------------|---------|
| Owner allowlist | Every Telegram button press validates against your `CHAT_ID` |
| Rate limiting | 5 submissions/IP/hour, KV-backed |
| Honeypot | Silent bot rejection — no CAPTCHA needed for most cases |
| Input validation | Strict email regex, name length limits |
| CORS lock | Configurable `ALLOWED_ORIGIN` per-domain restriction |
| Auto-expiring KV | All request data deleted after 24h (or on action) |
| Zero stored secrets | Plex token and bot token never written to KV or logs |

**Found a vulnerability?** See [SECURITY.md](SECURITY.md) — please don't open a public issue.

---

## Project Structure

```
invitarr/
├── worker/               # Cloudflare Worker
│   ├── src/index.js      # Main worker logic
│   ├── wrangler.toml     # Cloudflare config (no secrets here)
│   └── setup.sh          # Guided setup script
├── guide/                # Optional onboarding page (Cloudflare Pages)
│   ├── index.html        # Full setup guide with embedded request form
│   └── README.md
├── docs/
│   └── faq.md
├── SECURITY.md
└── README.md
```

---

## Roadmap

- [x] Plex invite with per-invite library picker
- [x] Telegram approval flow
- [x] Rate limiting + honeypot + input validation
- [x] Owner-only callback security
- [x] Guided setup script
- [x] Onboarding guide page
- [ ] Jellyfin support
- [ ] Emby support
- [ ] Time-limited invites (auto-remove after X days)
- [ ] Multi-admin support (multiple approvers)
- [ ] Cloudflare Turnstile CAPTCHA option
- [ ] Overseerr/Jellyseerr integration

---

## Comparison

| | InvitArr | Wizarr | Membarr |
|--|---------|--------|---------|
| Self-hosting required | ❌ None | ✅ Docker | ✅ Docker |
| Telegram approval | ✅ | ❌ | ❌ |
| Per-invite library picker | ✅ | ⚠️ Tier-based | ❌ |
| Free to run | ✅ CF free tier | Needs a server | Needs a server |
| Onboarding guide page | ✅ | ⚠️ Post-invite only | ❌ |
| Jellyfin support | 🚧 Soon | ✅ | ✅ |

---

## Contributing

PRs welcome. Please open an issue first for major changes.  
For security issues — **do not open public issues**. See [SECURITY.md](SECURITY.md).

---

## License

MIT
