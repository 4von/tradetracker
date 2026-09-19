import { useState } from 'react';
import { Card } from './ui.jsx';
import { fmtMoney } from '../lib/format.js';

export default function PositionCalculator({ accountBalance, defaultRisk, settings }) {
  const [bal, setBal] = useState(accountBalance || 10000);
  const [riskPct, setRiskPct] = useState(defaultRisk || 1);
  const [symbol, setSymbol] = useState('EURUSD');
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');

  const lotMult = settings.lotSizes[symbol] ?? 1;
  const riskAmount = (bal * riskPct) / 100;
  const stopDist = entry && stop ? Math.abs(Number(entry) - Number(stop)) : 0;
  const unitsPerRisk = stopDist > 0 ? riskAmount / stopDist : 0;
  const lots = lotMult > 0 ? unitsPerRisk / lotMult : 0;

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-ink-900 border border-white/[0.07] text-slate-100 text-xs outline-none focus:border-violet-500/60 transition';

  return (
    <Card title="Position Size Calculator" subtitle="Find your lot size from risk % and stop distance">
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Balance ($)</label>
          <input type="number" value={bal} onChange={(e) => setBal(Number(e.target.value) || 0)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Risk %</label>
          <input type="number" step="0.1" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value) || 0)} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Symbol</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inputCls}>
            {Object.keys(settings.lotSizes).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Entry</label>
          <input type="number" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Stop</label>
          <input type="number" step="any" value={stop} onChange={(e) => setStop(e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
      </div>
      <div className="mt-3 p-3 rounded-xl bg-violet-500/[0.08] ring-1 ring-violet-500/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-violet-300 font-semibold">Suggested Lots</span>
          <span className="text-lg font-bold text-violet-300 tabular-nums">{lots > 0 ? lots.toFixed(3) : '—'}</span>
        </div>
        <div className="text-[10.5px] text-slate-500 mt-1.5 space-y-0.5">
          <div>Risk amount: <span className="text-slate-300 font-semibold">{fmtMoney(riskAmount)}</span></div>
          <div>Units: <span className="text-slate-300 font-semibold">{unitsPerRisk > 0 ? Math.round(unitsPerRisk).toLocaleString() : '—'}</span> (1 lot = {lotMult.toLocaleString()})</div>
        </div>
      </div>
    </Card>
  );
}