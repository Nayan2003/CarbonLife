'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getGoals, addGoal, updateGoal, deleteGoal, getBadges, getActivitiesByUser } from '@/lib/firestore';
import { Goal, Badge } from '@/lib/types';
import Sidebar from '@/components/layout/Sidebar';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import styles from './page.module.css';

const BADGE_DEFS = [
  { type: 'first_log', icon: '🌱', title: 'First Step', desc: 'Logged your first activity' },
  { type: 'week_streak', icon: '🔥', title: '7-Day Streak', desc: 'Logged activities for 7 consecutive days' },
  { type: 'transport_pro', icon: '🚌', title: 'Transit Pro', desc: 'Used public transport 10+ times' },
  { type: 'veg_hero', icon: '🥗', title: 'Veg Hero', desc: 'Logged 10+ vegetarian days' },
  { type: 'goal_crusher', icon: '🎯', title: 'Goal Crusher', desc: 'Completed your first goal' },
  { type: 'eco_warrior', icon: '⚡', title: 'Eco Warrior', desc: 'Reduced weekly emissions by 20%' },
];

export default function GoalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [activities, setActivities] = useState<{ date: string; estimatedCO2: number; type: string; subtype?: string }[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(50);
  const [goalPeriod, setGoalPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [goalEnd, setGoalEnd] = useState(format(subDays(new Date(), -30), 'yyyy-MM-dd'));

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getGoals(user.uid),
      getBadges(user.uid),
      getActivitiesByUser(user.uid, 60),
    ]).then(([g, b, a]) => {
      setGoals(g);
      setBadges(b);
      setActivities(a);
      setDataLoading(false);
    });
  }, [user]);

  // Calculate streak
  const getStreak = () => {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (activities.some((a) => a.date === dateStr)) streak++;
      else break;
    }
    return streak;
  };

  const streak = getStreak();

  // Calculate this week total for goal progress
  const thisWeekTotal = activities
    .filter((a) => new Date(a.date) >= subDays(new Date(), 7))
    .reduce((s, a) => s + a.estimatedCO2, 0);

  const earnedBadgeTypes = badges.map((b) => b.badgeType);

  const handleAddGoal = async () => {
    if (!user || !goalTitle) return;
    setSaving(true);
    try {
      await addGoal(user.uid, {
        userId: user.uid,
        title: goalTitle,
        targetKg: goalTarget,
        period: goalPeriod,
        currentProgress: 0,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: goalEnd,
        status: 'active',
      });
      const updated = await getGoals(user.uid);
      setGoals(updated);
      setShowAddGoal(false);
      setGoalTitle('');
      toast.success('Goal created!');
    } catch {
      toast.error('Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toast.success('Goal removed');
  };

  const handleMarkComplete = async (goal: Goal) => {
    if (!goal.id) return;
    await updateGoal(goal.id, { status: 'completed' });
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, status: 'completed' } : g)));
    toast.success('🎉 Goal completed!');
  };

  if (loading || dataLoading) {
    return <div className="loading-screen"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">🎯 Goals &amp; Achievements</h1>
            <p className="page-subtitle">Track your progress and earn badges for eco-friendly habits</p>
          </div>

          {/* Streak banner */}
          <div className={styles.streakBanner}>
            <div className={styles.streakOrb} />
            <div className={styles.streakLeft}>
              <span className={styles.streakFire}>🔥</span>
              <div>
                <div className={styles.streakCount}>{streak} day streak</div>
                <div className={styles.streakLabel}>Keep logging daily to maintain your streak!</div>
              </div>
            </div>
            <div className={styles.streakRight}>
              <div className={styles.streakStat}>
                <span style={{ color: 'var(--green-400)', fontWeight: 700, fontSize: 20 }}>{thisWeekTotal.toFixed(1)} kg</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>this week&apos;s emissions</span>
              </div>
            </div>
          </div>

          {/* Goals section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>My Goals</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddGoal(true)}>+ New Goal</button>
            </div>

            {/* Add goal form */}
            {showAddGoal && (
              <div className={styles.addGoalCard}>
                <h4 style={{ marginBottom: 16 }}>Create New Goal</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Goal title</label>
                    <input className="form-input" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="e.g. Stay under 50 kg this week" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target (kg CO₂)</label>
                    <input type="number" className="form-input" value={goalTarget} onChange={(e) => setGoalTarget(+e.target.value)} min={1} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Period</label>
                    <select className="form-input form-select" value={goalPeriod} onChange={(e) => setGoalPeriod(e.target.value as 'weekly' | 'monthly')}>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">End date</label>
                    <input type="date" className="form-input" value={goalEnd} onChange={(e) => setGoalEnd(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={handleAddGoal} disabled={saving || !goalTitle}>
                    {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Goal'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowAddGoal(false)}>Cancel</button>
                </div>
              </div>
            )}

            {goals.length === 0 && !showAddGoal ? (
              <div className={styles.emptyGoals}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
                <p style={{ color: 'var(--text-secondary)' }}>No goals yet. Create your first goal to stay motivated!</p>
              </div>
            ) : (
              <div className={styles.goalsList}>
                {goals.map((goal) => {
                  const progress = goal.period === 'weekly' ? Math.min(100, (thisWeekTotal / goal.targetKg) * 100) : 0;
                  const isOver = thisWeekTotal > goal.targetKg;
                  return (
                    <div key={goal.id} className={styles.goalCard}>
                      <div className={styles.goalTop}>
                        <div className={styles.goalInfo}>
                          <h4 className={styles.goalTitle}>{goal.title}</h4>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                            <span className={`badge ${goal.status === 'completed' ? 'badge-green' : goal.status === 'failed' ? 'badge-red' : 'badge-blue'}`}>
                              {goal.status}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              Target: {goal.targetKg} kg · {goal.period} · ends {goal.endDate}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {goal.status === 'active' && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleMarkComplete(goal)}>✓</button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => goal.id && handleDeleteGoal(goal.id)}>🗑️</button>
                        </div>
                      </div>
                      {goal.period === 'weekly' && goal.status === 'active' && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            <span>{thisWeekTotal.toFixed(1)} kg emitted</span>
                            <span>{goal.targetKg} kg target</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%`, background: isOver ? '#ef4444' : undefined }} />
                          </div>
                          <div style={{ fontSize: 12, marginTop: 6, color: isOver ? 'var(--red-400)' : 'var(--green-400)' }}>
                            {isOver ? `⚠️ Over by ${(thisWeekTotal - goal.targetKg).toFixed(1)} kg` : `✓ ${(goal.targetKg - thisWeekTotal).toFixed(1)} kg remaining`}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>🏆 Achievements</h2>
            <div className={styles.badgesGrid}>
              {BADGE_DEFS.map((badge) => {
                const earned = earnedBadgeTypes.includes(badge.type);
                return (
                  <div key={badge.type} className={`${styles.badgeCard} ${earned ? styles.badgeEarned : styles.badgeLocked}`}>
                    <div className={styles.badgeIcon}>{badge.icon}</div>
                    <div className={styles.badgeInfo}>
                      <div className={styles.badgeName}>{badge.title}</div>
                      <div className={styles.badgeDesc}>{badge.desc}</div>
                    </div>
                    {earned && <span className="badge badge-green" style={{ flexShrink: 0 }}>✓ Earned</span>}
                    {!earned && <span style={{ fontSize: 18 }}>🔒</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
