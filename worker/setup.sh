#!/usr/bin/env bash
# InvitArr — Guided setup script
# Run this once to configure secrets and deploy your worker.

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  InvitArr — Setup${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Check dependencies ────────────────────────────────────────────────────────

if ! command -v wrangler &>/dev/null; then
    echo -e "${RED}✗ wrangler not found.${NC}"
    echo "  Install it with: npm install -g wrangler"
    exit 1
fi

if ! wrangler whoami &>/dev/null; then
    echo -e "${YELLOW}⚠ Not logged into Cloudflare.${NC}"
    echo "  Running: wrangler login"
    wrangler login
fi

echo -e "${GREEN}✓ wrangler ready${NC}"
echo ""

# ── Create KV namespace ───────────────────────────────────────────────────────

echo -e "${BOLD}Step 1: Create KV Namespace${NC}"
echo "Creating KV namespace 'invitarr'..."
KV_OUTPUT=$(wrangler kv namespace create invitarr 2>&1)
KV_ID=$(echo "$KV_OUTPUT" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$KV_ID" ]; then
    echo -e "${YELLOW}Could not auto-extract KV ID. Output was:${NC}"
    echo "$KV_OUTPUT"
    echo ""
    read -rp "Paste your KV namespace ID here: " KV_ID
fi

# Update wrangler.toml with the real KV ID
sed -i.bak "s/REPLACE_WITH_YOUR_KV_NAMESPACE_ID/$KV_ID/" wrangler.toml
rm -f wrangler.toml.bak
echo -e "${GREEN}✓ KV namespace configured (ID: $KV_ID)${NC}"
echo ""

# ── Secrets ───────────────────────────────────────────────────────────────────

echo -e "${BOLD}Step 2: Configure Secrets${NC}"
echo "Each secret is stored encrypted in Cloudflare — never in your code or files."
echo ""

prompt_secret() {
    local name="$1"
    local desc="$2"
    local hint="$3"
    echo -e "${BOLD}$name${NC} — $desc"
    [ -n "$hint" ] && echo -e "  ${YELLOW}Hint: $hint${NC}"
    read -rsp "  Enter value: " SECRET_VALUE
    echo ""
    echo "$SECRET_VALUE" | wrangler secret put "$name"
    echo -e "  ${GREEN}✓ $name saved${NC}"
    echo ""
}

prompt_secret "BOT_TOKEN" \
    "Telegram bot token from @BotFather" \
    "Message @BotFather on Telegram → /newbot → copy the token"

prompt_secret "CHAT_ID" \
    "Your Telegram chat ID (also acts as the security allowlist)" \
    "Message @userinfobot on Telegram to get your ID"

prompt_secret "PLEX_TOKEN" \
    "Your Plex auth token" \
    "See: https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/"

prompt_secret "PLEX_SERVER_ID" \
    "Your Plex server machine identifier" \
    "Found in Plex Web → Settings → Remote Access, or via plex.tv API"

prompt_secret "PLEX_LIBRARIES" \
    "Comma-separated library pairs: Name:GlobalSectionId" \
    "e.g. Movies:107518710,TV Shows:107518703  (use global IDs from plex.tv, not local keys)"

echo -e "${BOLD}Optional secrets (press Enter to skip):${NC}"
echo ""

prompt_optional_secret() {
    local name="$1"
    local desc="$2"
    local default="$3"
    echo -e "${BOLD}$name${NC} — $desc (default: $default)"
    read -rsp "  Enter value (or Enter to skip): " SECRET_VALUE
    echo ""
    if [ -n "$SECRET_VALUE" ]; then
        echo "$SECRET_VALUE" | wrangler secret put "$name"
        echo -e "  ${GREEN}✓ $name saved${NC}"
    else
        echo -e "  Skipped (using default: $default)"
    fi
    echo ""
}

prompt_optional_secret "OWNER_NAME" "Your display name shown on the request form" "your host"
prompt_optional_secret "SERVER_NAME" "Your server's display name" "Media Server"
prompt_optional_secret "ALLOWED_ORIGIN" "Restrict form submissions to your guide page domain" "*"

# ── Register webhook ──────────────────────────────────────────────────────────

echo -e "${BOLD}Step 3: Deploy${NC}"
wrangler deploy
echo ""

WORKER_URL=$(wrangler deploy --dry-run 2>&1 | grep "https://" | head -1 | awk '{print $NF}' || echo "")

echo -e "${BOLD}Step 4: Register Telegram Webhook${NC}"
if [ -n "$WORKER_URL" ]; then
    echo "Setting webhook to: ${WORKER_URL}/webhook"
    curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WORKER_URL}/webhook" | python3 -m json.tool 2>/dev/null || true
else
    echo -e "${YELLOW}⚠ Could not auto-detect worker URL.${NC}"
    read -rp "Enter your deployed worker URL (e.g. https://invitarr.yourname.workers.dev): " WORKER_URL
    echo "Registering webhook..."
    BOT_TOKEN_VAL=$(cat ~/.wrangler/state/secrets/BOT_TOKEN 2>/dev/null || echo "")
    if [ -n "$BOT_TOKEN_VAL" ]; then
        curl -s "https://api.telegram.org/bot${BOT_TOKEN_VAL}/setWebhook?url=${WORKER_URL}/webhook"
    else
        echo ""
        echo -e "${YELLOW}Register the webhook manually:${NC}"
        echo "  curl 'https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=${WORKER_URL}/webhook'"
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ InvitArr is live!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Request form:  ${WORKER_URL}/"
echo "  Webhook:       ${WORKER_URL}/webhook"
echo "  Health check:  ${WORKER_URL}/health"
echo ""
echo "  Next: update your guide page to point to this worker URL."
echo "  See: docs/setup.md"
echo ""
