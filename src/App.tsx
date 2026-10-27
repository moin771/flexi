import { useCallback, useEffect, useState } from 'react';
import type { Bike, Transaction } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import Showroom from '@/components/Showroom';
import Purchase from '@/components/Purchase';
import Sell from '@/components/Sell';
import Profit from '@/components/Profit';
import { Gauge, LayoutGrid, ShoppingCart, Tag, BarChart3 } from 'lucide-react';

type Tab = 'showroom' | 'purchase' | 'sell' | 'profit';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'showroom', label: 'Showroom', icon: LayoutGrid },
  { id: 'purchase', label: 'Purchase', icon: ShoppingCart },
  { id: 'sell', label: 'Sell', icon: Tag },
  { id: 'profit', label: 'Profit', icon: BarChart3 },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('showroom');
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBikes = useCallback(async () => {
    const { data, error } = await supabase.from('bikes').select('*').order('brand').order('name');
    if (!error && data) setBikes(data as Bike[]);
  }, []);

  const loadTransactions = useCallback(async () => {
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (!error && data) setTransactions(data as Transaction[]);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([loadBikes(), loadTransactions()]);
      setLoading(false);
    })();
  }, [loadBikes, loadTransactions]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-lg">
              <Gauge className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900">Velocity Motors</h1>
              <p className="text-[11px] uppercase tracking-widest text-slate-400">Superbike Dealership</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs text-slate-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {bikes.length} models · {bikes.reduce((s, b) => s + b.stock, 0)} in stock
          </div>
        </div>

        {/* Tabs */}
        <nav className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition ${
                    active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {active && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-slate-900 to-slate-600" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {tab === 'showroom' && (
          <section>
            <SectionTitle
              title="Showroom"
              subtitle="Browse 30+ superbikes with interactive 3D previews. Drag to rotate, tilt, and customize colors."
            />
            <Showroom bikes={bikes} loading={loading} />
          </section>
        )}
        {tab === 'purchase' && (
          <section>
            <SectionTitle
              title="Purchase"
              subtitle="Acquire bikes into dealership inventory. Adjust quantity, unit cost, and livery per order."
            />
            <Purchase bikes={bikes} onBikesChanged={loadBikes} />
          </section>
        )}
        {tab === 'sell' && (
          <section>
            <SectionTitle
              title="Sell"
              subtitle="Record sales from inventory. Profit is computed live from your average purchase cost."
            />
            <Sell
              bikes={bikes}
              transactions={transactions}
              onBikesChanged={loadBikes}
              onTransactionsChanged={loadTransactions}
            />
          </section>
        )}
        {tab === 'profit' && (
          <section>
            <SectionTitle
              title="Profit Dashboard"
              subtitle="Track invested capital, revenue, net profit, and per-model performance across every transaction."
            />
            <Profit bikes={bikes} transactions={transactions} />
          </section>
        )}
      </main>

      <footer className="relative border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-400 sm:px-6">
        Velocity Motors · Superbike Dealership Management · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
