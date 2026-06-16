'use client';

import { useEffect, useRef } from 'react';

interface CarbonScoreProps {
  score: number; // 0-100
  weeklyKg: number;
  trend: number; // % change vs last week
  size?: number;
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#34d399'; // green
  if (score >= 40) return '#fbbf24'; // amber
  return '#f87171'; // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  if (score >= 20) return 'Needs Work';
  return 'Critical';
}

export default function CarbonScore({ score, weeklyKg, trend, size = 120 }: CarbonScoreProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const clampedScore = Math.max(0, Math.min(100, score));
  const color = getScoreColor(clampedScore);
  const label = getScoreLabel(clampedScore);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc goes from 225° to 315° (270° sweep = 3/4 circle)
  const sweepFraction = 0.75;
  const dashArray = circumference * sweepFraction;
  const dashOffset = dashArray - (clampedScore / 100) * dashArray;

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;
    // Start fully offset (empty), animate to target
    circle.style.strokeDashoffset = String(dashArray);
    const raf = requestAnimationFrame(() => {
      circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
      circle.style.strokeDashoffset = String(dashOffset);
    });
    return () => cancelAnimationFrame(raf);
  }, [clampedScore, dashArray, dashOffset]);

  const cx = size / 2;
  const cy = size / 2;
  // Rotate so arc starts at bottom-left and sweeps to bottom-right
  const rotation = 135;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* SVG Ring */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: `rotate(${rotation}deg)` }}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={10}
            strokeDasharray={`${dashArray} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Score arc */}
          <circle
            ref={circleRef}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeDasharray={`${dashArray} ${circumference}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
          />
        </svg>
        {/* Center label */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          transform: 'translateY(-4px)',
        }}>
          <span style={{
            fontSize: size * 0.22,
            fontWeight: 800,
            color,
            fontFamily: 'Space Grotesk, sans-serif',
            lineHeight: 1,
          }}>{Math.round(clampedScore)}</span>
          <span style={{ fontSize: size * 0.09, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>/100</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Carbon Score</div>
        <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'Space Grotesk, sans-serif' }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {weeklyKg.toFixed(1)} kg this week
        </div>
        {trend !== 0 && (
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: trend < 0 ? '#34d399' : '#f87171',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span>{trend < 0 ? '↓' : '↑'}</span>
            <span>{Math.abs(trend).toFixed(1)}% vs last week</span>
          </div>
        )}
      </div>
    </div>
  );
}
