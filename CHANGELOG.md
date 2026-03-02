# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-03-01

### Security
- `index.js`: Added `escapeHtml()` to sanitize `OWNER_NAME` / `SERVER_NAME` before HTML rendering (XSS prevention)
- `index.js`: `isAuthorizedOwner()` now checks `from.id` only, not `message.chat.id` — tighter and correct
- `guide/index.html`: Added honeypot field to guide request form; includes `website` field in fetch body

### Fixed
- `setup.sh`: Save `BOT_TOKEN` to `SAVED_BOT_TOKEN` before use in webhook curl (was referencing empty var)
- `setup.sh`: Capture `wrangler deploy` output correctly to extract worker URL; fix webhook registration step
- `setup.sh`: Final instructions now reference `guide/README.md` (not the missing `docs/setup.md`)
- `setup.sh`: Echo actual `workerUrl` in final setup summary
- `guide/index.html`: Replace "contact me directly" with "ask whoever invited you" for generic deployments
- `SECURITY.md`: Correct misleading BotFather tip — proper steps for disabling group privacy mode
- `SECURITY.md`: Fix broken GitHub Security Advisory link; remove email placeholder
- `worker/wrangler.toml`: Bump `compatibility_date` from `2024-01-01` to `2025-01-01`

### Added
- `LICENSE`: MIT license (README badge was returning 404)

---

## [1.0.0] - 2026-03-01

### Added

**Worker (`worker/`)**
- Cloudflare Worker handling the full invite flow — form submission, Telegram notification, library picker, Plex invite
- Per-invite library picker: toggle individual libraries from a Telegram inline keyboard before sending
- Owner-only callback validation via `CHAT_ID` allowlist — unauthorized users cannot approve even with the bot token
- KV-backed rate limiting: 5 requests per IP per hour
- Honeypot field for automated bot rejection
- Input validation: email regex, name length limits
- CORS origin lock via `ALLOWED_ORIGIN` secret
- Auto-expiring KV entries (24-hour TTL) — no stale PII stored
- `setup.sh`: guided first-time setup script (KV namespace → secrets → deploy → webhook registration)
- `wrangler.toml`: Cloudflare Workers configuration

**Guide page (`guide/`)**
- `index.html`: templatized onboarding page — zero personal info out of the box
  - `SITE_CONFIG` block for `workerUrl`, `ownerName`, `siteUrl`, and `analyticsId`
  - 4-step wizard: account creation → access request → invite acceptance → device setup
  - Device setup guides: iOS, Android, TV, Roku, Apple TV, web browser
  - FAQ section
  - English + Spanish (i18n-ready translation object)
  - Optional Plausible analytics (disabled when `analyticsId` is empty)
  - Dark mode, mobile-friendly
  - Deploy-to-Cloudflare-Pages ready
- `guide/README.md`: setup and customization instructions

**Documentation**
- `README.md`: full project overview, deploy button, comparison table, security summary, FAQ
- `docs/launch-posts.md`: ready-to-post drafts for r/selfhosted, r/PleX, and r/homelab
- `docs/faq.md`: standalone FAQ document
- `SECURITY.md`: vulnerability reporting policy and security model overview
- `.github/ISSUE_TEMPLATE/bug_report.md`: GitHub issue template
- `LICENSE`: MIT

---

## Roadmap

- [ ] Jellyfin support
- [ ] Invite revoke / expiry flow via Telegram
- [ ] CHANGELOG-driven release tags
- [ ] Contributing guide
- [ ] Multi-server support
