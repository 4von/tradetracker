import { uid } from './format.js';
import { PRICE_DECIMALS } from './constants.js';
import { detectSession } from './trade.js';

export function generateDemo() {
  const instruments = [
    { s:'EURUSD',  p:1.0850, m:100000, v:0.0006 },
    { s:'GBPUSD',  p:1.2650, m:100000, v:0.0008 },
    { s:'USDJPY',  p:149.50, m:100000, v:0.30 },
    { s:'AUDUSD',  p:0.6600, m:100000, v:0.0006 },
    { s:'USDCAD',  p:1.3550, m:100000, v:0.0007 },
    { s:'EURJPY',  p:162.20, m:100000, v:0.35 },
    { s:'GBPJPY',  p:189.10, m:100000, v:0.45 },
    { s:'XAUUSD',  p:2350.00, m:100,  v:6.00 },
    { s:'BTCUSD',  p:63200,  m:1,     v:900 },
    { s:'ETHUSD',  p:3120,   m:1,     v:55 },
    { s:'SOLUSD',  p:145.20, m:1,     v:4.5 },
    { s:'XRPUSD',  p:0.5280, m:1,     v:0.018 },
  ];
  const strats = ['Breakout','Liquidity Sweep','Order Block','Fair Value Gap','London Open','NY Open','Trend Continuation','Range Reversal'];
  const tfs = ['5m','15m','30m','1H','4H'];
  const notes = [
    'Clean sweep of Asian high, entered on the reclaim.',
    'Waited for London open confirmation — perfect entry.',
    'FOMO entry, ignored the plan. Cutting this setup.',
    'Order block held perfectly, textbook execution.',
    'News spike stopped me out right before reversal.',
    'Trailed stop too tight on the runner.',
    'FVG fill + trend alignment = A+ setup.',
    'Choppy NY session, should have skipped.',
    'Great R:R — risked 1R, made 3.2R.',
    'Revenge trade after a loss. Avoid next time.',
  ];
  const now = new Date();
  const out = [];
  for (let i = 0; i < 78; i++) {
    const ins = instruments[Math.floor(Math.random() * instruments.length)];
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random() * 100));
    d.setHours([2,5,8,10,13,15,17,19,22][Math.floor(Math.random()*9)], [0,15,30,45][Math.floor(Math.random()*4)], 0, 0);
    if (d > now) d.setDate(d.getDate() - 2);

    const dir = Math.random() > 0.5 ? 'Long' : 'Short';
    const entry = +(ins.p * (1 + (Math.random()-0.5) * 0.02)).toFixed(PRICE_DECIMALS[ins.s]);
    const lots = Math.random() < 0.6 ? 0.1 : Math.random() < 0.85 ? 0.5 : 1;
    const win = Math.random() < 0.54;
    const riskDist = ins.v * (0.8 + Math.random() * 1.4);
    const moveDist = win ? riskDist * (1.2 + Math.random() * 2.2) : -riskDist * (0.6 + Math.random() * 0.5);
    const exit = +(dir === 'Long' ? entry + moveDist : entry - moveDist).toFixed(PRICE_DECIMALS[ins.s]);
    const stopLoss = +(dir === 'Long' ? entry - riskDist : entry + riskDist).toFixed(PRICE_DECIMALS[ins.s]);
    const target = +(dir === 'Long' ? entry + riskDist*2.5 : entry - riskDist*2.5).toFixed(PRICE_DECIMALS[ins.s]);

    const commission = +(lots * 7).toFixed(2);
    const swap = Math.random() < 0.3 ? +(Math.random() * 1.5).toFixed(2) : 0;

    const dtStr = d.toISOString().slice(0,16);
    out.push({
      id: uid(),
      datetime: dtStr,
      symbol: ins.s,
      direction: dir,
      entry, exit, lots, lotMultiplier: ins.m,
      stopLoss, target, commission, swap,
      leverage: 100,
      riskPercent: +(0.5 + Math.random() * 1).toFixed(2),
      session: detectSession(dtStr),
      strategy: strats[Math.floor(Math.random() * strats.length)],
      timeframe: tfs[Math.floor(Math.random() * tfs.length)],
      confidence: 3 + Math.floor(Math.random() * 3),
      tags: [],
      notes: notes[Math.floor(Math.random() * notes.length)],
    });
  }
  return out.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
}