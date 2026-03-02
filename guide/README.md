# InvitArr — Guide Page

A polished, multi-language onboarding page that walks new users through:

1. Creating a free Plex account
2. Requesting access (embedded form → InvitArr worker)
3. Accepting the invite email
4. Setting up Plex on any device

## Setup

**1. Edit the config block** at the top of `index.html`:

```javascript
const SITE_CONFIG = {
    workerUrl:   'https://YOUR-INVITARR.workers.dev', // ← your deployed worker URL
    ownerName:   'your host',                          // ← shown on the request form
    siteUrl:     'https://yourdomain.com',             // ← your site (optional)
    analyticsId: '',                                   // ← Plausible domain (optional)
};
```

**2. Deploy to Cloudflare Pages:**

```bash
# From the invitarr/guide directory:
npx wrangler pages deploy . --project-name=invitarr-guide
```

Or drag and drop the folder into the Cloudflare Pages dashboard.

**3. Point your worker's `ALLOWED_ORIGIN` secret to your guide page URL:**

```bash
echo "https://your-guide.pages.dev" | wrangler secret put ALLOWED_ORIGIN
```

## Customization

- **Server name & owner name** — set via `SITE_CONFIG` in `index.html`
- **Languages** — English + Spanish included out of the box; add more in the `translations` object
- **OG image** — replace `og-image.png` reference at the top of the file with your own image URL
- **Analytics** — set `analyticsId` to your [Plausible](https://plausible.io) domain, or leave empty to disable

## Features

- ✅ Mobile-friendly, dark-mode design
- ✅ 4-step wizard (Account → Request → Accept → Setup)
- ✅ Embedded access request form (connects to your InvitArr worker)
- ✅ Device setup guides (iOS, Android, TV, Roku, Apple TV, web)
- ✅ FAQ section
- ✅ English + Spanish (i18n-ready)
- ✅ Optional Plausible analytics
- ✅ No personal info — fully generic out of the box
