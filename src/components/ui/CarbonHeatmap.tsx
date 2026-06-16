'use client';

import { useState } from 'react';
import { format, subDays } from 'date-fns';

interface HeatmapDay {
  date: string;
  kg: number;
}

interface CarbonHeatmapProps {
  activities: { date: string; estimatedCO2: number }[];
  days?: number;
}

function getColor(kg: number, max: number): { bg: string; border: string; glow: string } {
  if (kg === 0) return { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)', glow: 'none' };
  const ratio = Math.min(kg / Math.max(max, 1), 1);
  if (ratio < 0.25) return { bg: 'rgba(52,211,153,0.25)', border: 'rgba(52,211,153,0.5)', glow: '0 0 6px rgba(52,211,153,0.3)' };
  if (ratio < 0.5)  return { bg: 'rgba(251,191,36,0.25)',  border: 'rgba(251,191,36,0.5)',  glow: '0 0 6px rgba(251,191,36,0.3)'  };
  if (ratio < 0.75) return { bg: 'rgba(251,146,60,0.3)',   border: 'rgba(251,146,60,0.6)',   glow: '0 0 6px rgba(251,146,60,0.35)'  };
  return { bg: 'rgba(248,113,113,0.35)', border: 'rgba(248,113,113,0.7)', glow: '0 0 8px rgba(248,113,113,0.4)' };
}

function getLevelLabel(kg: number, max: number): string {
  if (kg === 0) return 'No data';
  const ratio = kg / Math.max(max, 1);
  if (ratio < 0.25) return 'Low 🟢';
  if (ratio < 0.5)  return 'Moderate 🟡';
  if (ratio < 0.75) return 'High 🟠';
  return 'Very High 🔴';
}

export default function CarbonHeatmap({ activities, days = 35 }: CarbonHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ day: HeatmapDay; x: number; y: number } | null>(null);

  // Build day array — last N days
  const dayMap: Record<string, number> = {};
  activities.forEach((a) => {
    dayMap[a.date] = (dayMap[a.date] || 0) + a.estimatedCO2;
  });

  const allDays: HeatmapDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateStr = format(d, 'yyyy-MM-dd');
    allDays.push({ date: dateStr, kg: dayMap[dateStr] || 0 });
  }

  const maxKg = Math.max(...allDays.map((d) => d.kg), 1);

  // Group into weeks (columns of 7)
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const totalKg = allDays.reduce((s, d) => s + d.kg, 0);
  const activeDays = allDays.filter((d) => d.kg > 0).length;

  return (
    <div style={{ position: 'relative' }}>
      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399', fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalKg.toFixed(1)} kg
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>total past {days} days</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa', fontFamily: 'Space Grotesk, sans-serif' }}>
            {activeDays}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>days tracked</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24', fontFamily: 'Space Grotesk, sans-serif' }}>
            {activeDays > 0 ? (totalKg / activeDays).toFixed(1) : '0'} kg
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>avg per active day</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2 }}>
          {dayLabels.map((lbl) => (
            <div key={lbl} style={{
              height: 18, fontSize: 10, color: 'var(--text-muted)',
              width: 28, display: 'flex', alignItems: 'center',
            }}>
              {lbl}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {week.map((day) => {
              const c = getColor(day.kg, maxKg);
              const isToday = day.date === format(new Date(), 'yyyy-MM-dd');
              return (
                <div
                  key={day.date}
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setTooltip({ day, x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    background: c.bg,
                    border: `1px solid ${isToday ? '#60a5fa' : c.border}`,
                    boxShadow: isToday ? '0 0 0 1.5px #60a5fa40, ' + c.glow : c.glow,
                    cursor: 'pointer',
                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                    transform: tooltip?.day.date === day.date ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Less</span>
        {[
          'rgba(255,255,255,0.06)',
          'rgba(52,211,153,0.25)',
          'rgba(251,191,36,0.25)',
          'rgba(251,146,60,0.3)',
          'rgba(248,113,113,0.35)',
        ].map((bg, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: 3,
            background: bg,
            border: '1px solid rgba(255,255,255,0.1)',
          }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>More CO₂</span>
      </div>

      {/* Floating Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 24,
          top: tooltip.y - 10,
          background: '#0f1f35',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          padding: '10px 14px',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          minWidth: 140,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {format(new Date(tooltip.day.date + 'T00:00:00'), 'EEE, MMM d')}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399', fontFamily: 'Space Grotesk, sans-serif' }}>
            {tooltip.day.kg > 0 ? `${tooltip.day.kg.toFixed(2)} kg` : '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {getLevelLabel(tooltip.day.kg, maxKg)}
          </div>
        </div>
      )}
    </div>
  );
}
