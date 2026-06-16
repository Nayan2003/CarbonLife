'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatKg } from '@/lib/emissions';

interface DataPoint { name: string; value: number; color: string; }

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f1e35', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: payload[0].payload.color }} />
        <span style={{ color: '#94a3b8' }}>{payload[0].name}:</span>
        <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{payload[0].value.toFixed(2)} kg</span>
      </div>
    </div>
  );
};

export default function CategoryDonutChart({ data, total }: { data: DataPoint[]; total: number }) {
  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -150%)', // made changes 'translate(-50%, -50%)
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', fontFamily: 'Space Grotesk, sans-serif' }}>
          {formatKg(total)}
        </div>
        <div style={{ fontSize: 10, color: '#64748b' }}>this week</div>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>{d.name}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{d.value.toFixed(1)} kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}
