import { useRef, useEffect } from 'react';
import { Chart } from 'chart.js/auto';
import { ser, pnlClass } from '../lib/format.js';

export function Icon({ name, className = 'w-5 h-5' }) {
  const paths = {
    dashboard: 'M3 12h7V3H3v9zm0 9h7v-6H3v6zm11 0h7V12h-7v9zm0-18v6h7V3h-7z',
    plus: 'M12 5v14M5 12h14',
    history: 'M12 8v4l3 2M3.05 11a9 9 0 1 1 .5 4M3 4v5h5',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    menu: 'M3 6h18M3 12h18M3 18h18',
    trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
    edit: 'M11 4H4v16h16v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
    upload: 'M12 21V9M7 14l5-5 5 5M5 3h14',
    spark: 'M13 2 3 14h7l-1 8 10-12h-7l1-8z',
    x: 'M18 6 6 18M6 6l12 12',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
    trendUp: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={paths[name] || ''} />
    </svg>
  );
}

export function Card({ title, subtitle, action, children, className = '', bodyClass = '' }) {
  return (
    <div className={`rounded-2xl bg-ink-850 border border-white/[0.06] shadow-lg shadow-black/30 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={`px-4 sm:px-5 pb-4 sm:pb-5 ${bodyClass}`}>{children}</div>
    </div>
  );
}

export function StatCard({ label, value, sub, tone = 'neutral', accent = false }) {
  const toneCls = tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-rose-400' : 'text-slate-100';
  return (
    <div className={`rounded-2xl border p-4 shadow-lg shadow-black/20 ${
      accent ? 'bg-gradient-to-br from-ink-800 to-ink-850 border-white/[0.08]' : 'bg-ink-850 border-white/[0.06]'
    }`}>
      <div className="text-[10.5px] uppercase tracking-[0.09em] text-slate-500 font-semibold">{label}</div>
      <div className={`mt-1.5 text-lg sm:text-xl font-bold tabular-nums ${toneCls}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-500 leading-snug">{sub}</div>}
    </div>
  );
}

export function ChartBox({ config, height = 260 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const deps = ser(config);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current.getContext('2d'), config);
    return () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, [deps]);

  return (
    <div style={{ height }} className="relative w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}

export function Stars({ value = 3, onChange, readOnly = false, size = 'w-4 h-4' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <button key={i} type="button" disabled={readOnly}
          onClick={() => !readOnly && onChange && onChange(i)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}>
          <svg viewBox="0 0 24 24" className={`${size} ${i <= value ? 'text-amber-400' : 'text-slate-700'}`}
            fill={i <= value ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ onDemo, onAdd }) {
  return (
    <div className="fade-in flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 ring-1 ring-white/10 flex items-center justify-center mb-5">
        <Icon name="spark" className="w-8 h-8 text-sky-400" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Your FX &amp; Crypto journal starts here</h2>
      <p className="text-slate-400 mt-2 max-w-md text-sm leading-relaxed">
        Log your trades in USD to unlock win rate, R-multiples, session edge, drawdown and strategy analytics.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
        <button onClick={onAdd} className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition">
          + Log your first trade
        </button>
        <button onClick={onDemo} className="px-5 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-slate-200 text-sm font-semibold ring-1 ring-white/10 transition">
          Load demo data
        </button>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
        <span className="kbd">N</span> new trade
        <span className="kbd">/</span> search
        <span className="kbd">D</span> dashboard
        <span className="kbd">Esc</span> close
      </div>
    </div>
  );
}

export function Toast({ msg, type }) {
  if (!msg) return null;
  const cls = type === 'ok' ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25'
    : type === 'warn' ? 'bg-amber-500/15 text-amber-300 ring-amber-500/25'
    : 'bg-sky-500/15 text-sky-300 ring-sky-500/25';
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] fade-in">
      <div className={`px-5 py-3 rounded-xl text-sm font-semibold ring-1 shadow-2xl shadow-black/50 backdrop-blur-xl ${cls}`}>{msg}</div>
    </div>
  );
}