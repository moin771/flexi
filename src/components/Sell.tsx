import { useMemo, useState, useEffect } from 'react';
import type { Bike, NewTransaction, Transaction } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/components/BikeCard';
import Bike3DViewer from '@/components/Bike3DViewer';
import { Tag, Check, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface SellProps {
  bikes: Bike[];
  transactions: Transaction[];
  onBikesChanged: () => void;
  onTransactionsChanged: () => void;
}

/** Average purchase cost per unit for a bike, from purchase transactions. */
function avgPurchaseCost(transactions: Transaction[], bikeId: string): number {
  const purchases = transactions.filter((t) => t.bike_id === bikeId && t.type === 'purchase');
  const units = purchases.reduce((s, t) => s + t.quantity, 0);
  const cost = purchases.reduce((s, t) => s + Number(t.total_amount), 0);
  return units > 0 ? cost / units : 0;
}

export default function Sell({ bikes, transactions, onBikesChanged, onTransactionsChanged }: SellProps) {
  const inStock = useMemo(
    () => bikes.filter((b) => b.stock > 0).sort((a, b) => a.brand.localeCompare(b.brand)),
    [bikes],
  );
  const [selected, setSelected] = useState<Bike | null>(null);
  const [qty, setQty] = useState(1);
  const [sellPrice, setSellPrice] = useState<number | null>(null);
  const [color, setColor] = useState('');
  const [customer, setCustomer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ profit: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unitCost = selected ? avgPurchaseCost(transactions, selected.id) : 0;
  const effectiveSell = sellPrice ?? selected?.price ?? 0;
  const totalRevenue = effectiveSell * qty;
  const totalCost = unitCost * qty;
  const profit = totalRevenue - totalCost;
  const maxQty = selected?.stock ?? 0;

  useEffect(() => {
    if (selected && qty > selected.stock) setQty(selected.stock);
  }, [selected, qty]);

  const onSelect = (bike: Bike) => {
    setSelected(bike);
    setQty(1);
    setSellPrice(null);
    setColor(bike.color);
    setCustomer('');
    setSuccess(null);
    setError(null);
  };

  const handleSell = async () => {
    if (!selected) return;
    if (qty > selected.stock) {
      setError(`Only ${selected.stock} in stock.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const tx: NewTransaction = {
        type: 'sale',
        bike_id: selected.id,
        bike_name_snapshot: `${selected.brand} ${selected.name}`,
        quantity: qty,
        unit_price: effectiveSell,
        total_amount: totalRevenue,
        color,
        notes: customer ? `Customer: ${customer}` : null,
      };
      const { error: txErr } = await supabase.from('transactions').insert(tx);
      if (txErr) throw txErr;
      const { error: stockErr } = await supabase
        .from('bikes')
        .update({ stock: Math.max(0, selected.stock - qty) })
        .eq('id', selected.id);
      if (stockErr) throw stockErr;
      setSuccess({ profit });
      onBikesChanged();
      onTransactionsChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,440px)]">
      {/* In-stock picker */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Tag className="h-5 w-5 text-emerald-600" />
          <p className="text-sm">Select a bike in stock to record a sale and instantly see profit.</p>
        </div>
        {inStock.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-300">
            <Tag className="h-8 w-8" />
            <p className="text-sm text-slate-400">No inventory yet — purchase bikes first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {inStock.map((bike) => {
              const cost = avgPurchaseCost(transactions, bike.id);
              const margin = bike.price - cost;
              return (
                <button
                  key={bike.id}
                  onClick={() => onSelect(bike)}
                  className={`group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    selected?.id === bike.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                    {bike.image_url ? (
                      <img
                        src={bike.image_url}
                        alt={bike.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-100" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <p className="text-[9px] uppercase tracking-wider text-white/60">{bike.brand}</p>
                      <h3 className="text-sm font-semibold text-white drop-shadow">{bike.name}</h3>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">
                        Stock: <span className="font-semibold text-slate-900">{bike.stock}</span>
                      </span>
                      <span className="text-slate-500">
                        Cost: <span className="text-slate-900">{formatCurrency(cost)}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">
                        Sell: <span className="text-slate-900">{formatCurrency(bike.price)}</span>
                      </span>
                      <span className={`flex items-center gap-0.5 font-semibold ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {margin >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {formatCurrency(margin)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sell panel */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">Record Sale</h2>
            <p className="text-xs text-slate-500">Sell a bike from inventory — profit is computed live</p>
          </div>

          {!selected ? (
            <div className="flex h-72 flex-col items-center justify-center gap-2 text-slate-300">
              <Tag className="h-10 w-10" />
              <p className="text-sm text-slate-400">Pick an in-stock bike</p>
            </div>
          ) : (
            <div className="space-y-5 p-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {selected.image_url ? (
                  <img src={selected.image_url} alt={selected.name} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-slate-100" />
                )}
                <div className="bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-600">{selected.brand}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{selected.name}</h3>
                  <div className="mt-2">
                    <Bike3DViewer bike={{ ...selected, color }} size={300} autoRotate={false} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={`Quantity (max ${maxQty})`}>
                  <input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={qty}
                    onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </Field>
                <Field label={`Unit sell price (MSRP ${formatCurrency(selected.price)})`}>
                  <input
                    type="number"
                    min={0}
                    value={sellPrice ?? ''}
                    placeholder={String(selected.price)}
                    onChange={(e) => setSellPrice(e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </Field>
              </div>

              <Field label="Color / livery">
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                />
              </Field>

              <Field label="Customer name (optional)">
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                />
              </Field>

              {/* Live P&L */}
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Row label="Revenue" value={formatCurrency(totalRevenue)} />
                <Row label="Cost of goods" value={`- ${formatCurrency(totalCost)}`} muted />
                <div className="my-1 h-px bg-slate-200" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Profit</span>
                  <span className={`flex items-center gap-1 text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {formatCurrency(profit)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                  <Check className="h-4 w-4" /> Sale recorded — profit {formatCurrency(success.profit)}.
                </div>
              )}

              <button
                onClick={handleSell}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                Confirm Sale
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={muted ? 'text-slate-500' : 'text-slate-900'}>{value}</span>
    </div>
  );
}
