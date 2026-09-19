import { useMemo } from 'react';
import { Card, StatCard, ChartBox } from '../ui.jsx';
import { SESSIONS, DOW_LABELS } from '../../lib/constants.js';
import { groupByField, histogram, rHistogram } from '../../lib/analytics.js';
import { netPnl } from '../../lib/trade.js';
import { fmtMoney, fmtSigned, fmtNum, fmtDate, pnlClass } from '../../lib/format.js';

export default function Analytics({ trades, stats }) {
  const gridColor = 'rgba(148,163,184,0.07)';
  const tickColor = '#64748b';

  const baseOpts = (horizontal = false) => ({
    responsive: true, maintainAspectRatio: false, indexAxis: horizontal ? 'y' : 'x',
    plugins: { legend: { display: false },
      tooltip: { backgroundColor: '#0e1729', borderColor: 'rgba(148,163,184,0.15)', borderWidth: 1,
        titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 10, cornerRadius: 10, displayColors: false } },
    scales: {
      x: { grid: { color: horizontal ? gridColor : 'transparent', drawTicks: false }, ticks: { color: tickColor, font: { size: 10 } }, border: { display: false } },
      y: { grid: { color: horizontal ? 'transparent' : gridColor, drawTicks: false }, ticks: { color: tickColor, font: { size: 10 }, callback: (v) => fmtMoney(v, 0) }, border: { display: false } },
    },
  });

  const strategyData = useMemo(() => groupByField(trades, (t) => t.strategy).sort((a, b) => b.pnl - a.pnl), [trades]);
  const sessionData = useMemo(() => {
    const raw = groupByField(trades, (t) => t.session);
    return SESSIONS.map((s) => raw.find((r) => r.label === s) || { label: s, pnl: 0, count: 0, wins: 0, losses: 0, avgR: 0 });
  }, [trades]);
  const dowData = useMemo(() => {
    const raw = groupByField(trades, (t) => DOW_LABELS[(new Date(t.datetime).getDay() + 6) % 7]);
    return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => raw.find((r) => r.label === d) || { label: d, pnl: 0, count: 0, wins: 0, losses: 0, avgR: 0 });
  }, [trades]);
  const symbolData = useMemo(() => groupByField(trades, (t) => t.symbol).sort((a, b) => b.pnl - a.pnl), [trades]);
  const hist = useMemo(() => histogram(trades, 12), [trades]);
  const rHist = useMemo(() => rHistogram(trades, 8), [trades]);

  const strategyConfig = useMemo(() => ({
    type: 'bar',
    data: { labels: strategyData.map((d) => d.label),
      datasets: [{ data: strategyData.map((d) => d.pnl),
        backgroundColor: strategyData.map((d) => (d.pnl >= 0 ? 'rgba(56,189,248,0.75)' : 'rgba(244,63,94,0.75)')),
        hoverBackgroundColor: strategyData.map((d) => (d.pnl >= 0 ? '#38bdf8' : '#f43f5e')),
        borderRadius: 6, borderSkipped: false, maxBarThickness: 26 }] },
    options: { ...baseOpts(true),
      plugins: { ...baseOpts(true).plugins,
        tooltip: { ...baseOpts(true).plugins.tooltip,
          callbacks: { label: (c) => `${fmtSigned(c.parsed.x)} · ${strategyData[c.dataIndex].count} trades · Ø ${strategyData[c.dataIndex].avgR.toFixed(2)}R` } } },
      scales: {
        x: { grid: { color: gridColor, drawTicks: false }, ticks: { color: tickColor, font: { size: 10 }, callback: (v) => fmtMoney(v, 0) }, border: { display: false } },
        y: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 10.5 } }, border: { display: false } },
      } },
  }), [strategyData]);

  const sessionConfig = useMemo(() => ({
    type: 'bar',
    data: { labels: sessionData.map((d) => d.label),
      datasets: [{ data: sessionData.map((d) => d.pnl),
        backgroundColor: sessionData.map((d) => (d.pnl >= 0 ? 'rgba(167,139,250,0.75)' : 'rgba(244,63,94,0.75)')),
        hoverBackgroundColor: sessionData.map((d) => (d.pnl >= 0 ? '#a78bfa' : '#f43f5e')),
        borderRadius: 6, borderSkipped: false, maxBarThickness: 40 }] },
    options: { ...baseOpts(),
      plugins: { ...baseOpts().plugins,
        tooltip: { ...baseOpts().plugins.tooltip,
          callbacks: { label: (c) => `${fmtSigned(c.parsed.y)} · ${sessionData[c.dataIndex].count} trades · Ø ${sessionData[c.dataIndex].avgR.toFixed(2)}R` } } } },
  }), [sessionData]);

  const dowConfig = useMemo(() => ({
    type: 'bar',
    data: { labels: dowData.map((d) => d.label),
      datasets: [{ data: dowData.map((d) => d.pnl),
        backgroundColor: dowData.map((d) => (d.pnl >= 0 ? 'rgba(16,185,129,0.75)' : 'rgba(244,63,94,0.75)')),
        hoverBackgroundColor: dowData.map((d) => (d.pnl >= 0 ? '#10b981' : '#f43f5e')),
        borderRadius: 6, borderSkipped: false, maxBarThickness: 40 }] },
    options: { ...baseOpts(),
      plugins: { ...baseOpts().plugins,
        tooltip: { ...baseOpts().plugins.tooltip,
          callbacks: { label: (c) => `${fmtSigned(c.parsed.y)} · ${dowData[c.dataIndex].count} trades` } } } },
  }), [dowData]);

  const symbolConfig = useMemo(() => ({
    type: 'bar',
    data: { labels: symbolData.map((d) => d.label),
      datasets: [{ data: symbolData.map((d) => d.pnl),
        backgroundColor: symbolData.map((d) => (d.pnl >= 0 ? 'rgba(34,211,238,0.75)' : 'rgba(244,63,94,0.75)')),
        hoverBackgroundColor: symbolData.map((d) => (d.pnl >= 0 ? '#22d3ee' : '#f43f5e')),
        borderRadius: 6, borderSkipped: false, maxBarThickness: 26 }] },
    options: { ...baseOpts(true),
      plugins: { ...baseOpts(true).plugins,
        tooltip: { ...baseOpts(true).plugins.tooltip,
          callbacks: { label: (c) => `${fmtSigned(c.parsed.x)} · ${symbolData[c.dataIndex].count} trades` } } },
      scales: {
        x: { grid: { color: gridColor, drawTicks: false }, ticks: { color: tickColor, font: { size: 10 }, callback: (v) => fmtMoney(v, 0) }, border: { display: false } },
        y: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 10.5 } }, border: { display: false } },
      } },
  }), [symbolData]);

  const histConfig = useMemo(() => ({
    type: 'bar',
    data: { labels: hist.map((h) => h.label),
      datasets: [{ data: hist.map((h) => h.count),
        backgroundColor: hist.map((h) => (h.hi <= 0 ? 'rgba(244,63,94,0.7)' : h.lo >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(148,163,184,0.5)')),
        hoverBackgroundColor: hist.map((h) => (h.hi <= 0 ? '#f43f5e' : h.lo >= 0 ? '#10b981' : '#94a3b8')),
        borderRadius: 5, borderSkipped: false, maxBarThickness: 44 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { backgroundColor: '#0e1729', borderColor: 'rgba(148,163,184,0.15)', borderWidth: 1,
          titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 10, cornerRadius: 10, displayColors: false,
          callbacks: { title: (items) => { const h = hist[items[0].dataIndex]; return h ? `${fmtMoney(h.lo, 0)} → ${fmtMoney(h.hi, 0)}` : ''; },
            label: (c) => `${c.parsed.y} trades` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 } }, border: { display: false } },
        y: { grid: { color: gridColor, drawTicks: false }, ticks: { color: tickColor, font: { size: 10 }, precision: 0 }, border: { display: false } },
      } },
  }), [hist]);

  const rConfig = useMemo(() => ({
    type: 'bar',
    data: { labels: rHist.map((h) => h.label),
      datasets: [{ data: rHist.map((h) => h.count),
        backgroundColor: rHist.map((h) => (h.hi <= 0 ? 'rgba(244,63,94,0.7)' : h.lo >= 0 ? 'rgba(167,139,250,0.75)' : 'rgba(148,163,184,0.5)')),
        hoverBackgroundColor: rHist.map((h) => (h.hi <= 0 ? '#f43f5e' : h.lo >= 0 ? '#a78bfa' : '#94a3b8')),
        borderRadius: 5, borderSkipped: false, maxBarThickness: 44 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { backgroundColor: '#0e1729', borderColor: 'rgba(148,163,184,0.15)', borderWidth: 1,
          titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 10, cornerRadius: 10, displayColors: false,
          callbacks: { title: (items) => { const h = rHist[items[0].dataIndex]; return h ? `${h.lo.toFixed(2)}R → ${h.hi.toFixed(2)}R` : ''; },
            label: (c) => `${c.parsed.y} trades` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 } }, border: { display: false } },
        y: { grid: { color: gridColor, drawTicks: false }, ticks: { color: tickColor, font: { size: 10 }, precision: 0 }, border: { display: false } },
      } },
  }), [rHist]);

  const lastN = stats.sorted.slice(-40);
  const bestStrategy = strategyData.length ? strategyData[0] : null;
  const worstStrategy = strategyData.length ? strategyData[strategyData.length - 1] : null;
  const bestSession = [...sessionData].filter(s => s.count > 0).sort((a,b) => b.pnl - a.pnl)[0];

  return (
    <div className="fade-in space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Best Strategy" value={bestStrategy ? bestStrategy.label : '—'} tone="up"
          sub={bestStrategy ? `${fmtSigned(bestStrategy.pnl)} · ${bestStrategy.count} trades · Ø ${bestStrategy.avgR.toFixed(2)}R` : ''} />
        <StatCard label="Weakest Strategy" value={worstStrategy ? worstStrategy.label : '—'} tone="down"
          sub={worstStrategy ? `${fmtSigned(worstStrategy.pnl)} · ${worstStrategy.count} trades` : ''} />
        <StatCard label="Best Session" value={bestSession ? bestSession.label : '—'} tone="up"
          sub={bestSession ? `${fmtSigned(bestSession.pnl)} · ${bestSession.count} trades` : ''} />
        <StatCard label="Total R Gained" value={`${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(1)}R`}
          tone={stats.totalR > 0 ? 'up' : 'down'} sub={`${stats.rMults.length} trades with R data`} />
      </div>

      <Card title="Strategy Performance" subtitle="Net P&L by setup — which edge actually pays">
        <ChartBox config={strategyConfig} height={Math.max(220, strategyData.length * 44)} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Session Performance" subtitle="Asian · London · NY — when you make money">
          <ChartBox config={sessionConfig} height={250} />
        </Card>
        <Card title="Day-of-Week Performance" subtitle="Where your week makes or loses money">
          <ChartBox config={dowConfig} height={250} />
        </Card>
      </div>

      <Card title="Instrument Performance" subtitle="Best & worst symbols">
        <ChartBox config={symbolConfig} height={Math.max(220, symbolData.length * 32)} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="P&L Distribution" subtitle="Frequency of net outcomes">
          <ChartBox config={histConfig} height={250} />
        </Card>
        <Card title="R-Multiple Distribution" subtitle="Are your wins bigger than your losses?">
          <ChartBox config={rConfig} height={250} />
        </Card>
      </div>

      <Card title="Long vs Short Edge" subtitle="Directional bias performance">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[['Long', stats.longStats, 'emerald'], ['Short', stats.shortStats, 'rose']].map(([label, s, color]) => (
            <div key={label} className={`rounded-xl p-4 ring-1 ${color === 'emerald' ? 'bg-emerald-500/[0.06] ring-emerald-500/20' : 'bg-rose-500/[0.06] ring-rose-500/20'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${color === 'emerald' ? 'text-emerald-400' : 'text-rose-400'}`}>{label}</span>
                <span className={`text-lg font-bold tabular-nums ${pnlClass(s.pnl)}`}>{fmtSigned(s.pnl)}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div><div className="text-[10px] uppercase text-slate-500 font-semibold">Trades</div>
                  <div className="text-sm font-bold text-slate-200 tabular-nums mt-0.5">{s.count}</div></div>
                <div><div className="text-[10px] uppercase text-slate-500 font-semibold">Wins</div>
                  <div className="text-sm font-bold text-slate-200 tabular-nums mt-0.5">{s.win}</div></div>
                <div><div className="text-[10px] uppercase text-slate-500 font-semibold">Win %</div>
                  <div className="text-sm font-bold text-slate-200 tabular-nums mt-0.5">{s.count ? ((s.win / s.count)*100).toFixed(0) : 0}%</div></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Win / Loss Streak Tracker" subtitle={`Last ${lastN.length} trades (oldest → newest)`}>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {lastN.map((t) => {
            const p = netPnl(t);
            return (
              <div key={t.id} title={`${t.symbol} · ${fmtSigned(p)} · ${fmtDate(t.datetime)}`}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-[9px] font-bold cursor-default transition hover:scale-110 ${
                  p > 0 ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/30'
                  : p < 0 ? 'bg-rose-500/25 text-rose-300 ring-1 ring-rose-500/30'
                  : 'bg-slate-600/25 text-slate-400 ring-1 ring-slate-500/30'}`}>
                {p > 0 ? 'W' : p < 0 ? 'L' : '—'}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Current Streak', `${stats.curStreak} ${stats.curIsWin ? 'Wins' : 'Losses'}`, stats.curIsWin ? 'up' : 'down'],
            ['Max Win Streak', `${stats.maxWinStreak}`, 'up'],
            ['Max Loss Streak', `${stats.maxLossStreak}`, 'down'],
            ['Total Trades', `${stats.n}`, 'neutral'],
          ].map(([l, v, tone]) => (
            <div key={l} className="rounded-xl bg-ink-800/60 p-3.5 ring-1 ring-white/[0.05]">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{l}</div>
              <div className={`text-lg font-bold mt-1 tabular-nums ${
                tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-rose-400' : 'text-slate-200'}`}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Key Ratios" subtitle="The math that matters">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          {[
            ['Win Rate', `${stats.winRate.toFixed(2)}%`],
            ['Profit Factor', isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'],
            ['Realised R:R', `1 : ${stats.rr.toFixed(2)}`],
            ['Expectancy / trade', fmtSigned(stats.expectancy)],
            ['Average R per trade', `${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`],
            ['Total R', `${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(1)}R`],
            ['Gross Profit', fmtMoney(stats.grossProfit)],
            ['Gross Loss', fmtMoney(stats.grossLoss)],
            ['Total Costs', fmtMoney(stats.totalCosts)],
            ['Max Drawdown', fmtMoney(stats.maxDD)],
            ['Total Lots Traded', fmtNum(stats.totalLots, 2)],
            ['Average Lot Size', fmtNum(stats.avgLots, 3)],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-xs text-slate-500">{k}</span>
              <span className="text-sm font-semibold text-slate-200 tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}