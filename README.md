# InvitArr

**Serverless media server invite management with Telegram approval.**  
Works with Plex — Jellyfin and Emby support coming soon.

No Docker. No VPS. No maintenance. Runs free on Cloudflare.

---

## How It Works

1. A friend fills out your request form
2. You get a **Telegram notification** with Invite / Decline buttons
3. Tap **Invite** → a **library picker** appears — toggle exactly which libraries they get
4. Tap **Send Invite** → invite sent with only those libraries, nothing more

![Flow diagram placeholder](docs/flow.png)

---

## Features

- 🔒 **Per-invite library control** — choose exactly what each person gets, from Telegram
- 📱 **Telegram-native approval** — no dashboard to open, works from your phone
- ☁️ **Fully serverless** — Cloudflare Workers + KV, free tier, zero infrastructure
- 🛡️ **Security-first** — owner allowlist, rate limiting, honeypot, input validation, auto-expiring KV
- 🎬 **Plex support** — restricted invites via the official Plex API
- 🌐 **Guide page ready** — drop-in with any static onboarding page (see `/guide`)

---

## Quick Start

### Prerequisites

- A [Cloudflare account](https://cloudflare.com) (free)
- [Node.js](https://nodejs.org) + [wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A Telegram bot (create one via [@BotFather](https://t.me/BotFather))
- A Plex Media Server

### Deploy in 5 minutes

```bash
git clone https://github.com/YOUR_USERNAME/invitarr.git
cd invitarr/worker
npm install -g wrangler   # if you don't have it
chmod +x setup.sh
./setup.sh
```

`setup.sh` will:
1. Create your KV namespace
2. Walk you through entering all required secrets
3. Deploy the worker
4. Register the Telegram webhook

That's it.

---

## Configuration

All configuration is done through **Cloudflare secrets** — never in code or config files.

| Secret | Required | Description |
|--------|----------|-------------|
| `BOT_TOKEN` | ✅ | Telegram bot token from [@BotFather](https://t.me/BotFather) |
| `CHAT_ID` | ✅ | Your Telegram user ID — also acts as the security allowlist |
| `PLEX_TOKEN` | ✅ | Your Plex auth token ([how to find it](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)) |
| `PLEX_SERVER_ID` | ✅ | Your Plex server machine identifier |
| `PLEX_LIBRARIES` | ✅ | `Name:GlobalSectionId,Name:GlobalSectionId,...` |
| `OWNER_NAME` | Optional | Your display name on the request form (default: "your host") |
| `SERVER_NAME` | Optional | Your server's name on the form (default: "Media Server") |
| `ALLOWED_ORIGIN` | Optional | Lock form submissions to your guide page domain |

### Getting your PLEX_LIBRARIES

Library IDs must be **global plex.tv IDs**, not local server keys. To find them:

```bash
curl -s "https://plex.tv/api/v2/shared_servers" \
  -H "X-Plex-Token: YOUR_PLEX_TOKEN" \
  -H "X-Plex-Client-Identifier: invitarr-setup" | grep -o 'id="[0-9]*"'
```

Or: send a test invite to yourself and note the section IDs in the response.

Format: `Movies:107518710,TV Shows:107518703,Anime:107518735`

---

## Security

Security is a top priority. See [SECURITY.md](SECURITY.md) for the full breakdown.

**Summary of protections:**
- ✅ Telegram `CHAT_ID` allowlist — only you can approve requests
- ✅ Rate limiting — 5 requests/IP/hour
- ✅ Honeypot field — silent bot rejection
- ✅ Input validation — strict email regex, name length limits
- ✅ CORS origin lock — configurable per-domain restriction
- ✅ Auto-expiring KV — no stale PII after 24h
- ✅ Zero stored credentials — tokens never written to KV or logs

**Found a vulnerability?** Please report it privately. See [SECURITY.md](SECURITY.md).

---

## Project Structure

```
invitarr/
├── worker/               # Cloudflare Worker (the invite backend)
│   ├── src/index.js      # Main worker logic
│   ├── wrangler.toml     # Cloudflare config
│   └── setup.sh          # Guided setup script
├── guide/                # Example onboarding guide page (optional)
│   └── index.html
├── docs/
│   ├── setup.md          # Detailed setup guide
│   ├── security.md       # Security deep-dive
│   ├── libraries.md      # How to find Plex section IDs
│   └── faq.md
└── SECURITY.md           # Vulnerability reporting policy
```

---

## Roadmap

- [x] Plex invite with library picker
- [x] Telegram approval flow
- [x] Rate limiting + honeypot
- [x] Owner-only callback validation
- [ ] Jellyfin support
- [ ] Emby support
- [ ] Time-limited invites (auto-remove after X days)
- [ ] Multi-admin support (multiple Telegram chat IDs)
- [ ] Cloudflare Turnstile CAPTCHA option
- [ ] Overseerr/Jellyseerr link integration

---

## Contributing

PRs welcome. Please open an issue first for major changes.  
For security issues, see [SECURITY.md](SECURITY.md) — **do not open public issues for vulnerabilities.**

---

## License

MIT — use it, fork it, make it yours.

---

## Comparison

| | InvitArr | Wizarr | Membarr |
|--|---------|--------|---------|
| Self-hosting required | ❌ None | ✅ Docker | ✅ Docker |
| Telegram approval | ✅ | ❌ | ❌ |
| Per-invite library picker | ✅ | ⚠️ Tier-based | ❌ |
| Free to run | ✅ CF free tier | Needs a server | Needs a server |
| Jellyfin support | 🚧 Soon | ✅ | ✅ |
