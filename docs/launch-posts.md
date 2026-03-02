# InvitArr — Launch Post Drafts

## r/selfhosted

**Title:** I built a serverless Plex invite manager with Telegram approval and per-user library control. No Docker required.

---

Been running a Plex server for a few years and the invite process always annoyed me — either you share everything to everyone, or you dig through plex.tv settings per person. And explaining Plex to non-technical friends is its own adventure.

I built **InvitArr** to fix both problems.

**How it works:**

1. Friend visits your guide page, fills out a request form
2. You get a **Telegram notification** with Invite / Decline buttons
3. Tap Invite → a **library picker** appears — toggle exactly which libraries they get access to
4. Tap Send → invite sent with **only** those libraries. Nothing else.

**The tech:**

- Cloudflare Worker + KV — no server, no Docker, no VPS
- Runs on the **free tier** — 100k requests/day is more than enough
- Telegram bot for approvals (works from your phone, no dashboard to open)

**Security I actually thought about:**

- Telegram `CHAT_ID` allowlist — even if someone got your bot token, they can't approve invites without your Telegram user ID
- Rate limiting (5 req/IP/hour), honeypot field, input validation
- KV auto-expires after 24h — no stale PII sitting around
- CORS origin lock, zero secrets stored in code

Also includes a polished **onboarding guide page** (English + Spanish) you can deploy on Cloudflare Pages — walks new users through account creation, accepting the invite, and setting up Plex on any device.

Setup takes about 5 minutes with the included `setup.sh` script.

GitHub: https://github.com/Bryanmoon19/invitarr

Happy to answer questions. Would love feedback on what features to prioritize next (Jellyfin support is first on the list).

---

## r/PleX

**Title:** Tired of explaining Plex to friends? I made a free setup guide + Telegram-based invite manager.

---

Two pain points I kept running into:

1. **The invite process** — by default you either share everything or go through plex.tv settings manually per person. No easy middle ground.

2. **The onboarding** — every time someone new joins my server I end up on the phone for 30 minutes explaining what Plex is, where to find my content, why there's free ad-supported stuff showing up, etc.

**What I built:**

**InvitArr** — a two-part system:

**Part 1 — Guide page** (Cloudflare Pages, free)
A polished onboarding page with a 4-step wizard: account creation → access request → accepting the invite → device setup. Has a FAQ that answers every question I've been asked repeatedly. English + Spanish. Mobile-friendly.

**Part 2 — Invite worker** (Cloudflare Worker, free)
When someone submits the request form, you get a Telegram message. Tap ✅ → a library picker appears where you toggle exactly which libraries they get. Tap Send → done. No logging into plex.tv, no fumbling with settings.

The whole thing runs serverless on Cloudflare's free tier. No Docker, no VPS.

GitHub: https://github.com/Bryanmoon19/invitarr — includes a guided setup script, full docs, and SECURITY.md.

---

## r/homelab

**Title:** InvitArr — zero-infrastructure Plex invite manager. Cloudflare Workers + Telegram, free tier, no Docker.

---

Built this for my homelab setup and figured the community might find it useful.

**Problem:** Plex invite management is annoying. No granular per-user library control without manually editing through plex.tv. Wanted something I could approve from my phone without opening a dashboard.

**Solution:** Cloudflare Worker + KV + Telegram bot.

- User submits a form → Telegram notification
- I tap approve → **library picker** in Telegram (toggle per library)
- Tap send → restricted invite with only selected libraries

**Infrastructure:** Literally nothing. No VPS, no container, no port forwarding. Worker handles everything, KV stores pending requests (auto-expires 24h). Runs on CF free tier.

**Security highlights:**
- CHAT_ID allowlist on every callback — unauthorized users can't approve even with the bot token
- KV-backed rate limiting, honeypot, input validation
- CORS origin lock
- All secrets stored as Cloudflare secrets, never in code

Also comes with an onboarding guide page you can deploy on Cloudflare Pages — for the non-technical family members who need handholding through setup.

https://github.com/Bryanmoon19/invitarr

MIT licensed. Jellyfin support is next on the roadmap. PRs welcome.
