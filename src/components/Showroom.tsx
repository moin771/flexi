import { useMemo, useState } from 'react';
import type { Bike } from '@/lib/supabase';
import BikeCard, { formatCurrency } from '@/components/BikeCard';
import Bike3DViewer from '@/components/Bike3DViewer';
import { X, Gauge, Zap, Wind, Weight, Search, Boxes, Box } from 'lucide-react';

interface ShowroomProps {
  bikes: Bike[];
  loading: boolean;
}

const CATEGORIES = ['All', 'Sport', 'Naked', 'Sport-Touring', 'Adventure', 'Roadster'];

const HERO_IMAGE = 'https://images.pexels.com/photos/13466560/pexels-photo-13466560.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function Showroom({ bikes, loading }: ShowroomProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [brand, setBrand] = useState('All');
  const [selected, setSelected] = useState<Bike | null>(null);

  const brands = useMemo(() => ['All', ...Array.from(new Set(bikes.map((b) => b.brand))).sort()], [bikes]);

  const filtered = useMemo(() => {
    return bikes.filter((b) => {
      if (category !== 'All' && b.category !== category) return false;
      if (brand !== 'All' && b.brand !== brand) return false;
      if (query && !`${b.name} ${b.brand}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [bikes, query, category, brand]);

  const totalUnits = bikes.reduce((s, b) => s + b.stock, 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        <img
          src={HERO_IMAGE}
          alt="Ducati Panigale on the open road"
          className="h-56 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">The Collection</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">Thirty superbikes. One showroom.</h2>
          <p className="mt-2 max-w-lg text-sm text-white/70">
            From the supercharged Ninja H2 to the Moto2-spec Triumph Daytona — explore the world's most exotic machines.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <HeroStat icon={Box} label="Models" value={`${bikes.length}`} />
            <HeroStat icon={Boxes} label="Units in stock" value={`${totalUnits}`} />
            <HeroStat icon={Gauge} label="Brands" value={`${brands.length - 1}`} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bikes or brands…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-white">
              {c}
            </option>
          ))}
        </select>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        >
          {brands.map((b) => (
            <option key={b} value={b} className="bg-white">
              {b}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-400">{filtered.length} bikes</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((bike) => (
            <BikeCard key={bike.id} bike={bike} onClick={setSelected} />
          ))}
        </div>
      )}

      {selected && <BikeDetailModal bike={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
      <Icon className="h-4 w-4 text-cyan-300" />
      <div>
        <div className="text-[9px] uppercase tracking-wide text-white/50">{label}</div>
        <div className="text-sm font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function BikeDetailModal({ bike, onClose }: { bike: Bike; onClose: () => void }) {
  const specs = [
    { icon: Gauge, label: 'Engine', value: `${bike.engine_cc} cc` },
    { icon: Zap, label: 'Power', value: `${bike.power_hp} hp` },
    { icon: Wind, label: 'Top Speed', value: `${bike.top_speed_kmh} km/h` },
    { icon: Weight, label: 'Weight', value: `${bike.weight_kg} kg` },
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero photo */}
        <div className="relative h-56 w-full overflow-hidden sm:h-64">
          {bike.image_url ? (
            <img src={bike.image_url} alt={`${bike.brand} ${bike.name}`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-slate-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">{bike.brand}</p>
            <h2 className="text-2xl font-bold text-white drop-shadow-lg sm:text-3xl">{bike.name}</h2>
          </div>
        </div>

        <div className="p-6">
          <Bike3DViewer bike={bike} size={380} />

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {specs.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <s.icon className="mx-auto h-5 w-5 text-slate-700" />
                <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{s.label}</div>
                <div className="text-sm font-semibold text-slate-900">{s.value}</div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">{bike.description}</p>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">MSRP</div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(bike.price)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">In Stock</div>
              <div className="text-2xl font-bold text-slate-900">{bike.stock}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
