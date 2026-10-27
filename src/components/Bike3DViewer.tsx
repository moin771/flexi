import { useState, useRef, useEffect } from 'react';
import type { Bike } from '@/lib/supabase';

interface Bike3DViewerProps {
  bike: Bike;
  size?: number;
  autoRotate?: boolean;
}

const COLOR_SWATCHES: Record<string, string> = {
  Red: '#dc2626',
  'Ducati Red': '#e60012',
  'Race Blu': '#1e3a8a',
  'Team Yamaha Blue': '#0ea5e9',
  'Storm Fluo': '#0f172a',
  'Mirror Impact Black': '#0a0a0a',
  'Pearl Storm Gray': '#4b5563',
  'Metallic Matte Carbon Gray': '#1f2937',
  'Glass Sparkle Black': '#111827',
  'Grand Prix Red': '#dc2626',
  'Matte Gunpowder Black': '#1f2937',
  'Lightwhite/Motorsport': '#f8fafc',
  'Racing Red': '#dc2626',
  'Racing Yellow': '#facc15',
  'April Black': '#0a0a0a',
  'Aprilia Black': '#0a0a0a',
  'Red/Silver': '#dc2626',
  'Crystal White': '#f1f5f9',
  'Sapphire Black': '#0f172a',
  'Cosmic Yellow': '#facc15',
  'Aviator Grey': '#6b7280',
  Sandstorm: '#d4a373',
  'KTM Orange': '#f97316',
  'Storm Grey': '#4b5563',
};

function resolveColor(name: string): string {
  return COLOR_SWATCHES[name] ?? '#dc2626';
}

export default function Bike3DViewer({ bike, size = 320, autoRotate = true }: Bike3DViewerProps) {
  const [rotation, setRotation] = useState(0);
  const [tilt, setTilt] = useState(8);
  const [auto, setAuto] = useState(autoRotate);
  const [color, setColor] = useState(resolveColor(bike.color));
  const dragRef = useRef<{ x: number; y: number; rot: number; tilt: number } | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setColor(resolveColor(bike.color));
  }, [bike.color]);

  useEffect(() => {
    if (!auto) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setRotation((r) => (r + dt * 22) % 360);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [auto]);

  const onPointerDown = (e: React.PointerEvent) => {
    setAuto(false);
    dragRef.current = { x: e.clientX, y: e.clientY, rot: rotation, tilt };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setRotation((dragRef.current.rot + dx * 0.5) % 360);
    setTilt(Math.max(-20, Math.min(35, dragRef.current.tilt - dy * 0.3)));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const flip = Math.cos((rotation * Math.PI) / 180);
  const facingBack = flip < 0;
  const squash = Math.max(0.55, 1 - Math.abs(Math.sin((tilt * Math.PI) / 180)) * 0.35);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative select-none cursor-grab active:cursor-grabbing touch-none rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200"
        style={{ width: size, height: size * 0.62 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Turntable disc + glow */}
        <div
          className="absolute left-1/2 bottom-2 -translate-x-1/2 rounded-full"
          style={{
            width: size * 0.78,
            height: size * 0.78 * 0.28,
            background: `radial-gradient(ellipse at center, ${color}22 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
        <div
          className="absolute left-1/2 bottom-1 -translate-x-1/2 rounded-full border border-slate-300/40"
          style={{
            width: size * 0.7,
            height: size * 0.7 * 0.22,
            background:
              'conic-gradient(from 0deg, rgba(0,0,0,0.04), rgba(0,0,0,0.10), rgba(0,0,0,0.03), rgba(0,0,0,0.10))',
            transform: `rotateX(72deg) rotateZ(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        />

        {/* Bike */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `perspective(620px) rotateX(${tilt}deg) scaleY(${squash})`,
            transformStyle: 'preserve-3d',
          }}
        >
          <svg
            viewBox="0 0 400 200"
            width={size * 0.92}
            height={size * 0.46}
            style={{ transform: `scaleX(${Math.abs(flip) * (facingBack ? -1 : 1)})` }}
          >
            <defs>
              <linearGradient id={`body-${bike.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="1" />
                <stop offset="55%" stopColor={color} stopOpacity="0.92" />
                <stop offset="100%" stopColor="#0b0b0b" stopOpacity="0.85" />
              </linearGradient>
              <radialGradient id={`wheel-${bike.id}`} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#1f2937" />
                <stop offset="70%" stopColor="#0a0a0a" />
                <stop offset="100%" stopColor="#000" />
              </radialGradient>
              <linearGradient id={`rim-${bike.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e5e7eb" />
                <stop offset="100%" stopColor="#6b7280" />
              </linearGradient>
              <filter id={`shadow-${bike.id}`}>
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.35" />
              </filter>
            </defs>

            <g filter={`url(#shadow-${bike.id})`}>
              {/* Wheels */}
              {[70, 320].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy={150} r={42} fill={`url(#wheel-${bike.id})`} stroke="#1f2937" strokeWidth="2" />
                  <circle cx={cx} cy={150} r={30} fill="none" stroke={`url(#rim-${bike.id})`} strokeWidth="3" />
                  <circle cx={cx} cy={150} r={6} fill="#6b7280" />
                  {[0, 45, 90, 135].map((a) => (
                    <line
                      key={a}
                      x1={cx}
                      y1={150}
                      x2={cx + 28 * Math.cos((a + rotation) * (Math.PI / 180))}
                      y2={150 + 28 * Math.sin((a + rotation) * (Math.PI / 180))}
                      stroke="#4b5563"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              ))}

              {/* Swingarm */}
              <path d="M320 150 L210 150 L200 130 L300 128 Z" fill="#1f2937" />

              {/* Fuel tank / bodywork */}
              <path
                d="M120 110 Q160 60 215 58 Q270 60 295 110 L300 130 L120 135 Z"
                fill={`url(#body-${bike.id})`}
                stroke="#0b0b0b"
                strokeWidth="1.5"
              />
              <path d="M150 95 Q200 70 255 88" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="4" fill="none" strokeLinecap="round" />

              {/* Seat / tail */}
              <path d="M120 110 Q95 112 78 120 L70 138 L120 135 Z" fill="#0f172a" stroke="#0b0b0b" strokeWidth="1" />

              {/* Front fairing */}
              <path d="M295 110 Q330 95 350 120 L340 150 L300 130 Z" fill={`url(#body-${bike.id})`} stroke="#0b0b0b" strokeWidth="1.5" />

              {/* Windscreen */}
              <path d="M300 110 Q322 80 345 108 L335 118 Q318 100 300 112 Z" fill="#0ea5e9" opacity="0.35" />

              {/* Headlight */}
              <ellipse cx={342} cy={132} rx="9" ry="7" fill="#fde047" opacity="0.9" />

              {/* Exhaust */}
              <path d="M60 150 L40 148 L38 158 L62 158 Z" fill="#9ca3af" />
              <circle cx={40} cy={153} r="5" fill="#374151" />

              {/* Clip-on bars */}
              <line x1="300" y1="120" x2="280" y2="105" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
              <line x1="300" y1="120" x2="318" y2="108" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Rotation indicator */}
        <div className="absolute top-1 right-1 flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-slate-600 backdrop-blur shadow-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${auto ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {auto ? 'Auto' : `${Math.round(rotation)}°`}
        </div>
      </div>

      {/* Customization controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setAuto((a) => !a)}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {auto ? 'Pause rotation' : 'Auto-rotate'}
        </button>
        <div className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2 py-1">
          {Object.entries(COLOR_SWATCHES)
            .filter(
              ([n]) =>
                n === bike.color ||
                ['Ducati Red', 'Racing Yellow', 'KTM Orange', 'Lightwhite/Motorsport', 'Sapphire Black', 'Aviator Grey'].includes(n)
            )
            .map(([name, hex]) => (
              <button
                key={name}
                title={name}
                onClick={() => setColor(hex)}
                className={`h-5 w-5 rounded-full border-2 transition ${
                  color === hex ? 'border-slate-900 scale-110' : 'border-slate-200 hover:border-slate-400'
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
        </div>
      </div>
      <p className="text-center text-xs text-slate-400">Drag to rotate &amp; tilt · pick a color to customize</p>
    </div>
  );
}
