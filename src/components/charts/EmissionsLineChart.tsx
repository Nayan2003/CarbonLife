'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DayData {
  date: string;
  label: string;
  transport: number;
  cooking: number;
  electricity: number;
  food: number;
  shopping: number;
  total: number;
}

const COLORS = {
  transport: '#3b82f6',
  cooking: '#f59e0b',
  electricity: '#8b5cf6',
  food: '#10b981',
  shopping: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{
      background: '#0f1e35', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '12px 16px', fontSize: 13,
    }}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{p.name}:</span>
          <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{p.value.toFixed(2)} kg</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, paddingTop: 8 }}>
        <span style={{ color: '#94a3b8' }}>Total: </span>
        <span style={{ color: '#34d399', fontWeight: 700 }}>{total.toFixed(2)} kg CO₂</span>
      </div>
    </div>
  );
};

export default function EmissionsLineChart({ data }: { data: DayData[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
        <defs>
          {Object.entries(COLORS).map(([key, color]) => (
            <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => `${v}kg`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle" iconSize={8}
          wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 12 }}
        />
        {Object.entries(COLORS).map(([key, color]) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={color}
            fill={`url(#grad-${key})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
