import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import { EmptyState, Toast } from './components/ui.jsx';
import Dashboard from './components/pages/Dashboard.jsx';
import AddTrade from './components/pages/AddTrade.jsx';
import History from './components/pages/History.jsx';
import Analytics from './components/pages/Analytics.jsx';
import Settings from './components/pages/Settings.jsx';
import { computeStats } from './lib/analytics.js';
import { generateDemo } from './lib/demo.js';
import { setCurrency, uid } from './lib/format.js';
import { KEY_TRADES, KEY_SETTINGS, DEFAULT_LOT_SIZES } from './lib/constants.js';

export default function App() {
  const [trades, setTrades] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY_TRADES));
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  });

  const [settings, setSettings] = useState(() => {
    const base = { currency: '$', accountBalance: 10000, defaultRisk: 1, lotSizes: DEFAULT_LOT_SIZES };
    try {
      const raw = JSON.parse(localStorage.getItem(KEY_SETTINGS));
      return raw && typeof raw === 'object'
        ? { ...base, ...raw, lotSizes: { ...DEFAULT_LOT_SIZES, ...(raw.lotSizes || {}) } }
        : base;
    } catch { return base; }
  });

  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toastState, setToastState] = useState({ msg: '', type: 'ok' });

  setCurrency(settings.currency || '$');
  const accountBalance = settings.accountBalance || 0;

  useEffect(() => { localStorage.setItem(KEY_TRADES, JSON.stringify(trades)); }, [trades]);
  useEffect(() => { localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings)); }, [settings]);

  const toast = (msg, type = 'ok') => {
    setToastState({ msg, type });
    setTimeout(() => setToastState({ msg: '', type: 'ok' }), 2600);
  };

  const stats = useMemo(() => computeStats(trades, accountBalance), [trades, accountBalance]);

  const handleSave = (trade) => {
    setTrades((prev) => {
      const idx = prev.findIndex((t) => t.id === trade.id);
      if (idx >= 0) { const c = prev.slice(); c[idx] = trade; return c; }
      return [trade, ...prev];
    });
    toast(editing ? 'Trade updated' : 'Trade saved', 'ok');
    setEditing(null);
    setPage('history');
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this trade?')) return;
    setTrades((prev) => prev.filter((t) => t.id !== id));
    toast('Trade deleted', 'warn');
  };

  const handleEdit = (t) => { setEditing(t); setPage('add'); };

  const loadDemo = () => {
    setTrades(generateDemo());
    toast('Demo data loaded — 78 trades', 'ok');
    setPage('dashboard');
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'n') { setEditing(null); setPage('add'); }
      else if (k === 'd') setPage('dashboard');
      else if (k === 'h') setPage('history');
      else if (k === 'a') setPage('analytics');
      else if (k === 's') setPage('settings');
      else if (e.key === 'Escape') { setEditing(null); setSidebarOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const titles = {
    dashboard: 'Dashboard',
    add: editing ? 'Edit Trade' : 'Add Trade',
    history: 'Trade History',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  const isEmpty = trades.length === 0 && page !== 'add' && page !== 'settings';

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200">
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} stats={stats} accountBalance={accountBalance} />
      <div className="lg:pl-64">
        <TopBar title={titles[page]} setOpen={setSidebarOpen}
          onAdd={() => { setEditing(null); setPage('add'); }} stats={stats} />
        <main className="p-4 sm:p-6 max-w-[1500px] mx-auto pb-16">
          {isEmpty ? (
            <EmptyState onDemo={loadDemo} onAdd={() => { setEditing(null); setPage('add'); }} />
          ) : (
            <>
              {page === 'dashboard' && <Dashboard trades={trades} stats={stats} setPage={setPage} accountBalance={accountBalance} />}
              {page === 'add' && <AddTrade settings={settings} editing={editing} onSave={handleSave}
                onCancel={() => { setEditing(null); setPage('history'); }} trades={trades} accountBalance={accountBalance} />}
              {page === 'history' && <History trades={trades} onEdit={handleEdit} onDelete={handleDelete} />}
              {page === 'analytics' && <Analytics trades={trades} stats={stats} />}
              {page === 'settings' && <Settings settings={settings} setSettings={setSettings}
                trades={trades} setTrades={setTrades} onDemo={loadDemo} toast={toast} />}
            </>
          )}
        </main>
      </div>
      <Toast msg={toastState.msg} type={toastState.type} />
    </div>
  );
}