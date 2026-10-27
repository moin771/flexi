import { useMemo, useState } from 'react';
import type { Bike, Transaction } from '@/lib/supabase';
import { formatCurrency } from '@/components/BikeCard';
import { TrendingUp, TrendingDown, Wallet, ShoppingCart, Tag, Bike as BikeIcon, ArrowUpDown } from 'lucide-react';

interface ProfitProps {
  bikes: Bike[];
  transactions: Transaction[];
}

type SortKey = 'date' | 'amount';

export default function Profit({ bikes, transactions }: ProfitProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [filter, setFilter] = useState<'all' | 'purchase' | 'sale'>('all');

  const totals = useMemo(() => {
    const purchases = transactions.filter((t) => t.type === 'purchase');
    const sales = transactions.filter((t) => t.type === 'sale');
    const invested = purchases.reduce((s, t) => s + Number(t.total_amount), 0);
    const revenue = sales.reduce((s, t) => s + Number(t.total_amount), 0);
    const unitsBought = purchases.reduce((s, t) => s + t.quantity, 0);
    const unitsSold = sales.reduce((s, t) => s + t.quantity, 0);
    const inventoryValue = bikes.reduce((s, b) => s + b.price * b.stock, 0);
    const cogs = sales.reduce((s, t) => {
      const costPerUnit = avgCost(purchases, t.bike_id);
      return s + costPerUnit * t.quantity;
    }, 0);
    const profit = revenue - cogs;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { invested, revenue, profit, margin, unitsBought, unitsSold, inventoryValue, cogs };
  }, [transactions, bikes]);

  const byBike = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; cost: number; units: number }>();
    for (const t of transactions) {
      if (t.type !== 'sale' || !t.bike_id) continue;
      const cur = map.get(t.bike_id) ?? { name: t.bike_name_snapshot, revenue: 0, cost: 0, units: 0 };
      const costPerUnit = avgCost(transactions.filter((x) => x.type === 'purchase'), t.bike_id);
      cur.revenue += Number(t.total_amount);
      cur.cost += costPerUnit * t.quantity;
      cur.units += t.quantity;
      map.set(t.bike_id, cur);
    }
    return Array.from(map.values())
      .map((v) => ({ ...v, profit: v.revenue - v.cost }))
      .sort((a, b) => b.profit - a.profit);
  }, [transactions]);

  const history = useMemo(() => {
    let list = [...transactions];
    if (filter !== 'all') list = list.filter((t) => t.type === filter);
    list.sort((a, b) => {
      if (sortKey === 'amount') return Number(b.total_amount) - Number(a.total_amount);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [transactions, sortKey, filter]);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={Wallet}
          label="Total Invested"
          value={formatCurrency(totals.invested)}
          sub={`${totals.unitsBought} units bought`}
          tone="slate"
        />
        <Kpi
          icon={Tag}
          label="Total Revenue"
          value={formatCurrency(totals.revenue)}
          sub={`${totals.unitsSold} units sold`}
          tone="emerald"
        />
        <Kpi
          icon={totals.profit >= 0 ? TrendingUp : TrendingDown}
          label="Net Profit"
          value={formatCurrency(totals.profit)}
          sub={`${totals.margin.toFixed(1)}% margin`}
          tone={totals.profit >= 0 ? 'emerald' : 'rose'}
        />
        <Kpi
          icon={BikeIcon}
          label="Inventory Value"
          value={formatCurrency(totals.inventoryValue)}
          sub={`${bikes.reduce((s, b) => s + b.stock, 0)} units in stock`}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profit by bike */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Profit by Model</h3>
          {byBike.length === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-400">No sales yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {byBike.slice(0, 8).map((b) => {
                const maxAbs = Math.max(...byBike.map((x) => Math.abs(x.profit)), 1);
                return (
                  <div key={b.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">{b.name}</span>
                      <span className={`font-semibold ${b.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(b.profit)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${b.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${(Math.abs(b.profit) / maxAbs) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Financial Summary</h3>
          <div className="mt-4 space-y-2.5 text-sm">
            <Row label="Purchases (COGS basis)" value={formatCurrency(totals.invested)} icon={ShoppingCart} />
            <Row label="Cost of goods sold" value={formatCurrency(totals.cogs)} icon={TrendingDown} muted />
            <Row label="Gross revenue" value={formatCurrency(totals.revenue)} icon={Tag} />
            <div className="my-2 h-px bg-slate-200" />
            <Row
              label="Net profit"
              value={formatCurrency(totals.profit)}
              icon={totals.profit >= 0 ? TrendingUp : TrendingDown}
              bold
              tone={totals.profit >= 0 ? 'emerald' : 'rose'}
            />
            <Row label="Profit margin" value={`${totals.margin.toFixed(1)}%`} muted />
            <Row label="Inventory on hand" value={formatCurrency(totals.inventoryValue)} muted />
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Transaction History</h3>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(['all', 'purchase', 'sale'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                    filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSortKey((k) => (k === 'date' ? 'amount' : 'date'))}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition hover:text-slate-900"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortKey === 'date' ? 'Date' : 'Amount'}
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-400">No transactions yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Bike</th>
                  <th className="py-2 pr-3 font-medium">Qty</th>
                  <th className="py-2 pr-3 font-medium">Unit</th>
                  <th className="py-2 pr-3 font-medium">Total</th>
                  <th className="py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          t.type === 'purchase' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-700">{t.bike_name_snapshot}</td>
                    <td className="py-2.5 pr-3 text-slate-500">{t.quantity}</td>
                    <td className="py-2.5 pr-3 text-slate-500">{formatCurrency(Number(t.unit_price))}</td>
                    <td className="py-2.5 pr-3 font-semibold text-slate-900">{formatCurrency(Number(t.total_amount))}</td>
                    <td className="py-2.5 text-xs text-slate-400">
                      {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function avgCost(purchases: Transaction[], bikeId: string | null): number {
  if (!bikeId) return 0;
  const p = purchases.filter((t) => t.bike_id === bikeId);
  const units = p.reduce((s, t) => s + t.quantity, 0);
  const cost = p.reduce((s, t) => s + Number(t.total_amount), 0);
  return units > 0 ? cost / units : 0;
}

const TONES: Record<string, { icon: string; text: string }> = {
  slate: { icon: 'text-slate-700 bg-slate-100 border-slate-200', text: 'text-slate-900' },
  emerald: { icon: 'text-emerald-600 bg-emerald-50 border-emerald-200', text: 'text-emerald-600' },
  rose: { icon: 'text-rose-600 bg-rose-50 border-rose-200', text: 'text-rose-600' },
  amber: { icon: 'text-amber-600 bg-amber-50 border-amber-200', text: 'text-amber-600' },
};

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-lg border p-2 ${TONES[tone].icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
  muted,
  bold,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  muted?: boolean;
  bold?: boolean;
  tone?: keyof typeof TONES;
}) {
  const color = tone ? TONES[tone].text : muted ? 'text-slate-500' : 'text-slate-900';
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-600">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        {label}
      </span>
      <span className={`${color} ${bold ? 'text-base font-bold' : ''}`}>{value}</span>
    </div>
  );
}
