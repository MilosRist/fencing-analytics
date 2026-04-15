// src/components/FencerCharts.tsx
import { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatPoints } from '../lib/format';

export interface PointsStrand {
  key: string;
  label: string;
  points: Array<{ n: number; name: string; points: number; cumulative: number }>;
}

export interface EloStrandHistory {
  key: string;
  label: string;
  history: Array<{ name: string; rating: number }>;
}

interface Props {
  data: {
    pointsStrands: PointsStrand[];
    eloHistoryStrands: EloStrandHistory[];
    wlByWeapon: Array<{ weapon: string; wins: number; losses: number }>;
  };
}

const WEAPON_COLORS: Record<string, string> = {
  Epee: '#4d78ff',
  Foil: '#22c55e',
  Saber: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1629] border border-white/20 rounded-xl p-3 text-xs shadow-xl">
      <div className="text-slate-400 mb-1.5 font-medium">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold tabular-nums">
            {typeof p.value === 'number' ? formatPoints(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function FencerCharts({ data }: Props) {
  const { pointsStrands, eloHistoryStrands, wlByWeapon } = data;

  const [eloIdx, setEloIdx] = useState(0);

  const eloData = eloHistoryStrands[eloIdx]?.history ?? [];

  const hasPoints = pointsStrands.some((s) => (s.points?.length ?? 0) > 1);
  const hasElo = eloData.length > 1;
  const hasWL = wlByWeapon.length > 0;

  const strandSelectClass =
    'mt-2 w-full text-xs rounded-lg border border-white/10 bg-white/5 text-slate-300 px-2 py-1.5';

  const pointsTimeline = useMemo(() => {
    if (pointsStrands.length === 0) return [];
    const maxN = Math.max(0, ...pointsStrands.map((s) => s.points.length));
    const rows = Array.from({ length: maxN }, (_, i) => ({
      n: i + 1,
      t: 'T' + (i + 1),
    })) as Array<Record<string, any>>;

    for (const s of pointsStrands) {
      for (const p of s.points) {
        // n is 1-based; write cumulative at index n-1
        rows[p.n - 1][s.key] = p.cumulative;
      }
    }
    return rows;
  }, [pointsStrands]);

  const colorForStrand = useMemo(() => {
    // Deterministic, high-contrast colors per strand key.
    // We intentionally do NOT color purely by weapon, because multiple strands
    // (season/category) can share a weapon and would become indistinguishable.
    const map = new Map<string, string>();
    for (const s of pointsStrands) {
      let h = 0;
      for (let i = 0; i < s.key.length; i++) h = (h * 31 + s.key.charCodeAt(i)) >>> 0;
      // Spread hues using a golden-angle step for better separation.
      const hue = (h * 137.50776405) % 360;
      map.set(s.key, `hsl(${hue.toFixed(1)} 78% 58%)`);
    }
    return map;
  }, [pointsStrands]);

  if (!hasPoints && !hasElo && !hasWL) return null;

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      {pointsStrands.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-slate-400 uppercase tracking-wide mb-1">
            Points trajectory
          </h3>
          <p className="text-[11px] text-slate-500 mb-3">
            Cumulative points within each season · weapon · category — not merged across disciplines.
          </p>
          {hasPoints ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pointsTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="n" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                {pointsStrands.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={colorForStrand.get(s.key) ?? '#4d78ff'}
                    strokeWidth={2.25}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">Add more than one result in this strand to plot a curve.</p>
          )}
        </div>
      )}

      {eloHistoryStrands.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-slate-400 uppercase tracking-wide mb-1">ELO history</h3>
          <p className="text-[11px] text-slate-500 mb-3">Rating changes for one discipline strand at a time.</p>
          {eloHistoryStrands.length > 1 && (
            <select className={strandSelectClass} value={eloIdx} onChange={(e) => setEloIdx(Number(e.target.value))}>
              {eloHistoryStrands.map((s, i) => (
                <option key={s.key} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
          {hasElo ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={eloData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rating" name="ELO" stroke="#a855f7" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">Not enough rated bouts in this strand for a history line.</p>
          )}
        </div>
      )}

      {hasWL && (
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-slate-400 uppercase tracking-wide mb-4">Win / loss by weapon</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wlByWeapon} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="weapon" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey="wins" name="Wins" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="losses" name="Losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
