let CURRENCY = '$';

export function setCurrency(c) {
  CURRENCY = c || '$';
}

export const fmtMoney = (n, dec = 2) =>
  CURRENCY + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtSigned = (n, dec = 2) => {
  if (!isFinite(n)) return '∞';
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  return sign + fmtMoney(n, dec);
};

export const fmtNum = (n, dec = 2) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtPct = (n, dec = 2) => `${n >= 0 ? '+' : ''}${n.toFixed(dec)}%`;

export const fmtPrice = (n, sym) => {
  const d = (PRICE_DECIMALS_CACHE[sym] ?? 2);
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};

// small internal lookup to avoid circular import — populated from constants
const PRICE_DECIMALS_CACHE = {};
export function registerPriceDecimals(map) {
  Object.assign(PRICE_DECIMALS_CACHE, map);
}

export const pnlClass = (n) => (n > 0 ? 'text-emerald-400' : n < 0 ? 'text-rose-400' : 'text-slate-400');

export const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const parseDate = (s) => { const d = new Date(s); return isNaN(d) ? null : d; };

export const fmtDate = (s) => {
  const d = parseDate(s);
  return d ? d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
};

export const fmtDateTime = (s) => {
  const d = parseDate(s);
  return d
    ? d.toLocaleString('en-US', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:false })
    : '—';
};

export const localDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36);
export const ser = (o) => JSON.stringify(o, (k,v) => (typeof v === 'function' ? v.toString() : v));