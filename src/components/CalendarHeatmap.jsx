import { useMemo } from 'react';
import { calendarData } from '../lib/analytics.js';
import { fmtSigned } from '../lib/format.js';

export default function CalendarHeatmap({ trades, weeks = 13 }) {
  const days = useMemo(() => calendarData(trades, weeks), [trades, weeks]);
  const maxAbs = Math.max(1, ...days.map((d) => Math.abs(d.pnl)));

  const weekCols = [];
  for (let i = 0; i < days.length; i += 7) weekCols.push(days.slice(i, i + 7));

  const colorFor = (pnl, isFuture) => {
    if (isFuture) return 'bg-ink-800/30 border-white/[0.03]';
    if (pnl === 0) return 'bg-ink-800 border-white/[0.05]';
    const intensity = Math.min(1, Math.abs(pnl) / maxAbs);
    if (pnl > 0) {
      if (intensity > 0.7) return 'bg-emerald-500 border-emerald-400';
      if (intensity > 0.4) return 'bg-emerald-500/70 border-emerald-500/50';
      return 'bg-emerald-500/40 border-emerald-500/30';
    }
    if (intensity > 0.7) return 'bg-rose-500 border-rose-400';
    if (intensity > 0.4) return 'bg-rose-500/70 border-rose-500/50';
    return 'bg-rose-500/40 border-rose-500/30';
  };

  const monthLabels = weekCols.map((week, i) => {
    const first = week[0]?.date;
    if (!first) return '';
    const prev = i > 0 ? weekCols[i-1][0]?.date : null;
    if (!prev || prev.getMonth() !== first.getMonth()) return first.toLocaleDateString('en-US', { month: 'short' });
    return '';
  });

  return (
    <div>
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-1 pt-5 pr-1">
          {['M','','W','','F','','S'].map((d, i) => (
            <div key={i} className="text-[9px] text-slate-600 h-5 leading-5 text-right w-3">{d}</div>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {weekCols.map((week, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              <div className="h-4 text-[9px] text-slate-500 font-semibold">{monthLabels[ci]}</div>
              {week.map((day) => (
                <div key={day.key}
                  title={`${day.date.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })} · ${day.count} trades · ${fmtSigned(day.pnl)}`}
                  className={`heat-cell w-5 h-5 rounded border cursor-default ${colorFor(day.pnl, day.isFuture)}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4 text-[10px] text-slate-500">
        <span>Loss</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded bg-rose-500/70 border border-rose-500/50" />
          <div className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500/30" />
          <div className="w-3 h-3 rounded bg-ink-800 border border-white/[0.05]" />
          <div className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500/30" />
          <div className="w-3 h-3 rounded bg-emerald-500/70 border border-emerald-500/50" />
        </div>
        <span>Profit</span>
      </div>
    </div>
  );
}