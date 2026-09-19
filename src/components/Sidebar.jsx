import { Icon } from './ui.jsx';
import { fmtMoney, fmtSigned, fmtPct, pnlClass } from '../lib/format.js';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', kbd: 'D' },
  { id: 'add',       label: 'Add Trade', icon: 'plus',      kbd: 'N' },
  { id: 'history',   label: 'History',   icon: 'history',   kbd: 'H' },
  { id: 'analytics', label: 'Analytics', icon: 'chart',     kbd: 'A' },
  { id: 'settings',  label: 'Settings',  icon: 'settings',  kbd: 'S' },
];

export default function Sidebar({ page, setPage, open, setOpen, stats, accountBalance }) {
  const go = (id) => { setPage(id); setOpen(false); };
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-ink-900 border-r border-white/[0.06] flex flex-col
        transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Icon name="trendUp" className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-slate-100 tracking-tight">TradeTracker <span className="text-sky-400">FX</span></div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Forex · Crypto</div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden text-slate-500 hover:text-slate-200">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => go(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`}>
                <Icon name={item.icon} className="w-[18px] h-[18px]" />
                <span className="flex-1 text-left">{item.label}</span>
                <span className="kbd hidden sm:inline-flex">{item.kbd}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.06] space-y-2">
          {accountBalance > 0 && (
            <div className="rounded-xl bg-ink-850 p-3.5 ring-1 ring-white/[0.05]">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Account Equity</div>
              <div className="text-lg font-bold text-slate-100 tabular-nums mt-1">{fmtMoney(accountBalance + stats.total)}</div>
              <div className={`text-[11px] mt-0.5 tabular-nums ${pnlClass(stats.total)}`}>
                {fmtSigned(stats.total)} ({fmtPct(stats.totalPct)})
              </div>
            </div>
          )}
          <div className="rounded-xl bg-ink-850 p-3.5 ring-1 ring-white/[0.05]">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Net P&L</div>
              <div className="text-[10px] text-slate-500">{stats.n} trades</div>
            </div>
            <div className={`text-xl font-bold tabular-nums mt-1 ${pnlClass(stats.total)}`}>{fmtSigned(stats.total)}</div>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
              <span className={stats.winRate >= 50 ? 'text-emerald-400/80' : 'text-rose-400/80'}>{stats.winRate.toFixed(1)}% win</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className={stats.avgR >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}>Ø {stats.avgR.toFixed(2)}R</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}