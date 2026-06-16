'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getActivitiesByUser, getBaseline, getGoals } from '@/lib/firestore';
import { generateDashboardInsights, DashboardInsight } from '@/lib/gemini';
import { getCategoryColor, getCategoryIcon, formatKg } from '@/lib/emissions';
import { Activity, Baseline, Goal } from '@/lib/types';
import Sidebar from '@/components/layout/Sidebar';
import EmissionsLineChart from '@/components/charts/EmissionsLineChart';
import CategoryDonutChart from '@/components/charts/CategoryDonutChart';
import CarbonScore from '@/components/ui/CarbonScore';
import CO2Equivalents from '@/components/ui/CO2Equivalents';
import CarbonHeatmap from '@/components/ui/CarbonHeatmap';
import styles from './page.module.css';
import { format, subDays } from 'date-fns';

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

function buildWeekData(activities: Activity[]): DayData[] {
  const days: DayData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayActs = activities.filter((a) => a.date === dateStr);
    const transport = dayActs.filter((a) => a.type === 'transport').reduce((s, a) => s + a.estimatedCO2, 0);
    const cooking = dayActs.filter((a) => a.type === 'cooking').reduce((s, a) => s + a.estimatedCO2, 0);
    const electricity = dayActs.filter((a) => a.type === 'electricity').reduce((s, a) => s + a.estimatedCO2, 0);
    const food = dayActs.filter((a) => a.type === 'food').reduce((s, a) => s + a.estimatedCO2, 0);
    const shopping = dayActs.filter((a) => a.type === 'shopping').reduce((s, a) => s + a.estimatedCO2, 0);
    days.push({
      date: dateStr, label: format(d, 'EEE'),
      transport, cooking, electricity, food, shopping,
      total: transport + cooking + electricity + food + shopping,
    });
  }
  return days;
}

function calcCarbonScore(weeklyKg: number, baselineWeekly: number): number {
  if (baselineWeekly <= 0) return 50;
  const ratio = weeklyKg / baselineWeekly;
  // Score: 100 if 0 emissions, 50 at baseline, 0 at 2x baseline
  const score = Math.max(0, Math.min(100, (1 - ratio) * 50 + 50));
  return Math.round(score);
}

function getInsightTypeColor(type: DashboardInsight['type']): string {
  switch (type) {
    case 'praise': return '#34d399';
    case 'warning': return '#f87171';
    case 'tip': return '#60a5fa';
    case 'info': return '#a78bfa';
  }
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (!loading && user && profile && !profile.onboardingComplete) router.push('/onboarding');
  }, [user, profile, loading, router]);

  const loadInsights = async (acts: Activity[], base: Baseline | null) => {
    const weekActs = acts.filter((a) => {
      const d = new Date(a.date);
      return d >= subDays(new Date(), 7);
    });
    const lastWeekActs = acts.filter((a) => {
      const d = new Date(a.date);
      return d >= subDays(new Date(), 14) && d < subDays(new Date(), 7);
    });
    const weekTotal = weekActs.reduce((s, a) => s + a.estimatedCO2, 0);
    const lastWeekTotal = lastWeekActs.reduce((s, a) => s + a.estimatedCO2, 0);
    const breakdown: Record<string, number> = {};
    weekActs.forEach((a) => { breakdown[a.type] = (breakdown[a.type] || 0) + a.estimatedCO2; });
    const topCat = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'transport';

    setInsightsLoading(true);
    const ins = await generateDashboardInsights({
      weeklyTotal: weekTotal,
      lastWeekTotal,
      topCategory: topCat,
      breakdown,
      userRole: profile?.role,
      city: profile?.city,
    });
    setInsights(ins);
    setInsightsLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setDataLoading(true);
      const [acts, base, g] = await Promise.all([
        getActivitiesByUser(user.uid, 14),
        getBaseline(user.uid),
        getGoals(user.uid),
      ]);
      setActivities(acts);
      setBaseline(base);
      setGoals(g.filter((g) => g.status === 'active').slice(0, 3));
      setDataLoading(false);
      loadInsights(acts, base);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const weekData = buildWeekData(activities);
  const thisWeekTotal = weekData.reduce((s, d) => s + d.total, 0);
  const lastWeekActs = activities.filter((a) => {
    const d = new Date(a.date);
    return d >= subDays(new Date(), 14) && d < subDays(new Date(), 7);
  });
  const lastWeekTotal = lastWeekActs.reduce((s, a) => s + a.estimatedCO2, 0);
  const weekChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;
  const breakdown: Record<string, number> = {};
  activities.filter((a) => {
    const d = new Date(a.date);
    return d >= subDays(new Date(), 7);
  }).forEach((a) => { breakdown[a.type] = (breakdown[a.type] || 0) + a.estimatedCO2; });
  const topCat = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0];

  const donutData = Object.entries(breakdown).map(([cat, val]) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: parseFloat(val.toFixed(2)),
    color: getCategoryColor(cat),
  }));

  // Carbon Score
  const baselineWeekly = baseline ? baseline.totalMonthlyKg / 4 : 32.5;
  const carbonScore = calcCarbonScore(thisWeekTotal, baselineWeekly);

  // Goals progress
  const weekActivities = activities.filter((a) => new Date(a.date) >= subDays(new Date(), 7));
  const weekTotal = weekActivities.reduce((s, a) => s + a.estimatedCO2, 0);

  if (loading || dataLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page-container">

          {/* ── Hero Header ─────────────────────────────────────────────── */}
          <div className={styles.heroHeader}>
            <div>
              <h1 className="page-title">
                👋 Welcome back, {profile?.displayName?.split(' ')[0] || 'there'}!
              </h1>
              <p className="page-subtitle">Here&apos;s your carbon footprint overview for this week</p>
            </div>
            <button
              onClick={() => router.push('/track')}
              className="btn btn-primary"
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span style={{ fontSize: 16 }}>+</span>
              Log Activity
            </button>
          </div>

          {/* ── KPI Cards + Carbon Score ──────────────────────────────── */}
          <div className={styles.kpiRow}>
            {/* Carbon Score — spans left */}
            <div className={`kpi-card ${styles.scoreCard}`}>
              <CarbonScore
                score={carbonScore}
                weeklyKg={thisWeekTotal}
                trend={weekChange}
                size={110}
              />
            </div>

            {/* Regular KPIs */}
            <div className={styles.kpiGroup}>
              <div className="kpi-card">
                <div className="kpi-label">This Week</div>
                <div className="kpi-value gradient-text">{formatKg(thisWeekTotal)}</div>
                <div className={`kpi-change ${weekChange <= 0 ? 'positive' : 'negative'}`}>
                  {weekChange === 0 ? '—' : `${weekChange > 0 ? '↑' : '↓'} ${Math.abs(weekChange).toFixed(1)}% vs last week`}
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Monthly Baseline</div>
                <div className="kpi-value" style={{ color: 'var(--blue-400)' }}>
                  {baseline ? formatKg(baseline.totalMonthlyKg) : '—'}
                </div>
                <div className="kpi-change">estimated monthly total</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Top Emitter</div>
                <div className="kpi-value" style={{ fontSize: 22 }}>
                  {topCat ? `${getCategoryIcon(topCat[0])} ${topCat[0].charAt(0).toUpperCase() + topCat[0].slice(1)}` : '—'}
                </div>
                <div className="kpi-change">{topCat ? `${formatKg(topCat[1])} this week` : 'No data yet'}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Activities Logged</div>
                <div className="kpi-value" style={{ color: 'var(--amber-400)' }}>
                  {activities.filter((a) => new Date(a.date) >= subDays(new Date(), 7)).length}
                </div>
                <div className="kpi-change">this week</div>
              </div>
            </div>
          </div>

          {/* ── CO₂ Equivalents Widget ───────────────────────────────── */}
          {thisWeekTotal > 0 && (
            <div className={styles.equivalentsCard}>
              <div className={styles.equivalentsHeader}>
                <span className={styles.equivalentsTitle}>🌍 Your {formatKg(thisWeekTotal)} equals...</span>
                <span className={styles.equivalentsHint}>Scroll to explore →</span>
              </div>
              <CO2Equivalents kgCO2={thisWeekTotal} />
            </div>
          )}

          {/* ── Row 1: Weekly Chart + Donut ──────────────────────────── */}
          <div className={styles.chartsRow}>
            <div className={styles.mainChart}>
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Weekly Emissions</h3>
                <p className={styles.chartSubtitle}>kg CO₂ per day over the last 7 days</p>
                <EmissionsLineChart data={weekData} />
              </div>
            </div>
            <div className={styles.sidePanel}>
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>By Category</h3>
                {donutData.length > 0 ? (
                  <CategoryDonutChart data={donutData} total={thisWeekTotal} />
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📊</div>
                    <p>Log activities to see breakdown</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Goals Preview ────────────────────────────────────────── */}
          {goals.length > 0 && (
            <div className={styles.goalsSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>🎯 Active Goals</h3>
                <button onClick={() => router.push('/goals')} className="btn btn-outline btn-sm">
                  View all →
                </button>
              </div>
              <div className={styles.goalsMini}>
                {goals.map((goal) => {
                  const used = goal.period === 'weekly' ? weekTotal : weekTotal * 4;
                  const pct = Math.min(100, (used / goal.targetKg) * 100);
                  const isOver = used > goal.targetKg;
                  return (
                    <div key={goal.id} className={styles.goalMiniCard}>
                      <div className={styles.goalMiniTop}>
                        <span className={styles.goalMiniTitle}>{goal.title}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: isOver ? 'var(--red-400)' : 'var(--green-400)',
                        }}>
                          {isOver ? `⚠️ +${(used - goal.targetKg).toFixed(1)} kg` : `✓ ${(goal.targetKg - used).toFixed(1)} kg left`}
                        </span>
                      </div>
                      <div className="progress-bar" style={{ marginTop: 8 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${pct}%`,
                            background: isOver
                              ? 'linear-gradient(90deg, #ef4444, #f87171)'
                              : undefined,
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>{used.toFixed(1)} kg used</span>
                        <span>{goal.targetKg} kg target · {goal.period}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Row 2: Heatmap + Gemini AI ───────────────────────────── */}
          <div className={styles.insightsRow}>
            {/* Carbon Activity Map */}
            <div className={styles.heatmapSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>📅 Carbon Activity Map</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Last 35 days — hover each cell to see daily CO₂
                  </p>
                </div>
              </div>
              <CarbonHeatmap activities={activities} days={35} />
            </div>

            {/* Gemini AI Insights */}
            <div className={`${styles.aiCard} ${styles.aiSection}`}>
              <div className={styles.aiHeader}>
                <span className={styles.aiIcon}>🤖</span>
                <div style={{ flex: 1 }}>
                  <h3 className={styles.aiTitle}>Gemini AI Insights</h3>
                  <p className={styles.aiSubtitle}>Powered by Google Gemini</p>
                </div>
                <button
                  className={styles.refreshBtn}
                  onClick={() => loadInsights(activities, baseline)}
                  disabled={insightsLoading}
                  title="Refresh insights"
                >
                  {insightsLoading ? '⏳' : '🔄'}
                </button>
              </div>
              {insightsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8, width: '100%' }} />)}
                </div>
              ) : insights.length > 0 ? (
                <div className={styles.insightsList}>
                  {insights.map((insight, i) => {
                    const color = getInsightTypeColor(insight.type);
                    return (
                      <div key={i} className={styles.insightCard} style={{ borderColor: `${color}30`, background: `${color}08` }}>
                        <div className={styles.insightCardHeader}>
                          <span className={styles.insightEmoji}>{insight.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div className={styles.insightTitle} style={{ color }}>{insight.title}</div>
                            <div className={styles.insightDetail}>{insight.detail}</div>
                          </div>
                        </div>
                        {insight.estimatedSaving && (
                          <div className={styles.insightSaving}>
                            {insight.estimatedSaving}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.insightEmpty}>Log some activities to get personalized insights!</p>
              )}
            </div>
          </div>

          {/* ── Quick Log Shortcuts ─────────────────────────────────────── */}
          <div className={styles.quickLogSection}>
            <div className={styles.sectionHeader} style={{ marginBottom: 14 }}>
              <h3 className={styles.sectionTitle}>⚡ Quick Log</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>One-tap common activities</span>
            </div>
            <div className={styles.quickLogGrid}>
              {[
                { icon: '🚗', label: 'Car Commute',     sub: '~10 km drive',         color: '#3b82f6', path: '/track?type=transport&mode=car'   },
                { icon: '🍳', label: 'Cooked Today',    sub: 'LPG / Induction',       color: '#f59e0b', path: '/track?type=cooking'              },
                { icon: '⚡', label: 'Electricity',     sub: 'Units used today',      color: '#8b5cf6', path: '/track?type=electricity'          },
                { icon: '🥗', label: 'Meals Today',     sub: 'Veg / Non-veg',         color: '#10b981', path: '/track?type=food'                 },
                { icon: '🛍️', label: 'Shopping',        sub: 'Clothes / Electronics', color: '#ef4444', path: '/track?type=shopping'            },
                { icon: '🚇', label: 'Public Transit',  sub: 'Metro / Bus today',     color: '#22d3ee', path: '/track?type=transport&mode=metro' },
              ].map((item) => (
                <button
                  key={item.label}
                  className={styles.quickLogCard}
                  onClick={() => router.push(item.path)}
                  style={{ '--ql-color': item.color } as React.CSSProperties}
                >
                  <span className={styles.quickLogIcon}>{item.icon}</span>
                  <div className={styles.quickLogInfo}>
                    <div className={styles.quickLogLabel}>{item.label}</div>
                    <div className={styles.quickLogSub}>{item.sub}</div>
                  </div>
                  <span className={styles.quickLogArrow}>→</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Recent Activities ────────────────────────────────────── */}
          <div className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Recent Activities</h3>
              <button onClick={() => router.push('/track')} className="btn btn-outline btn-sm">+ Log Activity</button>
            </div>
            {activities.slice(0, 6).length > 0 ? (
              <div className={styles.activityList}>
                {activities.slice(0, 6).map((act) => (
                  <div key={act.id} className={styles.activityItem}>
                    <div className={styles.activityIcon} style={{ background: `${getCategoryColor(act.type)}20` }}>
                      {getCategoryIcon(act.type)}
                    </div>
                    <div className={styles.activityInfo}>
                      <span className={styles.activityType}>{act.type.charAt(0).toUpperCase() + act.type.slice(1)}</span>
                      <span className={styles.activityDate}>{act.date}</span>
                    </div>
                    <div className={styles.activityCo2}>
                      <span style={{ color: getCategoryColor(act.type), fontWeight: 700 }}>
                        {formatKg(act.estimatedCO2)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CO₂</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyActivities}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
                <h4>No activities yet</h4>
                <p>Start logging your daily activities to see your carbon footprint</p>
                <button className="btn btn-primary" onClick={() => router.push('/track')} style={{ marginTop: 16 }}>
                  Log your first activity →
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
