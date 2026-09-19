import { netPnl, rMultiple } from './trade.js';
import { localDateKey, fmtMoney } from './format.js';

export function computeStats(trades, accountBalance) {
  const sorted = trades.slice().sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  const n = sorted.length;
  const total = sorted.reduce((s, t) => s + netPnl(t), 0);
  const totalGross = sorted.reduce((s, t) => s + (netPnl(t) + (Number(t.commission)||0) + (Number(t.swap)||0)), 0);
  const totalCosts = sorted.reduce((s, t) => s + (Number(t.commission)||0) + (Number(t.swap)||0), 0);

  const wins = sorted.filter((t) => netPnl(t) > 0);
  const losses = sorted.filter((t) => netPnl(t) < 0);
  const grossProfit = wins.reduce((s, t) => s + netPnl(t), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + netPnl(t), 0));

  const decided = wins.length + losses.length;
  const winRate = decided ? (wins.length / decided) * 100 : 0;
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const expectancy = n ? total / n : 0;
  const rr = avgLoss ? avgWin / avgLoss : 0;

  const rMults = sorted.map(rMultiple).filter((r) => r !== null && isFinite(r));
  const avgR = rMults.length ? rMults.reduce((a,b)=>a+b,0) / rMults.length : 0;
  const totalR = rMults.reduce((a,b)=>a+b,0);

  let eq = 0, peak = 0, maxDD = 0, maxDDPct = 0;
  const equity = sorted.map((t) => {
    eq += netPnl(t);
    peak = Math.max(peak, eq);
    const dd = peak - eq;
    maxDD = Math.max(maxDD, dd);
    if (accountBalance > 0) maxDDPct = Math.max(maxDDPct, (dd / accountBalance) * 100);
    return { x: t.datetime, y: eq };
  });

  const totalLots = sorted.reduce((s, t) => s + (Number(t.lots)||0), 0);
  const avgLots = n ? totalLots / n : 0;

  const best = n ? sorted.reduce((a,b) => netPnl(b) > netPnl(a) ? b : a) : null;
  const worst = n ? sorted.reduce((a,b) => netPnl(b) < netPnl(a) ? b : a) : null;

  let curStreak = 0, curIsWin = null, maxWinStreak = 0, maxLossStreak = 0, rw = 0, rl = 0;
  sorted.forEach((t) => {
    const w = netPnl(t) >= 0;
    if (w) { rw++; rl = 0; maxWinStreak = Math.max(maxWinStreak, rw); }
    else   { rl++; rw = 0; maxLossStreak = Math.max(maxLossStreak, rl); }
  });
  if (sorted.length) {
    const lastWin = netPnl(sorted[sorted.length-1]) >= 0;
    curIsWin = lastWin;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if ((netPnl(sorted[i]) >= 0) === lastWin) curStreak++;
      else break;
    }
  }

  const longs = sorted.filter((t) => t.direction === 'Long');
  const shorts = sorted.filter((t) => t.direction === 'Short');
  const longStats = { count: longs.length, pnl: longs.reduce((s,t)=>s+netPnl(t),0), win: longs.filter(t=>netPnl(t)>0).length };
  const shortStats = { count: shorts.length, pnl: shorts.reduce((s,t)=>s+netPnl(t),0), win: shorts.filter(t=>netPnl(t)>0).length };

  const totalPct = accountBalance > 0 ? (total / accountBalance) * 100 : 0;

  return {
    sorted, n, total, totalGross, totalCosts, wins, losses, grossProfit, grossLoss,
    winRate, avgWin, avgLoss, profitFactor, expectancy, rr,
    equity, maxDD, maxDDPct, totalLots, avgLots, best, worst,
    curStreak, curIsWin, maxWinStreak, maxLossStreak,
    rMults, avgR, totalR, longStats, shortStats, totalPct,
  };
}

export function groupByPeriod(trades, period) {
  const map = new Map();
  trades.forEach((t) => {
    const d = new Date(t.datetime);
    let key;
    if (period === 'day') key = localDateKey(d);
    else if (period === 'week') {
      const dt = new Date(d);
      dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
      key = localDateKey(dt);
    } else key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!map.has(key)) map.set(key, { pnl: 0, count: 0, wins: 0 });
    const o = map.get(key);
    o.pnl += netPnl(t); o.count++;
    if (netPnl(t) > 0) o.wins++;
  });
  return [...map.entries()].sort((a,b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => ({ key: k, label: k, ...v }));
}

export function groupByField(trades, fn) {
  const map = new Map();
  trades.forEach((t) => {
    const k = fn(t);
    if (k === null || k === undefined || k === '') return;
    if (!map.has(k)) map.set(k, { pnl: 0, count: 0, wins: 0, losses: 0, rSum: 0, rN: 0 });
    const o = map.get(k);
    o.pnl += netPnl(t); o.count++;
    if (netPnl(t) > 0) o.wins++; else if (netPnl(t) < 0) o.losses++;
    const r = rMultiple(t);
    if (r !== null && isFinite(r)) { o.rSum += r; o.rN++; }
  });
  return [...map.entries()].map(([k, v]) => ({ label: k, ...v, avgR: v.rN ? v.rSum/v.rN : 0 }));
}

export function histogram(trades, buckets = 12) {
  if (!trades.length) return [];
  const vals = trades.map(netPnl);
  const min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) return [{ label: fmtMoney(min), count: vals.length, lo: min, hi: max }];
  const size = (max - min) / buckets;
  const out = Array.from({ length: buckets }, (_, i) => ({ lo: min + i*size, hi: min + (i+1)*size, count: 0 }));
  vals.forEach((v) => {
    let idx = Math.floor((v - min) / size);
    if (idx >= buckets) idx = buckets - 1;
    if (idx < 0) idx = 0;
    out[idx].count++;
  });
  return out.map((b) => ({ ...b, label: `${Math.round(b.lo)}` }));
}

export function rHistogram(trades, buckets = 8) {
  const rs = trades.map(rMultiple).filter((r) => r !== null && isFinite(r));
  if (!rs.length) return [];
  const min = Math.min(...rs, -3), max = Math.max(...rs, 3);
  const size = (max - min) / buckets;
  const out = Array.from({ length: buckets }, (_, i) => ({ lo: min + i*size, hi: min + (i+1)*size, count: 0 }));
  rs.forEach((v) => {
    let idx = Math.floor((v - min) / size);
    if (idx >= buckets) idx = buckets - 1;
    if (idx < 0) idx = 0;
    out[idx].count++;
  });
  return out.map((b) => ({ ...b, label: b.lo.toFixed(1) }));
}

export function calendarData(trades, weeks = 13) {
  const byDay = new Map();
  trades.forEach((t) => {
    const k = localDateKey(new Date(t.datetime));
    if (!byDay.has(k)) byDay.set(k, { pnl: 0, count: 0 });
    const o = byDay.get(k);
    o.pnl += netPnl(t); o.count++;
  });

  const today = new Date(); today.setHours(0,0,0,0);
  const end = new Date(today);
  end.setDate(end.getDate() + (7 - ((end.getDay()+6)%7) - 1));
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks*7 - 1));

  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    const k = localDateKey(cur);
    const rec = byDay.get(k) || { pnl: 0, count: 0 };
    days.push({ date: new Date(cur), key: k, ...rec, isFuture: cur > today });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}