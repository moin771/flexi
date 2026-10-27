import { useMemo, useState } from 'react';
import type { Bike, NewTransaction } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import BikeCard, { formatCurrency } from '@/components/BikeCard';
import Bike3DViewer from '@/components/Bike3DViewer';
import { ShoppingCart, Check, Loader2, ArrowRight } from 'lucide-react';

interface PurchaseProps {
  bikes: Bike[];
  onBikesChanged: () => void;
}

export default function Purchase({ bikes, onBikesChanged }: PurchaseProps) {
  const [selected, setSelected] = useState<Bike | null>(null);
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...bikes].sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name)),
    [bikes],
  );

  const effectivePrice = unitPrice ?? selected?.price ?? 0;
  const total = effectivePrice * qty;

  const onSelect = (bike: Bike) => {
    setSelected(bike);
    setUnitPrice(null);
    setQty(1);
    setColor(bike.color);
    setNotes('');
    setSuccess(false);
    setError(null);
  };

  const handlePurchase = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const tx: NewTransaction = {
        type: 'purchase',
        bike_id: selected.id,
        bike_name_snapshot: `${selected.brand} ${selected.name}`,
        quantity: qty,
        unit_price: effectivePrice,
        total_amount: total,
        color,
        notes: notes || null,
      };
      const { error: txErr } = await supabase.from('transactions').insert(tx);
      if (txErr) throw txErr;
      const { error: stockErr } = await supabase
        .from('bikes')
        .update({ stock: selected.stock + qty, price: effectivePrice })
        .eq('id', selected.id);
      if (stockErr) throw stockErr;
      setSuccess(true);
      onBikesChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Purchase failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,420px)]">
      {/* Catalog picker */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-600">
          <ShoppingCart className="h-5 w-5 text-slate-700" />
          <p className="text-sm">Select a bike from the catalog to purchase into dealership inventory.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((bike) => (
            <BikeCard
              key={bike.id}
              bike={bike}
              onClick={onSelect}
              selected={selected?.id === bike.id}
              footer={
                <div className="mt-3 flex items-center justify-end text-xs font-medium text-slate-600">
                  Select <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              }
            />
          ))}
        </div>
      </div>

      {/* Purchase panel */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">Purchase Order</h2>
            <p className="text-xs text-slate-500">Acquire stock from the manufacturer</p>
          </div>

          {!selected ? (
            <div className="flex h-72 flex-col items-center justify-center gap-2 text-slate-300">
              <ShoppingCart className="h-10 w-10" />
              <p className="text-sm text-slate-400">Pick a bike to begin</p>
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
                  <p className="text-xs uppercase tracking-wide text-slate-500">{selected.brand}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{selected.name}</h3>
                  <div className="mt-3">
                    <Bike3DViewer bike={{ ...selected, color }} size={300} autoRotate={false} />
                  </div>
                </div>
              </div>

              <Field label="Quantity">
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                />
              </Field>

              <Field label={`Unit cost (MSRP ${formatCurrency(selected.price)})`}>
                <input
                  type="number"
                  min={0}
                  value={unitPrice ?? ''}
                  placeholder={String(selected.price)}
                  onChange={(e) => setUnitPrice(e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                />
              </Field>

              <Field label="Color / livery">
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                />
              </Field>

              <Field label="Notes (optional)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                />
              </Field>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Total cost</span>
                <span className="text-xl font-bold text-slate-900">{formatCurrency(total)}</span>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                  <Check className="h-4 w-4" /> Purchase recorded — inventory updated.
                </div>
              )}

              <button
                onClick={handlePurchase}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                Confirm Purchase
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
