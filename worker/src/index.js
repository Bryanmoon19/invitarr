/**
 * InvitArr — Serverless media server invite management
 * Works with Plex, with Jellyfin/Emby support coming soon.
 *
 * Flow:
 *   1. User fills out the request form → Telegram notification sent to owner
 *   2. Owner taps ✅ → Library picker appears (toggle per library)
 *   3. Owner selects libraries → taps 📤 Send Invite → restricted invite sent
 *   4. ❌ Decline or 🚫 Cancel abort the flow cleanly
 *
 * Required secrets (set via: wrangler secret put <NAME>)
 *   BOT_TOKEN       — Telegram bot token from @BotFather
 *   CHAT_ID         — Your Telegram chat ID (also acts as the owner allowlist)
 *   PLEX_TOKEN      — Your Plex auth token
 *   PLEX_SERVER_ID  — Your Plex server machine identifier
 *   PLEX_LIBRARIES  — Comma-separated "Name:globalSectionId" pairs
 *                     e.g. "Movies:107518710,TV Shows:107518703"
 *
 * Optional secrets:
 *   OWNER_NAME      — Display name shown in the form (default: "your host")
 *   SERVER_NAME     — Your server's display name (default: "Media Server")
 *   ALLOWED_ORIGIN  — Restrict form submissions to your guide domain
 *                     e.g. "https://plex.example.com" (default: * for dev)
 */

// ── HTML request form ─────────────────────────────────────────────────────────

function buildHtmlPage(env) {
    const ownerName  = env.OWNER_NAME  || 'your host';
    const serverName = env.SERVER_NAME || 'Media Server';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Request Access — ${serverName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            padding: 20px;
        }
        .container {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 420px;
            width: 100%;
            border: 1px solid rgba(255,255,255,0.1);
            text-align: center;
        }
        .server-logo {
            width: 80px; height: 80px;
            background: linear-gradient(135deg, #e5a00d 0%, #f5c842 100%);
            border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px; font-size: 36px;
            box-shadow: 0 10px 40px rgba(229, 160, 13, 0.3);
        }
        h1 { font-size: 24px; margin-bottom: 8px; font-weight: 600; }
        .subtitle { color: #888; margin-bottom: 32px; font-size: 15px; }
        .highlight { color: #e5a00d; font-weight: 600; }
        .form-group { margin-bottom: 20px; text-align: left; }
        label { display: block; margin-bottom: 8px; font-size: 14px; color: #aaa; }
        input[type="text"], input[type="email"] {
            width: 100%; padding: 14px 16px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            background: rgba(0,0,0,0.2);
            color: #fff; font-size: 16px; transition: all 0.2s;
        }
        input:focus { outline: none; border-color: #e5a00d; background: rgba(0,0,0,0.3); }
        .hp { display: none; }
        button {
            width: 100%; padding: 16px;
            background: linear-gradient(135deg, #e5a00d 0%, #f5c842 100%);
            border: none; border-radius: 12px;
            color: #1a1a2e; font-size: 16px; font-weight: 600;
            cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(229, 160, 13, 0.4); }
        button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .success { display: none; animation: fadeIn 0.5s; }
        .success-icon {
            width: 70px; height: 70px; background: #22c55e; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px; font-size: 32px;
        }
        .success h2 { margin-bottom: 12px; }
        .success p { color: #888; line-height: 1.6; }
        .error-msg { color: #ef4444; font-size: 14px; margin-top: 8px; display: none; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="formView">
            <div class="server-logo">🎬</div>
            <h1>Request Access</h1>
            <p class="subtitle">
                <span class="highlight">${ownerName}</span> has shared their
                <span class="highlight">${serverName}</span> library with you.
            </p>
            <form id="requestForm">
                <div class="form-group">
                    <label for="name">Your Name</label>
                    <input type="text" id="name" name="name" placeholder="Jane Smith" required autocomplete="name">
                </div>
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="jane@example.com" required autocomplete="email">
                </div>
                <!-- Honeypot — bots fill this, humans don't -->
                <div class="hp" aria-hidden="true">
                    <input type="text" name="website" tabindex="-1" autocomplete="off">
                </div>
                <p class="error-msg" id="errorMsg"></p>
                <button type="submit" id="submitBtn">Request Access</button>
            </form>
        </div>
        <div id="successView" class="success">
            <div class="success-icon">✓</div>
            <h2>Request Sent!</h2>
            <p>${ownerName} has been notified and will send your invitation shortly. Check your email once approved!</p>
        </div>
    </div>
    <script>
        document.getElementById('requestForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn   = document.getElementById('submitBtn');
            const error = document.getElementById('errorMsg');
            btn.disabled = true;
            btn.textContent = 'Sending…';
            error.style.display = 'none';
            try {
                const res = await fetch('/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name:    document.getElementById('name').value.trim(),
                        email:   document.getElementById('email').value.trim(),
                        website: document.querySelector('[name="website"]').value
                    })
                });
                if (res.ok) {
                    document.getElementById('formView').style.display  = 'none';
                    document.getElementById('successView').style.display = 'block';
                } else {
                    const msg = await res.text();
                    throw new Error(msg || 'Request failed');
                }
            } catch (err) {
                error.textContent = 'Something went wrong. Please try again.';
                error.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Request Access';
            }
        });
    </script>
</body>
</html>`;
}

// ── Rate limiter (KV-backed, per IP) ─────────────────────────────────────────

const RATE_LIMIT      = 5;    // max requests
const RATE_WINDOW_SEC = 3600; // per hour

async function checkRateLimit(ip, env) {
    const key = `rl:${ip}`;
    const raw = await env.INVITARR_KV.get(key);
    const count = raw ? parseInt(raw, 10) : 0;
    if (count >= RATE_LIMIT) return false;
    await env.INVITARR_KV.put(key, String(count + 1), { expirationTtl: RATE_WINDOW_SEC });
    return true;
}

// ── KV helpers ────────────────────────────────────────────────────────────────

const REQUEST_TTL = 86400; // 24 hours

async function storeRequest(id, data, env) {
    await env.INVITARR_KV.put(`req:${id}`, JSON.stringify(data), { expirationTtl: REQUEST_TTL });
}

async function getRequest(id, env) {
    const val = await env.INVITARR_KV.get(`req:${id}`);
    return val ? JSON.parse(val) : null;
}

async function deleteRequest(id, env) {
    await env.INVITARR_KV.delete(`req:${id}`);
}

// ── Library helpers ───────────────────────────────────────────────────────────

/**
 * Parse PLEX_LIBRARIES secret into [{name, id}] array.
 * Format: "Movies:107518710,TV Shows:107518703"
 * IDs must be global plex.tv section IDs (not local server keys).
 */
function parseLibraries(env) {
    if (!env.PLEX_LIBRARIES) return [];
    return env.PLEX_LIBRARIES.split(',').map(pair => {
        const idx = pair.lastIndexOf(':');
        return {
            name: pair.substring(0, idx).trim(),
            id:   pair.substring(idx + 1).trim()
        };
    }).filter(l => l.name && l.id);
}

function buildLibraryKeyboard(requestId, libraries, selected) {
    const rows = libraries.map(lib => [{
        text: (selected.includes(lib.id) ? '✅ ' : '☐  ') + lib.name,
        callback_data: `toggle:${requestId}:${lib.id}`
    }]);
    rows.push([
        { text: '📤 Send Invite', callback_data: `confirm:${requestId}` },
        { text: '🚫 Cancel',      callback_data: `cancel:${requestId}`  }
    ]);
    return { inline_keyboard: rows };
}

// ── Telegram helpers ──────────────────────────────────────────────────────────

async function tgCall(method, body, env) {
    const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.json();
}

async function answerCallback(callbackId, text, showAlert, env) {
    await tgCall('answerCallbackQuery', {
        callback_query_id: callbackId,
        text,
        show_alert: showAlert || false
    }, env);
}

// ── CORS helpers ──────────────────────────────────────────────────────────────

function getCorsHeaders(env, request) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';
    const origin = request.headers.get('Origin') || '';

    // If locked to a specific origin, enforce it
    if (allowedOrigin !== '*' && origin !== allowedOrigin) {
        return { 'Access-Control-Allow-Origin': allowedOrigin };
    }

    return {
        'Access-Control-Allow-Origin':  allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

// ── Security: owner-only callback validation ──────────────────────────────────

function isAuthorizedOwner(cb, env) {
    const allowedChatId = String(env.CHAT_ID);
    const fromId  = String(cb.from?.id  || '');
    const chatId  = String(cb.message?.chat?.id || '');
    return fromId === allowedChatId || chatId === allowedChatId;
}

// ── Input validation ──────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateInput(name, email) {
    if (!name || typeof name !== 'string') return 'Name is required.';
    if (name.trim().length < 2)            return 'Name is too short.';
    if (name.trim().length > 100)          return 'Name is too long.';
    if (!email || typeof email !== 'string') return 'Email is required.';
    if (!EMAIL_REGEX.test(email.trim()))   return 'Invalid email address.';
    if (email.trim().length > 254)         return 'Email is too long.';
    return null; // valid
}

// ── Main worker ───────────────────────────────────────────────────────────────

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const corsHeaders = getCorsHeaders(env, request);

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // ── Serve form ────────────────────────────────────────────────────────
        if (url.pathname === '/' || url.pathname === '/index.html') {
            return new Response(buildHtmlPage(env), {
                headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        // ── Form submission ───────────────────────────────────────────────────
        if (url.pathname === '/request' && request.method === 'POST') {
            return handleRequest(request, env, corsHeaders);
        }

        // ── Telegram webhook ──────────────────────────────────────────────────
        if (url.pathname === '/webhook' && request.method === 'POST') {
            return handleWebhook(request, env);
        }

        // ── Health check ──────────────────────────────────────────────────────
        if (url.pathname === '/health') {
            return new Response('OK', { headers: corsHeaders });
        }

        return new Response('Not found', { status: 404, headers: corsHeaders });
    }
};

// ── Form submission handler ───────────────────────────────────────────────────

async function handleRequest(request, env, corsHeaders) {
    try {
        // Rate limit by IP
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const allowed = await checkRateLimit(ip, env);
        if (!allowed) {
            return new Response('Too many requests. Please try again later.', {
                status: 429, headers: corsHeaders
            });
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
        }

        const { name, email, website } = body;

        // Honeypot check — bots fill the hidden field
        if (website && website.trim().length > 0) {
            // Silently accept to not tip off bots, but don't process
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const validationError = validateInput(name, email);
        if (validationError) {
            return new Response(validationError, { status: 400, headers: corsHeaders });
        }

        const cleanName  = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        const requestId = crypto.randomUUID();
        const serverName = env.SERVER_NAME || 'Media Server';

        const keyboard = {
            inline_keyboard: [[
                { text: '✅ Send Invite', callback_data: `invite:${requestId}` },
                { text: '❌ Decline',     callback_data: `decline:${requestId}` }
            ]]
        };

        const tgRes = await tgCall('sendMessage', {
            chat_id: env.CHAT_ID,
            text: `🎬 *New Access Request*\n\n*Name:* ${cleanName}\n*Email:* \`${cleanEmail}\`\n*Server:* ${serverName}`,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: keyboard
        }, env);

        if (!tgRes.ok) {
            console.error('Telegram error:', JSON.stringify(tgRes));
            return new Response('Failed to notify owner.', { status: 500, headers: corsHeaders });
        }

        await storeRequest(requestId, {
            name: cleanName,
            email: cleanEmail,
            timestamp: Date.now(),
            selected: []
        }, env);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Request handler error:', err);
        return new Response('Internal server error', { status: 500, headers: corsHeaders });
    }
}

// ── Webhook handler ───────────────────────────────────────────────────────────

async function handleWebhook(request, env) {
    try {
        const update = await request.json();
        if (!update.callback_query) return new Response('OK');

        const cb = update.callback_query;

        // Security: only the owner can approve/decline
        if (!isAuthorizedOwner(cb, env)) {
            await answerCallback(cb.id, '⛔ Not authorized.', true, env);
            return new Response('OK');
        }

        const parts     = cb.data.split(':');
        const action    = parts[0];
        const requestId = parts[1];
        const extra     = parts[2]; // used by toggle
        const chatId    = cb.message.chat.id;
        const msgId     = cb.message.message_id;
        const serverName = env.SERVER_NAME || 'Media Server';

        // ── Decline ───────────────────────────────────────────────────────────
        if (action === 'decline') {
            const reqData = await getRequest(requestId, env);
            if (!reqData) {
                await answerCallback(cb.id, 'Already handled or expired.', true, env);
                return new Response('OK');
            }
            await deleteRequest(requestId, env);
            await tgCall('editMessageText', {
                chat_id: chatId, message_id: msgId,
                text: `❌ *Declined*\n\n*Name:* ${reqData.name}\n*Email:* \`${reqData.email}\`\n*Server:* ${serverName}`,
                parse_mode: 'Markdown'
            }, env);
            await answerCallback(cb.id, 'Request declined.', false, env);
            return new Response('OK');
        }

        // ── Invite → show library picker ──────────────────────────────────────
        if (action === 'invite') {
            const reqData = await getRequest(requestId, env);
            if (!reqData) {
                await answerCallback(cb.id, 'Already handled or expired.', true, env);
                return new Response('OK');
            }

            const libraries = parseLibraries(env);

            if (libraries.length === 0) {
                // No library config — send full-access invite
                await sendPlexInvite(requestId, reqData, [], env, chatId, msgId, cb.id);
                return new Response('OK');
            }

            await storeRequest(requestId, { ...reqData, selected: [] }, env);

            await tgCall('editMessageText', {
                chat_id: chatId, message_id: msgId,
                text: `📚 *Choose libraries for ${reqData.name}*\n\n` +
                      `Tap to toggle, then tap *Send Invite*.\n` +
                      `_You must select at least one library._`,
                parse_mode: 'Markdown',
                reply_markup: buildLibraryKeyboard(requestId, libraries, [])
            }, env);

            await answerCallback(cb.id, 'Select libraries below.', false, env);
            return new Response('OK');
        }

        // ── Toggle a library ──────────────────────────────────────────────────
        if (action === 'toggle') {
            const sectionId = extra;
            const reqData   = await getRequest(requestId, env);
            if (!reqData) {
                await answerCallback(cb.id, 'Session expired. Start over.', true, env);
                return new Response('OK');
            }

            const selected = reqData.selected || [];
            const idx = selected.indexOf(sectionId);
            if (idx === -1) selected.push(sectionId);
            else            selected.splice(idx, 1);

            await storeRequest(requestId, { ...reqData, selected }, env);

            const libraries = parseLibraries(env);
            await tgCall('editMessageReplyMarkup', {
                chat_id: chatId, message_id: msgId,
                reply_markup: buildLibraryKeyboard(requestId, libraries, selected)
            }, env);

            const lib     = libraries.find(l => l.id === sectionId);
            const libName = lib ? lib.name : sectionId;
            await answerCallback(cb.id,
                selected.includes(sectionId) ? `✅ ${libName} added` : `☐ ${libName} removed`,
                false, env);
            return new Response('OK');
        }

        // ── Confirm → send invite ─────────────────────────────────────────────
        if (action === 'confirm') {
            const reqData = await getRequest(requestId, env);
            if (!reqData) {
                await answerCallback(cb.id, 'Session expired. Start over.', true, env);
                return new Response('OK');
            }
            await sendPlexInvite(requestId, reqData, reqData.selected || [], env, chatId, msgId, cb.id);
            return new Response('OK');
        }

        // ── Cancel ────────────────────────────────────────────────────────────
        if (action === 'cancel') {
            const reqData = await getRequest(requestId, env);
            await deleteRequest(requestId, env);
            const name  = reqData?.name  || 'Unknown';
            const email = reqData?.email || '';
            await tgCall('editMessageText', {
                chat_id: chatId, message_id: msgId,
                text: `🚫 *Cancelled*\n\n*Name:* ${name}\n*Email:* \`${email}\`\n*Server:* ${serverName}`,
                parse_mode: 'Markdown'
            }, env);
            await answerCallback(cb.id, 'Invite cancelled.', false, env);
            return new Response('OK');
        }

    } catch (err) {
        console.error('Webhook handler error:', err);
    }
    return new Response('OK');
}

// ── Plex invite sender ────────────────────────────────────────────────────────

async function sendPlexInvite(requestId, reqData, selectedIds, env, chatId, msgId, callbackId) {
    if (selectedIds.length === 0 && parseLibraries(env).length > 0) {
        await tgCall('answerCallbackQuery', {
            callback_query_id: callbackId,
            text: '⚠️ Select at least one library first.',
            show_alert: true
        }, env);
        return;
    }

    const machineId  = env.PLEX_SERVER_ID || '';
    const serverName = env.SERVER_NAME || 'Media Server';

    const plexBody = {
        server_id: machineId,
        shared_server: {
            library_section_ids: selectedIds.map(id => parseInt(id, 10)),
            invited_email: reqData.email
        },
        sharing_settings: {
            allowSync: '0',
            allowCameraUpload: '0',
            allowChannels: '0',
            filterMovies: {},
            filterTelevision: {},
            filterMusic: {}
        }
    };

    const plexRes = await fetch(`https://plex.tv/api/servers/${machineId}/shared_servers`, {
        method: 'POST',
        headers: {
            'X-Plex-Token':             env.PLEX_TOKEN,
            'X-Plex-Client-Identifier': 'InvitArr',
            'X-Plex-Product':           'InvitArr',
            'Content-Type':             'application/json'
        },
        body: JSON.stringify(plexBody)
    });

    if (plexRes.ok) {
        await deleteRequest(requestId, env);

        const libraries    = parseLibraries(env);
        const libraryList  = selectedIds.length > 0
            ? libraries
                .filter(l => selectedIds.map(String).includes(String(l.id)))
                .map(l => l.name)
                .join(', ')
            : 'All libraries';

        await tgCall('editMessageText', {
            chat_id: chatId, message_id: msgId,
            text: `✅ *Invite Sent*\n\n` +
                  `*Name:* ${reqData.name}\n` +
                  `*Email:* \`${reqData.email}\`\n` +
                  `*Server:* ${serverName}\n` +
                  `*Libraries:* ${libraryList}\n\n` +
                  `They'll receive an email from Plex shortly.`,
            parse_mode: 'Markdown'
        }, env);

        await tgCall('answerCallbackQuery', {
            callback_query_id: callbackId,
            text: '✅ Invite sent!'
        }, env);

    } else {
        const errText = await plexRes.text().catch(() => 'unknown error');
        console.error('Plex API error:', plexRes.status, errText);
        await tgCall('answerCallbackQuery', {
            callback_query_id: callbackId,
            text: `❌ Plex API error (${plexRes.status}). Check Worker logs.`,
            show_alert: true
        }, env);
    }
}
