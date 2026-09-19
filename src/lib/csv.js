import { uid, nowLocal } from './format.js';
import { DEFAULT_LOT_SIZES } from './constants.js';

export const CSV_HEADERS = ['datetime','symbol','direction','entry','exit','lots','lotMultiplier','stopLoss','target','commission','swap','leverage','riskPercent','session','strategy','timeframe','confidence','tags','notes'];

export function toCSV(trades) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const lines = [CSV_HEADERS.join(',')];
  trades.forEach((t) => lines.push(CSV_HEADERS.map((h) => esc(Array.isArray(t[h]) ? t[h].join('|') : t[h])).join(',')));
  return lines.join('\n');
}

function parseCSVLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') { if (line[i+1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export function fromCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const o = {}; headers.forEach((h, idx) => (o[h] = (cells[idx] ?? '').trim()));
    if (!o.symbol && !o.datetime) continue;
    const sym = (o.symbol || '').toUpperCase();
    rows.push({
      id: uid(),
      datetime: o.datetime || nowLocal(),
      symbol: sym,
      direction: o.direction === 'Short' || o.direction === 'Sell' ? 'Short' : 'Long',
      entry: Number(o.entry) || 0,
      exit: Number(o.exit) || 0,
      lots: Number(o.lots) || 0.1,
      lotMultiplier: Number(o.lotMultiplier) || DEFAULT_LOT_SIZES[sym] || 1,
      stopLoss: Number(o.stopLoss) || 0,
      target: Number(o.target) || 0,
      commission: Number(o.commission) || 0,
      swap: Number(o.swap) || 0,
      leverage: Number(o.leverage) || 100,
      riskPercent: Number(o.riskPercent) || 0,
      session: o.session || '',
      strategy: o.strategy || '',
      timeframe: o.timeframe || '',
      confidence: Number(o.confidence) || 3,
      tags: o.tags ? o.tags.split('|').filter(Boolean) : [],
      notes: o.notes || '',
    });
  }
  return rows;
}