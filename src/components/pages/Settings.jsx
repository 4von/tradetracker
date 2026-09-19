import { useState, useMemo, useRef } from 'react';
import { Card, Icon } from '../ui.jsx';
import { ASSET_CLASS } from '../../lib/constants.js';
import { toCSV, fromCSV, CSV_HEADERS } from '../../lib/csv.js';
import { fmtMoney } from '../../lib/format.js';

export default function Settings({ settings, setSettings, trades, setTrades, onDemo, toast }) {
  const [newSym, setNewSym] = useState('');
  const [newLot, setNewLot] = useState('');
  const fileRef = useRef(null);

  const updateLot = (sym, val) => setSettings((s) => ({ ...s, lotSizes: { ...s.lotSizes, [sym]: Number(val) || 0 } }));
  const addInstrument = () => {
    const s = newSym.trim().toUpperCase();
    if (!s) return;
    setSettings((st) => ({ ...st, lotSizes: { ...st.lotSizes, [s]: Number(newLot) || 1 } }));
    setNewSym(''); setNewLot('');
  };
  const removeInstrument = (sym) => setSettings((st) => {
    const copy = { ...st.lotSizes }; delete copy[sym]; return { ...st, lotSizes: copy };
  });

  const exportCSV = () => {
    if (!trades.length) return toast('No trades to export', 'warn');
    const blob = new Blob([toCSV(trades)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradetracker-fx-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${trades.length} trades`, 'ok');
  };

  const importCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = fromCSV(String(ev.target.result));
        if (!rows.length) return toast('No valid rows found in CSV', 'warn');
        setTrades((prev) => [...rows, ...prev]);
        toast(`Imported ${rows.length} trades`, 'ok');
      } catch { toast('Failed to parse CSV', 'warn'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearAll = () => {
    if (confirm('Delete ALL trades? This cannot be undone.')) {
      setTrades([]);
      toast('All trades deleted', 'warn');
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-ink-800 border border-white/[0.07] text-slate-100 text-sm outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15';
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5';

  const grouped = useMemo(() => {
    const groups = { forex: [], metal: [], crypto: [], other: [] };
    Object.entries(settings.lotSizes).forEach(([sym, lot]) => {
      const cls = ASSET_CLASS[sym] || 'other';
      (groups[cls] ||= []).push([sym, lot]);
    });
    return groups;
  }, [settings.lotSizes]);

  const groupLabels = { forex: 'Forex Pairs', metal: 'Metals', crypto: 'Crypto', other: 'Other' };

  return (
    <div className="fade-in space-y-5 max-w-4xl">
      <Card title="Account Preferences" subtitle="Currency and risk defaults for USD accounts">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Currency</label>
            <input value={settings.currency} maxLength={3}
              onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Starting Balance ($)</label>
            <input type="number" step="any" value={settings.accountBalance ?? 10000}
              onChange={(e) => setSettings((s) => ({ ...s, accountBalance: Number(e.target.value) || 0 }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Default Risk %</label>
            <input type="number" step="0.1" value={settings.defaultRisk ?? 1}
              onChange={(e) => setSettings((s) => ({ ...s, defaultRisk: Number(e.target.value) || 0 }))} className={inputCls} />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">Starting balance is used to compute % returns and drawdown relative to account.</p>
      </Card>

      <Card title="Instrument Lot Sizes" subtitle="Units per 1 lot — used to auto-calculate position size">
        <div className="space-y-5">
          {Object.entries(grouped).map(([cls, items]) => items.length === 0 ? null : (
            <div key={cls}>
              <div className="text-[10.5px] uppercase tracking-widest text-slate-500 font-semibold mb-2">{groupLabels[cls]}</div>
              <div className="space-y-2">
                {items.map(([sym, lot]) => (
                  <div key={sym} className="flex items-center gap-3 p-2.5 rounded-xl bg-ink-800/50 ring-1 ring-white/[0.05]">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      cls === 'forex' ? 'bg-sky-500/10 text-sky-400'
                      : cls === 'crypto' ? 'bg-amber-500/10 text-amber-400'
                      : cls === 'metal' ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-slate-500/10 text-slate-400'}`}>
                      {sym.slice(0, 3)}
                    </div>
                    <div className="flex-1 text-sm font-semibold text-slate-200 truncate">{sym}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 hidden sm:inline">1 lot =</span>
                      <input type="number" min="1" value={lot} onChange={(e) => updateLot(sym, e.target.value)}
                        className="w-32 px-3 py-1.5 rounded-lg bg-ink-900 border border-white/[0.07] text-slate-100 text-sm text-right tabular-nums outline-none focus:border-sky-500/60 transition font-mono" />
                    </div>
                    <button onClick={() => removeInstrument(sym)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0">
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 mt-5 pt-4 border-t border-white/[0.06]">
          <input value={newSym} onChange={(e) => setNewSym(e.target.value)} placeholder="SYMBOL (e.g. GBPJPY or DOGEUSD)"
            className={inputCls + ' sm:flex-1'} />
          <input value={newLot} onChange={(e) => setNewLot(e.target.value)} placeholder="Units per lot" type="number" min="1"
            className={inputCls + ' sm:w-44'} />
          <button onClick={addInstrument}
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition whitespace-nowrap">
            Add Instrument
          </button>
        </div>
      </Card>

      <Card title="Data Management" subtitle="Everything is stored locally in your browser">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={exportCSV} className="flex items-center gap-3 p-4 rounded-xl bg-ink-800/60 hover:bg-ink-800 ring-1 ring-white/[0.06] text-left transition">
            <Icon name="download" className="w-5 h-5 text-emerald-400 shrink-0" />
            <div><div className="text-sm font-semibold text-slate-200">Export CSV</div>
              <div className="text-[11px] text-slate-500">Download all {trades.length} trades</div></div>
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-3 p-4 rounded-xl bg-ink-800/60 hover:bg-ink-800 ring-1 ring-white/[0.06] text-left transition">
            <Icon name="upload" className="w-5 h-5 text-sky-400 shrink-0" />
            <div><div className="text-sm font-semibold text-slate-200">Import CSV</div>
              <div className="text-[11px] text-slate-500">Append trades from a CSV file</div></div>
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={importCSV} className="hidden" />
          <button onClick={onDemo} className="flex items-center gap-3 p-4 rounded-xl bg-ink-800/60 hover:bg-ink-800 ring-1 ring-white/[0.06] text-left transition">
            <Icon name="spark" className="w-5 h-5 text-violet-400 shrink-0" />
            <div><div className="text-sm font-semibold text-slate-200">Load Demo Data</div>
              <div className="text-[11px] text-slate-500">78 sample FX &amp; crypto trades</div></div>
          </button>
          <button onClick={clearAll} className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/[0.07] hover:bg-rose-500/[0.12] ring-1 ring-rose-500/20 text-left transition">
            <Icon name="trash" className="w-5 h-5 text-rose-400 shrink-0" />
            <div><div className="text-sm font-semibold text-rose-300">Clear All Data</div>
              <div className="text-[11px] text-rose-400/60">Permanently delete every trade</div></div>
          </button>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-ink-900/60 ring-1 ring-white/[0.05]">
          <div className="text-[11px] text-slate-500 leading-relaxed">
            <span className="text-slate-400 font-semibold">CSV columns:</span>{' '}
            <code className="text-sky-400/90 text-[10.5px] font-mono">{CSV_HEADERS.join(', ')}</code>
          </div>
        </div>
      </Card>

      <Card title="Keyboard Shortcuts" subtitle="Move faster around the app">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['N','Add trade'],['/','Search history'],['D','Dashboard'],['H','History'],['A','Analytics'],['S','Settings']].map(([k, l]) => (
            <div key={k} className="flex items-center gap-2 p-2.5 rounded-xl bg-ink-800/50 ring-1 ring-white/[0.05]">
              <span className="kbd">{k}</span>
              <span className="text-xs text-slate-400">{l}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}