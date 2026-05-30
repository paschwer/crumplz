/* crumplz analytics — GA4 (G-229YD1L60G) + Consent Mode v2 (Advanced).
 * Single source of truth. No external CMP dependency.
 * BL-005: consent default = denied (cookieless pings only) until the visitor
 * explicitly accepts. Decline keeps everything denied. Choice persists >= 6 months.
 */
(function () {
  'use strict';

  var GA_ID = 'G-229YD1L60G';
  var STORE_KEY = 'crumplz_consent_v1';
  var TTL_DAYS = 180; // >= 6 months (anti-pattern: storing consent < 6 months)

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  /* 1. Consent DENIED by default, before any tag fires. */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  /* 2. Load gtag.js + config. Runs in denied state => no cookies, cookieless pings. */
  (function () {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  })();
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });

  /* --- persistence --------------------------------------------------------- */
  function readChoice() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.ts || (o.choice !== 'granted' && o.choice !== 'denied')) return null;
      if (Date.now() - o.ts > TTL_DAYS * 86400000) return null; // expired -> ask again
      return o.choice;
    } catch (e) { return null; }
  }
  function saveChoice(choice) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ choice: choice, ts: Date.now() })); } catch (e) {}
  }
  function apply(choice) {
    gtag('consent', 'update', { analytics_storage: choice });
  }

  /* --- i18n (FR/EN by <html lang>) ----------------------------------------- */
  var isFR = (document.documentElement.lang || 'en').toLowerCase().indexOf('fr') === 0;
  var T = isFR ? {
    msg: 'On mesure l’audience du site avec Google Analytics, uniquement si vous l’acceptez. Aucun cookie de mesure n’est déposé avant votre choix.',
    accept: 'Accepter', refuse: 'Refuser', manage: 'Gérer mes cookies',
    aria: 'Consentement aux cookies'
  } : {
    msg: 'We measure site audience with Google Analytics, only if you accept. No analytics cookie is set before your choice.',
    accept: 'Accept', refuse: 'Decline', manage: 'Manage cookies',
    aria: 'Cookie consent'
  };

  /* --- styles -------------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById('cz-consent-css')) return;
    var css = [
      '#cz-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;',
      'background:#16120b;color:#f6f4f1;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.28);',
      'font-family:"Work Sans",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}',
      '#cz-consent .cz-in{max-width:880px;margin:0 auto;padding:16px 18px;display:flex;gap:16px;',
      'align-items:center;flex-wrap:wrap;justify-content:space-between;}',
      '#cz-consent .cz-msg{margin:0;font-size:14px;line-height:1.5;flex:1 1 360px;color:#f6f4f1;}',
      '#cz-consent .cz-act{display:flex;gap:10px;flex:0 0 auto;}',
      '#cz-consent .cz-btn{font:inherit;font-weight:700;font-size:14px;cursor:pointer;border-radius:9px;',
      'padding:10px 18px;border:1.5px solid #f6f4f1;line-height:1;transition:opacity .15s;}',
      '#cz-consent .cz-btn:hover{opacity:.85;}',
      '#cz-consent .cz-refuse{background:transparent;color:#f6f4f1;}',
      '#cz-consent .cz-accept{background:#f95c4b;border-color:#f95c4b;color:#16120b;}',
      '#cz-manage{background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;',
      'cursor:pointer;text-decoration:underline;opacity:.8;}',
      '#cz-manage:hover{opacity:1;}',
      '@media (max-width:520px){#cz-consent .cz-in{flex-direction:column;align-items:stretch;}',
      '#cz-consent .cz-act{justify-content:stretch;}#cz-consent .cz-btn{flex:1;text-align:center;}}'
    ].join('');
    var st = document.createElement('style');
    st.id = 'cz-consent-css';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* --- banner -------------------------------------------------------------- */
  function showBanner() {
    if (document.getElementById('cz-consent')) return;
    injectStyles();
    var wrap = document.createElement('div');
    wrap.id = 'cz-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', T.aria);
    wrap.setAttribute('aria-live', 'polite');
    // Refuse and Accept are the same size/shape (DSA: refuse as visible as accept).
    wrap.innerHTML =
      '<div class="cz-in">' +
        '<p class="cz-msg">' + T.msg + '</p>' +
        '<div class="cz-act">' +
          '<button type="button" class="cz-btn cz-refuse" id="cz-refuse"></button>' +
          '<button type="button" class="cz-btn cz-accept" id="cz-accept"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    document.getElementById('cz-refuse').textContent = T.refuse;
    document.getElementById('cz-accept').textContent = T.accept;
    document.getElementById('cz-accept').addEventListener('click', function () { decide('granted'); });
    document.getElementById('cz-refuse').addEventListener('click', function () { decide('denied'); });
  }
  function hideBanner() {
    var el = document.getElementById('cz-consent');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
  function decide(choice) {
    apply(choice);
    saveChoice(choice);
    hideBanner();
  }

  /* "Manage cookies" entry point. Re-opens the banner so the choice can change. */
  window.czOpenConsent = function () { hideBanner(); showBanner(); };

  /* Inject a discreet "Manage cookies" link into the footer (or body fallback)
   * so the DoD "lien Gérer mes cookies accessible en footer" holds on every page
   * without editing 26 footers by hand. */
  function injectManageLink() {
    if (document.getElementById('cz-manage')) return;
    var btn = document.createElement('button');
    btn.id = 'cz-manage';
    btn.type = 'button';
    btn.textContent = T.manage;
    btn.addEventListener('click', window.czOpenConsent);
    var footer = document.querySelector('footer');
    if (footer) {
      var p = document.createElement('p');
      p.style.cssText = 'margin:12px 0 0;font-size:13px;';
      p.appendChild(btn);
      footer.appendChild(p);
    } else {
      btn.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147482000;font-size:12px;';
      document.body.appendChild(btn);
    }
  }

  /* --- boot ---------------------------------------------------------------- */
  function boot() {
    var prior = readChoice();
    if (prior === 'granted') { apply('granted'); }
    else if (prior === 'denied') { apply('denied'); }
    else { showBanner(); } // no/expired choice -> ask, nothing granted yet
    injectManageLink();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
