# FAQ

## Is this official? Is it affiliated with Plex?

No. InvitArr is an independent open-source project. "Works with Plex" — not made by Plex.

## Is it really free?

Yes. It runs on Cloudflare's free tier:
- Workers: 100,000 requests/day free
- KV: 100,000 reads/day, 1,000 writes/day free

Unless you're running a massive operation, you'll never hit the limits.

## How do I find my Plex token?

See the [official Plex guide](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/).

## Why do I need global section IDs, not local keys?

The Plex API endpoint for sharing (`/api/servers/{id}/shared_servers`) requires the global plex.tv section IDs (large numbers like `107518710`), not the local server keys (small numbers like `1`, `2`, `3`). Using local keys results in the invite being sent with full library access regardless of selection.

## What happens if someone submits the form multiple times?

Rate limiting blocks more than 5 submissions per IP per hour. Honeypot detection silently drops bot submissions. Each submission still creates a unique request that you review in Telegram.

## Can multiple people approve invites?

Not yet — currently only one `CHAT_ID` is supported. Multi-admin support is on the roadmap.

## What if the request expires?

KV entries auto-expire after 24 hours. If you try to act on an expired request, you'll see an "Already handled or expired" message in Telegram. The user would need to submit a new request.

## Does InvitArr work with Jellyfin or Emby?

Not yet — Plex only for now. Jellyfin and Emby support are on the roadmap.

## Is my Plex token safe?

Your token is stored as an encrypted Cloudflare secret — it never appears in your code, logs, or KV store. It's only used to make the invite API call to plex.tv. See [SECURITY.md](../SECURITY.md) for the full picture.
