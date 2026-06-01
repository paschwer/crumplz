/**
 * Cloudflare Pages Function — POST /api/signup
 * 1. Soumet le contact dans HubSpot Forms API
 * 2. Envoie un email de confirmation via Resend
 *
 * Secrets à configurer dans Cloudflare Pages → Settings → Environment Variables :
 *   RESEND_API_KEY  →  re_xxxxxxxxxxxx  (https://resend.com → free tier)
 */

const HS_PORTAL  = '148579035';
const HS_FORM    = '8ccf77c1-cb56-4376-9f9f-411fa02f36fe';
const FROM_EMAIL = 'Pierre-Alain from crumplz <pa@crumplz.com>';
const BRAND_URL  = 'https://crumplz.com';

// ─── Email HTML ────────────────────────────────────────────────────────────────
function buildEmailHtml(firstname) {
  const name = firstname || 'there';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>You're in — crumplz</title>
<style>
  body{margin:0;padding:0;background:#f6f4f1;font-family:'Helvetica Neue',Arial,sans-serif;color:#16120b}
  .wrap{max-width:540px;margin:40px auto;background:#f6f4f1;border:2px solid #16120b;border-radius:12px;box-shadow:6px 6px 0 #16120b;overflow:hidden}
  .head{background:#16120b;padding:28px 36px;display:flex;align-items:center;gap:12px}
  .head-logo{display:flex;align-items:center;gap:10px}
  .head-logo span{color:#f6f4f1;font-weight:900;font-size:1.25rem;letter-spacing:-.04em}
  .badge{display:inline-block;background:#f95c4b;color:#16120b;font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:5px 11px;border-radius:4px;margin-left:auto}
  .body{padding:36px 36px 28px}
  .confirm-mark{width:48px;height:48px;background:#f95c4b;border:2px solid #16120b;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:20px;box-shadow:3px 3px 0 #16120b}
  h1{font-size:1.55rem;font-weight:900;letter-spacing:-.025em;margin:0 0 6px;line-height:1.1}
  h1 em{font-style:italic;color:#cc3a22;font-weight:400;font-family:Georgia,serif}
  .sub{font-size:.97rem;color:#46413a;line-height:1.7;margin:0 0 28px}
  .divider{border:none;border-top:2px solid rgba(22,18,11,.1);margin:24px 0}
  .section-label{font-size:.72rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#635d50;margin-bottom:10px}
  .what{font-size:.95rem;line-height:1.7;color:#16120b;background:rgba(249,92,75,.08);border-left:3px solid #f95c4b;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px}
  .ask{font-size:.95rem;line-height:1.7;color:#46413a;margin-bottom:28px}
  .ask strong{color:#16120b}
  .reply-btn{display:inline-block;background:#f95c4b;color:#16120b;font-weight:700;font-size:.93rem;padding:13px 24px;border:2px solid #16120b;border-radius:9px;text-decoration:none;box-shadow:4px 4px 0 #16120b;letter-spacing:.01em}
  .foot{background:rgba(22,18,11,.04);border-top:2px solid rgba(22,18,11,.08);padding:20px 36px;font-size:.78rem;color:#635d50;line-height:1.6}
  .foot a{color:#16120b;font-weight:600;text-decoration:none}
  .ps{font-size:.88rem;color:#46413a;margin-top:22px;padding-top:18px;border-top:1px solid rgba(22,18,11,.1)}
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <div class="head-logo">
      <svg width="22" height="26" viewBox="0 0 147 174" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2.566" y="49.257" width="8.179" height="73.526" rx="4.09" transform="rotate(2 2.566 49.257)" fill="#f6f4f1"/>
        <rect x="15.593" y="36.224" width="8.179" height="117.398" rx="4.09" transform="rotate(-2 15.593 36.224)" fill="#f6f4f1"/>
        <rect x="35.371" y="8.874" width="8.179" height="144.509" rx="4.09" transform="rotate(1 35.371 8.874)" fill="#f6f4f1"/>
        <rect x="50.059" y="19.675" width="8.179" height="59.557" rx="4.09" transform="rotate(-1 50.059 19.675)" fill="#f6f4f1"/>
        <rect x="52.44" y="97.682" width="8.179" height="75.205" rx="4.09" transform="rotate(3 52.44 97.682)" fill="#f6f4f1"/>
        <rect x="69.309" y="0" width="8.179" height="70.942" rx="4.09" transform="rotate(4 69.309 0)" fill="#f6f4f1"/>
        <rect x="65.67" y="128.935" width="8.179" height="44.359" rx="4.09" transform="rotate(-3 65.67 128.935)" fill="#f6f4f1"/>
        <path d="M102.666 113.776C105.418 111.024 109.396 110.41 112.76 112.551L142.118 129.679C146.399 132.431 147.318 138.24 144.261 141.91C130.678 158.266 110.561 169.093 86.4167 170.976C85.3119 171.062 84.3637 170.212 84.3057 169.105L81.998 125.068C81.9413 123.987 82.7565 123.063 83.8291 122.919C91.4269 121.895 97.8773 118.564 102.666 113.776ZM84.8943 11.0529C84.971 9.95601 85.9203 9.12463 87.0159 9.21708C110.893 11.2319 130.791 22.0149 144.261 38.2346C147.319 42.2103 146.399 47.7167 142.118 50.469L112.76 67.8997C109.395 69.7346 105.418 69.1238 102.666 66.3713C97.8418 61.5475 91.332 58.1994 83.6608 57.2012C82.5696 57.0592 81.7434 56.1116 81.8202 55.0139L84.8943 11.0529Z" fill="#f6f4f1"/>
      </svg>
      <span>crumplz</span>
    </div>
    <span class="badge">Founding member</span>
  </div>

  <div class="body">
    <div class="confirm-mark">✓</div>
    <h1>You're in, ${name}.<br><em>Spot secured.</em></h1>
    <p class="sub">
      You've just joined the founding cohort. When crumplz launches,
      you'll be the first to get access — before we open to everyone else.
    </p>

    <div class="section-label">What you signed up for</div>
    <div class="what">
      crumplz watches your Meta Ads every 2 hours and texts you the exact move
      when ROAS drifts, CPAs spike, or CTR tanks — before the damage compounds.
    </div>

    <hr class="divider">

    <p class="ask">
      We're heads-down building. No newsletter fluff, no noise.<br>
      <strong>Just a message from me when you can actually use it.</strong>
    </p>
    <p class="ask">
      One thing that helps us ship the right features faster:
      <strong>hit reply and tell me your biggest Meta Ads headache right now.</strong>
      Two sentences max. I read every one.
    </p>

    <a href="mailto:pa@crumplz.co?subject=My Meta Ads headache" class="reply-btn">Hit reply → tell me</a>

    <p class="ps">
      P.S. You're among the first 500. That's the founding cohort —
      we're planning direct access and input on the roadmap for this group specifically.
    </p>
  </div>

  <div class="foot">
    <a href="${BRAND_URL}">crumplz.co</a> &nbsp;·&nbsp;
    Early access waiting list &nbsp;·&nbsp;
    You received this because you signed up at crumplz.co/signup.<br>
    Questions? Reply to this email — it goes straight to me.
  </div>
</div>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders });
  }

  const { firstname = '', lastname = '', email = '', founding = false } = body;
  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Email required' }), { status: 400, headers: corsHeaders });
  }

  const errors = [];

  // ── 1. HubSpot ──────────────────────────────────────────────────────────────
  // BL-021: mark founding leads. `founding_spot` must exist as a HubSpot contact
  // property (single-line text or enum incl. value "reserved") — sent only when the
  // lead arrived via /signup?founding=1 so regular signups are never affected.
  const hsFields = [
    { name: 'firstname', value: firstname },
    { name: 'lastname',  value: lastname  },
    { name: 'email',     value: email     },
  ];
  if (founding === true) {
    hsFields.push({ name: 'founding_spot', value: 'reserved' });
  }
  try {
    const hsRes = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${HS_PORTAL}/${HS_FORM}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: hsFields,
          context: { pageUri: `${BRAND_URL}/signup`, pageName: 'crumplz — Early Access' },
        }),
      }
    );
    if (!hsRes.ok) {
      const err = await hsRes.text();
      errors.push(`HubSpot: ${hsRes.status} — ${err}`);
    }
  } catch (e) {
    errors.push(`HubSpot fetch failed: ${e.message}`);
  }

  // ── 2. Resend confirmation email ────────────────────────────────────────────
  if (env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to:   email,
          subject: `You're in — crumplz early access secured`,
          html: buildEmailHtml(firstname),
        }),
      });
      if (!resendRes.ok) {
        const err = await resendRes.text();
        errors.push(`Resend: ${resendRes.status} — ${err}`);
      }
    } catch (e) {
      errors.push(`Resend fetch failed: ${e.message}`);
    }
  }

  // ── 3. Respond ──────────────────────────────────────────────────────────────
  // Always return ok so the user sees success even if email fails
  // (HubSpot submission is the critical path)
  return new Response(
    JSON.stringify({ ok: true, warnings: errors.length ? errors : undefined }),
    { status: 200, headers: corsHeaders }
  );
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
