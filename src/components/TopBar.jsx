import { Icon } from './ui.jsx';
import { fmtSigned, pnlClass } from '../lib/format.js';

export default function TopBar({ title, setOpen, onAdd, stats }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-ink-950/85 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="h-full px-4 sm:px-6 flex items-center gap-3 max-w-[1500px] mx-auto">
        <button onClick={() => setOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-100 -ml-1 p-1">
          <Icon name="menu" className="w-6 h-6" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">{title}</h1>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-ink-850 ring-1 ring-white/[0.06]">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Net P&L</div>
              <div className={`text-sm font-bold tabular-nums leading-none mt-0.5 ${pnlClass(stats.total)}`}>{fmtSigned(stats.total)}</div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Win %</div>
              <div className={`text-sm font-bold tabular-nums leading-none mt-0.5 ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{stats.winRate.toFixed(0)}%</div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Avg R</div>
              <div className={`text-sm font-bold tabular-nums leading-none mt-0.5 ${pnlClass(stats.avgR)}`}>{stats.avgR.toFixed(2)}</div>
            </div>
          </div>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition">
            <Icon name="plus" className="w-4 h-4" />
            <span className="hidden sm:inline">Add Trade</span>
            <span className="kbd hidden lg:inline-flex ml-1">N</span>
          </button>
        </div>
      </div>
    </header>
  );
}