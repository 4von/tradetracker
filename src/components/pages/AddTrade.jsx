import { useState, useEffect, useMemo } from 'react';
import { Card, Stars } from '../ui.jsx';
import PositionCalculator from '../PositionCalculator.jsx';
import { STRATEGIES, TIMEFRAMES, SESSIONS, ASSET_CLASS } from '../../lib/constants.js';
import { detectSession } from '../../lib/trade.js';
import { nowLocal, uid, fmtMoney, fmtSigned, pnlClass } from '../../lib/format.js';

export default function AddTrade({ settings, editing, onSave, onCancel, trades, accountBalance }) {
  const symbols = Object.keys(settings.lotSizes);
  const usedStrategies = useMemo(() => [...new Set([...STRATEGIES, ...trades.map((t) => t.strategy).filter(Boolean)])], [trades]);

  const makeEmpty = () => ({
    datetime: nowLocal(),
    symbol: 'EURUSD',
    direction: 'Long',
    entry: '', exit: '',
    lots: 0.1,
    lotMultiplier: settings.lotSizes.EURUSD || 100000,
    stopLoss: '', target: '',
    commission: 0, swap: 0,
    leverage: 100,
    riskPercent: settings.defaultRisk || 1,
    session: detectSession(nowLocal()),
    strategy: '', timeframe: '15m',
    confidence: 3, tags: [], notes: '',
  });

  const [form, setForm] = useState(makeEmpty);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (editing) {
      setForm({
        ...editing,
        entry: String(editing.entry ?? ''),
        exit: String(editing.exit ?? ''),
        stopLoss: editing.stopLoss ? String(editing.stopLoss) : '',
        target: editing.target ? String(editing.target) : '',
        commission: editing.commission || 0,
        swap: editing.swap || 0,
        tags: editing.tags || [],
        notes: editing.notes || '',
      });
    } else {
      setForm(makeEmpty());
    }
    setError('');
  }, [editing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSymbolChange = (s) => {
    const up = s.toUpperCase();
    setForm((f) => ({ ...f, symbol: up, lotMultiplier: settings.lotSizes[up] ?? f.lotMultiplier }));
  };

  const units = (Number(form.lots) || 0) * (Number(form.lotMultiplier) || 0);
  const entryN = Number(form.entry) || 0;
  const exitN = Number(form.exit) || 0;
  const hasPrices = form.entry !== '' && form.exit !== '';
  const gross = form.direction === 'Long' ? (exitN - entryN) * units : (entryN - exitN) * units;
  const net = gross - (Number(form.commission) || 0) - (Number(form.swap) || 0);

  const slN = Number(form.stopLoss) || 0;
  const tgtN = Number(form.target) || 0;
  const riskAmount = slN && entryN ? Math.abs(entryN - slN) * units : 0;
  const rewardAmount = tgtN && entryN ? Math.abs(tgtN - entryN) * units : 0;
  const plannedRR = riskAmount > 0 ? rewardAmount / riskAmount : 0;
  const rMult = riskAmount > 0 && hasPrices ? net / riskAmount : 0;
  const notional = entryN * units;
  const margin = form.leverage > 0 ? notional / Number(form.leverage) : 0;
  const riskOfAccount = accountBalance > 0 && riskAmount > 0 ? (riskAmount / accountBalance) * 100 : 0;

  const submit = (e) => {
    e.preventDefault();
    if (!form.datetime) return setError('Please choose a date & time.');
    if (!form.symbol.trim()) return setError('Symbol is required.');
    if (form.entry === '' || form.exit === '') return setError('Entry and exit price are required.');
    if (!(Number(form.lots) > 0)) return setError('Lot size must be greater than 0.');
    if (!(Number(form.lotMultiplier) > 0)) return setError('Lot multiplier must be greater than 0.');
    setError('');
    onSave({
      id: editing ? editing.id : uid(),
      datetime: form.datetime,
      symbol: form.symbol.trim().toUpperCase(),
      direction: form.direction,
      entry: Number(form.entry),
      exit: Number(form.exit),
      lots: Number(form.lots),
      lotMultiplier: Number(form.lotMultiplier),
      stopLoss: form.stopLoss === '' ? 0 : Number(form.stopLoss),
      target: form.target === '' ? 0 : Number(form.target),
      commission: Number(form.commission) || 0,
      swap: Number(form.swap) || 0,
      leverage: Number(form.leverage) || 100,
      riskPercent: Number(form.riskPercent) || 0,
      session: form.session || detectSession(form.datetime),
      strategy: form.strategy.trim(),
      timeframe: form.timeframe,
      confidence: Number(form.confidence) || 3,
      tags: form.tags || [],
      notes: form.notes.trim(),
    });
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !(form.tags || []).includes(t)) set('tags', [...(form.tags || []), t]);
    setTagInput('');
  };
  const removeTag = (t) => set('tags', (form.tags || []).filter((x) => x !== t));

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-ink-800 border border-white/[0.07] text-slate-100 text-sm placeholder-slate-600 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15';
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5';

  return (
    <div className="fade-in grid grid-cols-1 xl:grid-cols-3 gap-5">
      <form onSubmit={submit} className="xl:col-span-2 space-y-5">
        <Card title={editing ? 'Edit Trade' : 'New Trade'} subtitle="Log your entry, exit, costs and context">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date &amp; Time</label>
              <input type="datetime-local" value={form.datetime} onChange={(e) => {
                const v = e.target.value; set('datetime', v);
                if (!editing) set('session', detectSession(v));
              }} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Instrument</label>
              <input list="symbol-list" value={form.symbol} onChange={(e) => onSymbolChange(e.target.value)} placeholder="EURUSD" className={inputCls} />
              <datalist id="symbol-list">{symbols.map((s) => <option key={s} value={s} />)}</datalist>
            </div>

            <div>
              <label className={labelCls}>Direction</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-ink-800 ring-1 ring-white/[0.06]">
                {['Long', 'Short'].map((d) => (
                  <button key={d} type="button" onClick={() => set('direction', d)}
                    className={`py-2 rounded-lg text-sm font-semibold transition ${form.direction === d
                      ? d === 'Long' ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30'
                      : 'text-slate-500 hover:text-slate-300'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Timeframe</label>
              <select value={form.timeframe} onChange={(e) => set('timeframe', e.target.value)} className={inputCls}>
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Entry Price</label>
              <input type="number" step="any" value={form.entry} onChange={(e) => set('entry', e.target.value)} placeholder="0.00000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Exit Price</label>
              <input type="number" step="any" value={form.exit} onChange={(e) => set('exit', e.target.value)} placeholder="0.00000" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Lots</label>
                <input type="number" step="any" min="0" value={form.lots} onChange={(e) => set('lots', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Lot × Units</label>
                <input type="number" step="any" min="0" value={form.lotMultiplier} onChange={(e) => set('lotMultiplier', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Total Units</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-ink-900/70 border border-white/[0.05] text-sm font-semibold text-sky-300 tabular-nums font-mono">
                {units.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                <span className="text-slate-600 font-normal text-xs ml-1">units</span>
              </div>
            </div>

            <div>
              <label className={labelCls}>Stop Loss</label>
              <input type="number" step="any" value={form.stopLoss} onChange={(e) => set('stopLoss', e.target.value)} placeholder="Optional" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Take Profit</label>
              <input type="number" step="any" value={form.target} onChange={(e) => set('target', e.target.value)} placeholder="Optional" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Commission ($)</label>
              <input type="number" step="0.01" min="0" value={form.commission} onChange={(e) => set('commission', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Swap / Funding ($)</label>
              <input type="number" step="0.01" value={form.swap} onChange={(e) => set('swap', e.target.value)} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Leverage</label>
                <input type="number" step="1" min="1" value={form.leverage} onChange={(e) => set('leverage', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Risk %</label>
                <input type="number" step="0.1" value={form.riskPercent} onChange={(e) => set('riskPercent', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Session</label>
              <select value={form.session} onChange={(e) => set('session', e.target.value)} className={inputCls}>
                <option value="">Auto ({detectSession(form.datetime) || '—'})</option>
                {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Strategy / Setup</label>
              <input list="strategy-list" value={form.strategy} onChange={(e) => set('strategy', e.target.value)}
                placeholder="e.g. London Open Breakout" className={inputCls} />
              <datalist id="strategy-list">{usedStrategies.map((s) => <option key={s} value={s} />)}</datalist>
            </div>

            <div>
              <label className={labelCls}>Confidence</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-ink-800 border border-white/[0.07] flex items-center gap-3">
                <Stars value={form.confidence} onChange={(v) => set('confidence', v)} size="w-5 h-5" />
                <span className="text-xs text-slate-500 ml-auto">{form.confidence}/5</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="e.g. A+setup" className={inputCls + ' flex-1'} />
                <button type="button" onClick={addTag}
                  className="px-3 rounded-xl bg-ink-700 hover:bg-ink-600 text-slate-300 text-xs font-semibold transition">Add</button>
              </div>
              {(form.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-1 rounded-md bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20 inline-flex items-center gap-1.5">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-rose-400">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea rows="3" value={form.notes} onChange={(e) => set('notes', e.target.value)}
                placeholder="Why did you take this trade? What would you do differently?" className={inputCls + ' resize-none'} />
            </div>
          </div>

          {error && <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-rose-500/10 text-rose-300 text-sm ring-1 ring-rose-500/20">{error}</div>}

          <div className="flex flex-wrap gap-3 mt-5">
            <button type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition">
              {editing ? 'Update Trade' : 'Save Trade'}
            </button>
            {editing && (
              <button type="button" onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-slate-300 text-sm font-semibold ring-1 ring-white/10 transition">Cancel</button>
            )}
          </div>
        </Card>
      </form>

      <div className="space-y-5">
        <Card title="Live Preview" subtitle="Updates as you type">
          <div className={`rounded-2xl p-5 text-center ring-1 transition-colors ${
            !hasPrices ? 'bg-ink-800/60 ring-white/[0.05]'
            : net > 0 ? 'bg-emerald-500/10 ring-emerald-500/25'
            : net < 0 ? 'bg-rose-500/10 ring-rose-500/25'
            : 'bg-ink-800/60 ring-white/[0.05]'}`}>
            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-semibold">Net P&L</div>
            <div className={`text-3xl font-extrabold tabular-nums mt-2 ${hasPrices ? pnlClass(net) : 'text-slate-600'}`}>
              {hasPrices ? fmtSigned(net) : '—'}
            </div>
            {hasPrices && (Number(form.commission) + Number(form.swap)) > 0 && (
              <div className="text-[10.5px] text-slate-500 mt-1.5">
                Gross {fmtSigned(gross)} · Costs {fmtMoney((Number(form.commission)||0) + (Number(form.swap)||0))}
              </div>
            )}
            {riskAmount > 0 && hasPrices && (
              <div className={`text-xs font-bold mt-1.5 ${pnlClass(rMult)}`}>
                {rMult >= 0 ? '+' : ''}{rMult.toFixed(2)} R
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              ['Risk ($)', riskAmount ? fmtMoney(riskAmount) : '—'],
              ['Reward ($)', rewardAmount ? fmtMoney(rewardAmount) : '—'],
              ['Planned R:R', plannedRR ? `1 : ${plannedRR.toFixed(2)}` : '—'],
              ['Notional', notional ? fmtMoney(notional, 0) : '—'],
              ['Margin req.', margin ? fmtMoney(margin, 2) : '—'],
              ['Risk of account', riskOfAccount ? `${riskOfAccount.toFixed(2)}%` : '—'],
              ['Session', form.session || detectSession(form.datetime) || '—'],
              ['Asset class', ASSET_CLASS[form.symbol] || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-200 font-semibold tabular-nums">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <PositionCalculator accountBalance={accountBalance} defaultRisk={form.riskPercent} settings={settings} />

        <Card title="Pro Tips" subtitle="Sharp journaling habits">
          <ul className="space-y-2.5 text-[12.5px] text-slate-400 leading-relaxed">
            <li className="flex gap-2"><span className="text-sky-400">•</span> Always log your <span className="text-slate-200">initial risk ($)</span> — it's the denominator for R-multiples.</li>
            <li className="flex gap-2"><span className="text-sky-400">•</span> Include <span className="text-slate-200">commission & swap</span> for true net P&L.</li>
            <li className="flex gap-2"><span className="text-sky-400">•</span> Trade one strategy per session — the analytics will tell you which works.</li>
            <li className="flex gap-2"><span className="text-sky-400">•</span> Trust <span className="text-slate-200">expectancy</span> over a single trade's result.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}