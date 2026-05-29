// B002 — Geo currency preselect. Returns USD (primary) or EUR (EU-27 visitors).
// Manual toggle on the page always overrides this (persisted in localStorage).
const EU = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
  'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'
]);

export function onRequest(context) {
  const country = (context.request.cf && context.request.cf.country) || '';
  const currency = EU.has(country) ? 'EUR' : 'USD';
  return new Response(JSON.stringify({ country, currency }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
