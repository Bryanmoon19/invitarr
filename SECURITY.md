# Security Policy

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Open a [GitHub Security Advisory](https://github.com/Bryanmoon19/invitarr/security/advisories/new) — it's private and goes directly to the maintainer.

We will respond within 48 hours and aim to patch confirmed vulnerabilities within 7 days.

---

## Security Model

InvitArr is designed with a minimal attack surface:

- **No database** — KV entries auto-expire and are deleted after action
- **No admin panel** — all approvals happen in your Telegram DMs
- **No user accounts** — no passwords to steal or sessions to hijack
- **No persistent PII** — email/name deleted after invite sent or declined

---

## Secrets

All sensitive values must be stored as **Cloudflare Worker secrets**, never in code or config files.

| Secret | Sensitivity | What happens if compromised |
|--------|-------------|----------------------------|
| `PLEX_TOKEN` | 🔴 Critical | Full access to your Plex server — rotate immediately |
| `BOT_TOKEN` | 🟠 High | Attacker can read/send Telegram messages as your bot |
| `CHAT_ID` | 🟡 Medium | Alone, useless — but combined with `BOT_TOKEN` enables spoofing |
| `PLEX_SERVER_ID` | 🟡 Medium | Public in Plex API responses — low risk alone |
| `PLEX_LIBRARIES` | 🟢 Low | Library names and IDs — not sensitive |

### If your Plex token is compromised

1. Go to [plex.tv](https://plex.tv) → Account → Authorized Devices
2. Sign out all devices and re-sign in
3. Generate a new token and update the secret: `wrangler secret put PLEX_TOKEN`

### If your bot token is compromised

1. Message @BotFather → `/revoke` → select your bot
2. Update: `wrangler secret put BOT_TOKEN`
3. Re-register the webhook (see setup.sh)

---

## Built-in Protections

### 1. Owner-only Callback Validation
Every Telegram button press validates `from.id` against your `CHAT_ID`. Even if someone obtained your bot token, they cannot approve or decline requests without your exact Telegram user ID.

### 2. Rate Limiting
Requests are rate-limited by IP: **5 per hour** by default. This prevents form spam from overwhelming your Telegram or Plex API quota.

```js
// Adjust in src/index.js if needed:
const RATE_LIMIT      = 5;    // max requests
const RATE_WINDOW_SEC = 3600; // per hour (in seconds)
```

### 3. Honeypot Field
The request form includes a hidden field invisible to human users. Bots that auto-fill forms will populate it, triggering a silent rejection. No CAPTCHA required for most cases.

### 4. Input Validation
- Email: strict regex + max 254 chars
- Name: min 2, max 100 chars
- All strings sanitized before display

### 5. CORS Origin Lock
Set `ALLOWED_ORIGIN` to your guide page domain to reject form submissions from unknown origins:

```bash
echo "https://yourguide.example.com" | wrangler secret put ALLOWED_ORIGIN
```

### 6. KV Auto-Expiry
All request records expire after **24 hours** automatically. No stale PII sits around.

### 7. No Stored Tokens
Plex tokens and Telegram credentials are never written to KV, logs, or response bodies.

---

## What InvitArr Does NOT Do

- Does not store or log full email addresses in audit trails
- Does not expose an unauthenticated admin interface
- Does not cache or re-use Plex tokens outside of the invite call
- Does not send Plex token to any third-party service
- Does not process requests from unauthorized Telegram users

---

## Optional Hardening

### Add Cloudflare Turnstile (CAPTCHA)

If you're receiving spam despite the honeypot and rate limiting, add [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) — it's free and privacy-friendly.

1. Create a Turnstile widget in the Cloudflare dashboard
2. Add the site key to your guide page HTML
3. Add the secret key: `wrangler secret put TURNSTILE_SECRET`
4. Validate the token in `handleRequest()` before processing

### Restrict Telegram Bot to Your Account

In BotFather, you can disable group privacy mode and ensure the bot only responds to DMs from your account — though InvitArr's `CHAT_ID` check already enforces this at the application level.

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes |
| Older   | ⚠️ Upgrade recommended |

We recommend always running the latest release.
