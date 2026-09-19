import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Icon } from '../ui.jsx';
import { SESSIONS } from '../../lib/constants.js';
import { netPnl, rMultiple, unitsOf } from '../../lib/trade.js';
import { fmtSigned, fmtNum, fmtPrice, fmtDateTime, pnlClass, fmtMoney } from '../../lib/format.js';

export default function History({ trades, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [symbol, setSymbol] = useState('all');
  const [direction, setDirection] = useState('all');
  const [strategy, setStrategy] = useState('all');
  const [session, setSession] = useState('all');
  const [result, setResult] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortKey, setSortKey] = useState('datetime');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const perPage = 12;
  const searchRef = useRef(null);

  const symbolOptions = useMemo(() => [...new Set(trades.map((t) => t.symbol))].sort(), [trades]);
  const strategyOptions = useMemo(() => [...new Set(trades.map((t) => t.strategy).filter(Boolean))].sort(), [trades]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filtered = useMemo(() => {
    let out = trades.filter((t) => {
      if (symbol !== 'all' && t.symbol !== symbol) return false;
      if (direction !== 'all' && t.direction !== direction) return false;
      if (strategy !== 'all' && t.strategy !== strategy) return false;
      if (session !== 'all' && t.session !== session) return false;
      const p = netPnl(t);
      if (result === 'win' && p <= 0) return false;
      if (result === 'loss' && p >= 0) return false;
      if (from && new Date(t.datetime) < new Date(from + 'T00:00')) return false;
      if (to && new Date(t.datetime) > new Date(to + 'T23:59:59')) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${t.symbol} ${t.strategy} ${t.notes} ${t.direction} ${t.timeframe} ${t.session} ${(t.tags||[]).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    out.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'datetime') { av = new Date(a.datetime).getTime(); bv = new Date(b.datetime).getTime(); }
      if (sortKey === 'units') { av = unitsOf(a); bv = unitsOf(b); }
      if (sortKey === 'pnl') { av = netPnl(a); bv = netPnl(b); }
      if (sortKey === 'r') { av = rMultiple(a) ?? -Infinity; bv = rMultiple(b) ?? -Infinity; }
      if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv || '').toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return out;
  }, [trades, symbol, direction, strategy, session, result, from, to, search, sortKey, sortDir]);

  useEffect(() => setPage(1), [search, symbol, direction, strategy, session, result, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);
  const filteredPnl = filtered.reduce((s, t) => s + netPnl(t), 0);
  const filteredR = filtered.reduce((s, t) => s + (rMultiple(t) ?? 0), 0);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortHead = ({ k, children, align = 'left' }) => (
    <th className={`px-3 py-3 text-${align} text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap select-none cursor-pointer hover:text-slate-300 transition`}
      onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">
        {children}
        {sortKey === k && <span className="text-sky-400 text-[9px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </span>
    </th>
  );

  const selectCls = 'px-3 py-2 rounded-xl bg-ink-800 border border-white/[0.07] text-slate-200 text-xs outline-none focus:border-sky-500/60 transition';
  const resetFilters = () => {
    setSearch(''); setSymbol('all'); setDirection('all'); setStrategy('all');
    setSession('all'); setResult('all'); setFrom(''); setTo('');
  };

  return (
    <div className="fade-in space-y-4">
      <Card title="Filters" subtitle={`${filtered.length} of ${trades.length} trades · Net ${fmtSigned(filteredPnl)} · ${filteredR >= 0 ? '+' : ''}${filteredR.toFixed(1)}R`}
        action={<button onClick={resetFilters} className="text-xs font-semibold text-sky-400 hover:text-sky-300">Reset</button>}>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-9 gap-2.5">
          <div className="col-span-2 relative">
            <Icon name="search" className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol, notes, tags…  (press /)"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-ink-800 border border-white/[0.07] text-slate-200 text-xs placeholder-slate-600 outline-none focus:border-sky-500/60 transition" />
          </div>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={selectCls}>
            <option value="all">All symbols</option>
            {symbolOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={direction} onChange={(e) => setDirection(e.target.value)} className={selectCls}>
            <option value="all">Long + Short</option>
            <option value="Long">Long only</option>
            <option value="Short">Short only</option>
          </select>
          <select value={session} onChange={(e) => setSession(e.target.value)} className={selectCls}>
            <option value="all">All sessions</option>
            {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className={selectCls}>
            <option value="all">All strategies</option>
            {strategyOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={result} onChange={(e) => setResult(e.target.value)} className={selectCls}>
            <option value="all">All results</option>
            <option value="win">Wins only</option>
            <option value="loss">Losses only</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls} title="From date" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={selectCls} title="To date" />
        </div>
      </Card>

      <Card title="Trade History" subtitle="Click headers to sort · Net of commissions & swaps" bodyClass="!px-0 sm:!px-0 !pb-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead className="bg-ink-800/40 border-y border-white/[0.06]">
              <tr>
                <SortHead k="datetime">Date / Time</SortHead>
                <SortHead k="symbol">Symbol</SortHead>
                <SortHead k="direction">Side</SortHead>
                <SortHead k="units" align="right">Units</SortHead>
                <SortHead k="entry" align="right">Entry</SortHead>
                <SortHead k="exit" align="right">Exit</SortHead>
                <SortHead k="session">Session</SortHead>
                <SortHead k="strategy">Strategy</SortHead>
                <SortHead k="r" align="right">R</SortHead>
                <SortHead k="pnl" align="right">Net P&amp;L</SortHead>
                <th className="px-3 py-3 text-right text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((t) => {
                const p = netPnl(t);
                const r = rMultiple(t);
                return (
                  <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                    <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDateTime(t.datetime)}</td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-semibold text-slate-100">{t.symbol}</div>
                      <div className="text-[10px] text-slate-500">{t.timeframe}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ring-1 ${t.direction === 'Long'
                        ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'}`}>{t.direction.toUpperCase()}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300 text-right tabular-nums font-mono">
                      {t.lots}
                      <div className="text-[10px] text-slate-500">{unitsOf(t).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300 text-right tabular-nums font-mono">{fmtPrice(t.entry, t.symbol)}</td>
                    <td className="px-3 py-3 text-xs text-slate-300 text-right tabular-nums font-mono">{fmtPrice(t.exit, t.symbol)}</td>
                    <td className="px-3 py-3">
                      {t.session ? <span className="text-[10px] px-2 py-1 rounded-md bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20 whitespace-nowrap">{t.session}</span>
                        : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {t.strategy ? <span className="text-[10px] px-2 py-1 rounded-md bg-ink-700/70 text-slate-300 ring-1 ring-white/[0.05] whitespace-nowrap">{t.strategy}</span>
                        : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className={`px-3 py-3 text-xs font-semibold text-right tabular-nums whitespace-nowrap ${r !== null ? pnlClass(r) : 'text-slate-600'}`}>
                      {r !== null ? `${r >= 0 ? '+' : ''}${r.toFixed(2)}R` : '—'}
                    </td>
                    <td className={`px-3 py-3 text-xs font-bold text-right tabular-nums whitespace-nowrap ${pnlClass(p)}`}>
                      {fmtSigned(p)}
                      {(Number(t.commission) + Number(t.swap)) > 0 && (
                        <div className="text-[9px] text-slate-600 font-normal">−{fmtMoney((Number(t.commission)||0)+(Number(t.swap)||0), 2)} costs</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1 opacity-60 group-hover:opacity-100 transition">
                        <button onClick={() => onEdit(t)} title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition">
                          <Icon name="edit" className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(t.id)} title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition">
                          <Icon name="trash" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!pageRows.length && (
                <tr><td colSpan="11" className="px-4 py-16 text-center text-slate-500 text-sm">No trades match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-t border-white/[0.06]">
            <div className="text-xs text-slate-500">Page {page} of {totalPages}</div>
            <div className="flex gap-1.5">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-ink-800 text-slate-300 ring-1 ring-white/[0.07] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-700 transition">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-ink-800 text-slate-300 ring-1 ring-white/[0.07] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-700 transition">Next</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}