import { useState } from 'react';
import type { Bike } from '@/lib/supabase';

interface BikeCardProps {
  bike: Bike;
  onClick?: (bike: Bike) => void;
  footer?: React.ReactNode;
  selected?: boolean;
  compact?: boolean;
}

const CATEGORY_STYLES: Record<string, string> = {
  Sport: 'text-rose-600 bg-rose-50 border-rose-200',
  Naked: 'text-amber-600 bg-amber-50 border-amber-200',
  'Sport-Touring': 'text-sky-600 bg-sky-50 border-sky-200',
  Adventure: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Roadster: 'text-violet-600 bg-violet-50 border-violet-200',
};

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function BikeCard({ bike, onClick, footer, selected, compact }: BikeCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const catStyle = CATEGORY_STYLES[bike.category] ?? 'text-slate-600 bg-slate-100 border-slate-200';

  return (
    <button
      onClick={() => onClick?.(bike)}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        selected ? 'border-slate-900 ring-2 ring-slate-900/15' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-slate-100" />}
        {bike.image_url ? (
          <img
            src={bike.image_url}
            alt={`${bike.brand} ${bike.name}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <span className="text-xs">No image</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Category badge */}
        <span
          className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${catStyle}`}
        >
          {bike.category}
        </span>
        {/* Stock badge */}
        {bike.stock > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            {bike.stock} in stock
          </span>
        )}
        {/* Name on image */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/70">{bike.brand}</p>
          <h3 className="text-base font-bold leading-tight text-white drop-shadow-md">{bike.name}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {!compact && (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Engine" value={`${bike.engine_cc}cc`} />
              <Stat label="Power" value={`${bike.power_hp}hp`} />
              <Stat label="Top Speed" value={`${bike.top_speed_kmh}`} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <Stat label="Weight" value={`${bike.weight_kg}kg`} />
              <Stat label="PWR" value={`${(bike.power_hp / bike.weight_kg).toFixed(2)}`} />
            </div>
          </>
        )}

        <div className="mt-3 flex items-end justify-between pt-1">
          <div>
            <span className="text-[10px] uppercase tracking-wide text-slate-400">MSRP</span>
            <div className="text-lg font-bold text-slate-900">{formatCurrency(bike.price)}</div>
          </div>
          {bike.stock === 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              not stocked
            </span>
          )}
        </div>

        {footer}
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-1 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-slate-700">{value}</div>
    </div>
  );
}
