import { parseDate } from './format.js';

export function detectSession(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '';
  const h = d.getHours();
  if (h >= 0  && h < 7)  return 'Asian';
  if (h >= 7  && h < 12) return 'London';
  if (h >= 12 && h < 16) return 'NY Overlap';
  if (h >= 16 && h < 21) return 'New York';
  return 'Sydney';
}

export function unitsOf(t) {
  return (Number(t.lots) || 0) * (Number(t.lotMultiplier) || 0);
}

export function grossPnl(t) {
  const u = unitsOf(t);
  const e = Number(t.entry) || 0;
  const x = Number(t.exit) || 0;
  return (t.direction === 'Long' ? (x - e) : (e - x)) * u;
}

export function netPnl(t) {
  return grossPnl(t) - (Number(t.commission) || 0) - (Number(t.swap) || 0);
}

export function rMultiple(t) {
  const e = Number(t.entry) || 0;
  const sl = Number(t.stopLoss) || 0;
  if (!sl || !e) return null;
  const riskAmount = Math.abs(e - sl) * unitsOf(t) + (Number(t.commission) || 0);
  if (riskAmount <= 0) return null;
  return netPnl(t) / riskAmount;
}

export function plannedRR(t) {
  const e = Number(t.entry) || 0;
  const sl = Number(t.stopLoss) || 0;
  const tp = Number(t.target) || 0;
  if (!e || !sl || !tp) return null;
  const risk = Math.abs(e - sl);
  const reward = Math.abs(tp - e);
  if (risk <= 0) return null;
  return reward / risk;
}