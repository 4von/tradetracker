import { useState, useMemo, useCallback } from 'react';
import { Card, StatCard, ChartBox } from '../ui.jsx';
import CalendarHeatmap from '../CalendarHeatmap.jsx';
import { groupByPeriod } from '../../lib/analytics.js';
import { netPnl, grossPnl, rMultiple } from '../../lib/trade.js';
import { fmtMoney, fmtSigned, fmtNum, fmtDate, fmtDateTime, fmtPrice, pnlClass } from '../../lib/format.js';

export default function Dashboard({ trades, stats, setPage, accountBalance }) {
  const [period, setPeriod] = useState('day');
  const [showNet, setShowNet] = useState(true);
  const trend = useMemo(() => groupByPeriod(trades, period), [trades, period]);
  const gridColor = 'rgba(148,163,184,0.07)';
  const tickColor = '#64748b';

  const pnlFor = useCallback((t) => showNet ? netPnl(t) : grossPnl(t), [showNet]);

  const equityConfig = useMemo(() => {
    let eq = 0;
    const pts = stats.sorted.map((t) => { eq += pnlFor(t); return eq; });
    return {
      type: 'line',
      data: {
        labels: stats.sorted.map((t) => fmtDate(t.datetime)),
        datasets: [{
          data: pts, borderColor: '#38bdf8', borderWidth: 2, tension: 0.32, pointRadius: 0, pointHoverRadius: 4,
          fill: true,
          backgroundColor: (ctx) => {
            const { ctx: c, chartArea } = ctx.chart;
            if (!chartArea) return 'rgba(56,189,248,0.08)';
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, 'rgba(56,189,248,0.32)');
            g.addColorStop(1, 'rgba(56,189,248,0)');
            return g;
          },
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false },
          tooltip: { backgroundColor: '#0e1729', borderColor: 'rgba(148,163,184,0.15)', borderWidth: 1,
            titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 10, cornerRadius: 10, displayColors: false,
            callbacks: { label: (c) => `Equity: ${fmtSigned(c.parsed.y)}` } } },
        scales: {
          x: { grid: { color: gridColor, drawTicks: false }, ticks: { color: tickColor, maxTicksLimit: 6, font: { size: 10 } }, border: { display: false } },
          y: { grid: { color: gridColor, drawTicks: false }, ticks: { color: tickColor, font: { size: 10 }, callback: (v) => fmtMoney(v, 0) }, border: { display: false } },
        },
      },
    };
  }, [stats.sorted, pnlFor]);

  const trendConfig = useMemo(() => {
    const vals = trend.map((d) => d.pnl);
    return {
      type: 'bar',
      data: { labels: trend.map((d) => d.label),
        datasets: [{ data: vals,
          backgroundColor: vals.map((v) => (v >= 0 ? 'rgba(16,185,129,0.75)' : 'rgba(244,63,94,0.75)')),
          hoverBackgroundColor: vals.map((v) => (v >= 0 ? '#10b981' : '#f43f5e')),
          borderRadius: 5, borderSkipped: false, maxBarThickness: 34 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false },
          tooltip: { backgroundColor: '#0e1729', borderColor: 'rgba(148,163,184,0.15)', borderWidth: 1,
            titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 10, cornerRadius: 10, displayColors: false,
            callbacks: { label: (c) => `${fmtSigned(c.parsed.y)} · ${trend[c.dataIndex].count} trades · ${trend[c.dataIndex].wins}W` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 }, maxRotation: 0, autoSkipPadding: 14 }, border: { display: false } },
          y: { grid: { color: gridColor, drawTicks: false }, ticks: { color: tickColor, font: { size: 10 }, callback: (v) => fmtMoney(v, 0) }, border: { display: false } },
        },
      },
    };
  }, [trend]);

  const donutConfig = useMemo(() => ({
    type: 'doughnut',
    data: { labels: ['Wins', 'Losses'],
      datasets: [{ data: [stats.wins.length, stats.losses.length], backgroundColor: ['#10b981', '#f43f5e'], borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle', padding: 14, font: { size: 11 } } },
        tooltip: { backgroundColor: '#0e1729', borderColor: 'rgba(148,163,184,0.15)', borderWidth: 1, titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 10, cornerRadius: 10 },
      },
    },
  }), [stats.wins.length, stats.losses.length]);

  const recent = stats.sorted.slice(-6).reverse();

  const topStats = useMemo(() => {
    const best = [...stats.sorted].sort((a,b) => netPnl(b) - netPnl(a)).slice(0,3);
    const worst = [...stats.sorted].sort((a,b) => netPnl(a) - netPnl(b)).slice(0,3);
    return { best, worst };
  }, [stats.sorted]);

  return (
    <div className="fade-in space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard accent label="Net P&L" value={fmtSigned(stats.total)}
          tone={stats.total > 0 ? 'up' : stats.total < 0 ? 'down' : 'neutral'}
          sub={`Gross ${fmtSigned(stats.totalGross)} · Costs ${fmtMoney(stats.totalCosts)}`} />
        <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} tone={stats.winRate >= 50 ? 'up' : 'down'}
          sub={`${stats.wins.length}W / ${stats.losses.length}L`} />
        <StatCard label="Profit Factor" value={isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}
          tone={stats.profitFactor >= 1 ? 'up' : 'down'}
          sub={`GP ${fmtMoney(stats.grossProfit)} / GL ${fmtMoney(stats.grossLoss)}`} />
        <StatCard label="Avg R-Multiple" value={`${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`}
          tone={stats.avgR > 0 ? 'up' : 'down'}
          sub={`Total ${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(1)}R`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Avg Win" value={fmtMoney(stats.avgWin)} tone="up" sub={`${stats.wins.length} trades`} />
        <StatCard label="Avg Loss" value={fmtMoney(stats.avgLoss)} tone="down" sub={`${stats.losses.length} trades`} />
        <StatCard label="Realised R:R" value={`1 : ${stats.rr.toFixed(2)}`} tone={stats.rr >= 1 ? 'up' : 'down'} sub="Avg win ÷ avg loss" />
        <StatCard label="Max Drawdown" value={fmtMoney(stats.maxDD)} tone="down"
          sub={accountBalance > 0 ? `${stats.maxDDPct.toFixed(1)}% of account` : `${stats.avgLots.toFixed(2)} avg lots`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Equity Curve" subtitle={showNet ? 'Net of commissions & swaps' : 'Gross P&L'} className="lg:col-span-2"
          action={
            <div className="flex rounded-xl bg-ink-800 p-0.5 ring-1 ring-white/[0.06]">
              {[[true,'Net'],[false,'Gross']].map(([v, l]) => (
                <button key={l} onClick={() => setShowNet(v)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition ${showNet === v ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-slate-300'}`}>{l}</button>
              ))}
            </div>
          }>
          <ChartBox config={equityConfig} height={270} />
        </Card>
        <Card title="Win / Loss Split" subtitle={`${stats.n} closed trades`}>
          <ChartBox config={donutConfig} height={200} />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl bg-ink-800/60 p-3 ring-1 ring-white/[0.05]">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Best Trade</div>
              <div className="text-sm font-bold text-emerald-400 tabular-nums mt-1">{stats.best ? fmtSigned(netPnl(stats.best)) : '—'}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{stats.best ? stats.best.symbol : ''}</div>
            </div>
            <div className="rounded-xl bg-ink-800/60 p-3 ring-1 ring-white/[0.05]">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Worst Trade</div>
              <div className="text-sm font-bold text-rose-400 tabular-nums mt-1">{stats.worst ? fmtSigned(netPnl(stats.worst)) : '—'}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{stats.worst ? stats.worst.symbol : ''}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Daily P&L Calendar" subtitle="Last 13 weeks — hover any day for details">
        <CalendarHeatmap trades={trades} weeks={13} />
      </Card>

      <Card title="P&L Trend" subtitle="Performance grouped by period"
        action={
          <div className="flex rounded-xl bg-ink-800 p-0.5 ring-1 ring-white/[0.06]">
            {[['day','Daily'],['week','Weekly'],['month','Monthly']].map(([k, l]) => (
              <button key={k} onClick={() => setPeriod(k)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition ${period === k ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-slate-300'}`}>{l}</button>
            ))}
          </div>
        }>
        <ChartBox config={trendConfig} height={250} />
      </Card>

      <Card title="Recent Trades" subtitle="Last 6 entries"
        action={<button onClick={() => setPage('history')} className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition">View all →</button>}>
        <div className="space-y-2">
          {recent.map((t) => {
            const pnl = netPnl(t);
            const r = rMultiple(t);
            return (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 ring-1 ring-white/[0.04] hover:ring-white/[0.09] transition">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${t.direction === 'Long' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {t.direction === 'Long' ? 'LONG' : 'SHRT'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-100">{t.symbol}</span>
                    {t.strategy && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-ink-700 text-slate-400 ring-1 ring-white/[0.05]">{t.strategy}</span>}
                    {t.session && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20">{t.session}</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {fmtDateTime(t.datetime)} · {t.lots} lots · {fmtPrice(t.entry, t.symbol)} → {fmtPrice(t.exit, t.symbol)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold tabular-nums ${pnlClass(pnl)}`}>{fmtSigned(pnl)}</div>
                  {r !== null && <div className={`text-[10px] tabular-nums ${pnlClass(r)}`}>{r >= 0 ? '+' : ''}{r.toFixed(2)}R</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Top 3 Winners" subtitle="Highest net P&L">
          <div className="space-y-2">
            {topStats.best.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/[0.06] ring-1 ring-emerald-500/15">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center shrink-0">{i+1}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-100">{t.symbol}</div>
                  <div className="text-[10px] text-slate-500">{fmtDate(t.datetime)} · {t.strategy || '—'}</div>
                </div>
                <div className="text-sm font-bold text-emerald-400 tabular-nums">{fmtSigned(netPnl(t))}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Top 3 Losers" subtitle="Largest drawdown contributors">
          <div className="space-y-2">
            {topStats.worst.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-500/[0.06] ring-1 ring-rose-500/15">
                <div className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 text-[11px] font-bold flex items-center justify-center shrink-0">{i+1}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-100">{t.symbol}</div>
                  <div className="text-[10px] text-slate-500">{fmtDate(t.datetime)} · {t.strategy || '—'}</div>
                </div>
                <div className="text-sm font-bold text-rose-400 tabular-nums">{fmtSigned(netPnl(t))}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}