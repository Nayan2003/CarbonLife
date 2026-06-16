'use client';

import { useEffect, useRef, useState } from 'react';

interface Equivalent {
  icon: string;
  value: number;
  unit: string;
  label: string;
  color: string;
}

function calcEquivalents(kgCO2: number): Equivalent[] {
  if (kgCO2 <= 0) return [];
  return [
    {
      icon: '🚗',
      value: parseFloat((kgCO2 / 0.21).toFixed(1)),
      unit: 'km',
      label: 'driven by car',
      color: '#3b82f6',
    },
    {
      icon: '🌳',
      value: parseFloat((kgCO2 / 9.1).toFixed(2)),
      unit: 'trees',
      label: 'needed to absorb (1 yr)',
      color: '#10b981',
    },
    {
      icon: '⛽',
      value: parseFloat((kgCO2 / 2.31).toFixed(1)),
      unit: 'litres',
      label: 'of petrol burned',
      color: '#f59e0b',
    },
    {
      icon: '✈️',
      value: parseFloat((kgCO2 / 0.255).toFixed(0)),
      unit: 'km',
      label: 'of flight (economy)',
      color: '#a78bfa',
    },
    {
      icon: '📱',
      value: Math.round(kgCO2 / 0.00822),
      unit: 'charges',
      label: 'of a smartphone',
      color: '#22d3ee',
    },
    {
      icon: '💡',
      value: parseFloat((kgCO2 / 0.82).toFixed(1)),
      unit: 'kWh',
      label: 'of electricity (Indian grid)',
      color: '#fbbf24',
    },
  ];
}

function CountUp({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) return;
    startRef.current = null;
    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrent(parseFloat((eased * target).toFixed(target % 1 !== 0 ? 1 : 0)));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return <>{current}</>;
}

interface CO2EquivalentsProps {
  kgCO2: number;
}

export default function CO2Equivalents({ kgCO2 }: CO2EquivalentsProps) {
  const equivalents = calcEquivalents(kgCO2);

  if (kgCO2 <= 0) return null;

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      overflowX: 'auto',
      paddingBottom: 4,
      scrollbarWidth: 'none',
    }}>
      {equivalents.map((eq) => (
        <div
          key={eq.label}
          style={{
            flexShrink: 0,
            background: `${eq.color}0f`,
            border: `1px solid ${eq.color}25`,
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minWidth: 130,
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = `${eq.color}1f`;
            (e.currentTarget as HTMLDivElement).style.borderColor = `${eq.color}50`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = `${eq.color}0f`;
            (e.currentTarget as HTMLDivElement).style.borderColor = `${eq.color}25`;
          }}
        >
          <div style={{ fontSize: 22 }}>{eq.icon}</div>
          <div style={{
            fontSize: 20,
            fontWeight: 800,
            color: eq.color,
            fontFamily: 'Space Grotesk, sans-serif',
            lineHeight: 1,
          }}>
            <CountUp target={eq.value} />
            <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 3 }}>{eq.unit}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>{eq.label}</div>
        </div>
      ))}
    </div>
  );
}
