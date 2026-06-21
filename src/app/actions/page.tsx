'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getActivitiesByUser, getActions, saveActions, updateAction } from '@/lib/firestore';
import { generateRecommendations } from '@/lib/gemini';
import { getCategoryColor, getCategoryIcon } from '@/lib/emissions';
import { Action } from '@/lib/types';
import Sidebar from '@/components/layout/Sidebar';
import toast from 'react-hot-toast';
import { subDays } from 'date-fns';
import styles from './page.module.css';

export default function ActionsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [actions, setActions] = useState<Action[]>([]);
  const [generating, setGenerating] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedWhy, setExpandedWhy] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getActions(user.uid).then((acts) => { setActions(acts); setDataLoading(false); });
  }, [user]);

  const generateNew = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const activities = await getActivitiesByUser(user.uid, 7);
      const breakdown: Record<string, number> = {};
      activities.filter((a) => new Date(a.date) >= subDays(new Date(), 7)).forEach((a) => {
        breakdown[a.type] = (breakdown[a.type] || 0) + a.estimatedCO2;
      });
      const topCats = Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, kg]) => ({ name, kg }));
      const weekTotal = activities.reduce((s, a) => s + a.estimatedCO2, 0);

      const recs = await generateRecommendations({
        topCategories: topCats,
        userProfile: { role: profile?.role, city: profile?.city, commuteModes: profile?.commuteModes, cookingFuel: profile?.cookingFuel },
        weeklyTotal: weekTotal,
      });

      const VALID_CATS = ['transport', 'cooking', 'electricity', 'food', 'shopping'] as const;
      type ActionCat = typeof VALID_CATS[number];
      await saveActions(user.uid, recs.map((r) => ({
        ...r,
        category: (VALID_CATS.includes(r.category as ActionCat) ? r.category : 'transport') as ActionCat,
        status: 'planned' as const,
        userId: user.uid,
      })));

      const updated = await getActions(user.uid);
      setActions(updated);
      toast.success(`Generated ${recs.length} personalized recommendations!`);
    } catch {
      toast.error('Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (actionId: string, status: Action['status']) => {
    if (!user) return;
    await updateAction(user.uid, actionId, { status });
    setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, status } : a)));
    if (status === 'completed') toast.success('🎉 Action completed!');
  };

  const grouped = actions.reduce<Record<string, Action[]>>((acc, a) => {
    const cat = a.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  const statusColors: Record<string, string> = {
    planned: 'var(--text-muted)',
    'in-progress': 'var(--amber-400)',
    completed: 'var(--green-400)',
    skipped: 'var(--red-400)',
  };

  if (loading || dataLoading) {
    return <div className="loading-screen"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content" aria-label="My Actions">
        <div className="page-container">
          <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 className="page-title">⚡ My Actions</h1>
              <p className="page-subtitle">Personalized recommendations powered by Gemini AI</p>
            </div>
            <button onClick={generateNew} disabled={generating} className="btn btn-primary" style={{ flexShrink: 0 }}>
              {generating ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Generating...</> : '🤖 Generate New Recommendations'}
            </button>
          </div>

          {/* Stats bar */}
          <div className={styles.statsBar}>
            {['planned','in-progress','completed','skipped'].map((s) => {
              const count = actions.filter((a) => a.status === s).length;
              return (
                <div key={s} className={styles.statChip}>
                  <span style={{ color: statusColors[s], fontWeight: 700 }}>{count}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s}</span>
                </div>
              );
            })}
          </div>

          {actions.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
              <h3 style={{ marginBottom: 8 }}>No recommendations yet</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                Log some activities in the Track page, then click &quot;Generate New Recommendations&quot; to get personalized AI tips.
              </p>
              <button onClick={() => router.push('/track')} className="btn btn-outline">Go to Track →</button>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, catActions]) => (
              <div key={cat} className={styles.categoryGroup}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryIcon} style={{ background: `${getCategoryColor(cat)}20` }}>
                    {getCategoryIcon(cat)}
                  </div>
                  <h3 className={styles.categoryTitle}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
                  <span className="badge badge-blue">{catActions.length} actions</span>
                </div>
                <div className={styles.actionsList}>
                  {catActions.map((action) => (
                    <div key={action.id} className={`${styles.actionCard} ${action.status === 'completed' ? styles.actionCompleted : ''}`}>
                      <div className={styles.actionTop}>
                        <div className={styles.actionInfo}>
                          <h4 className={styles.actionTitle}>{action.title}</h4>
                          <p className={styles.actionDesc}>{action.description}</p>
                        </div>
                        <div className={styles.actionSaving}>
                          <span style={{ color: 'var(--green-400)', fontWeight: 700, fontSize: 16 }}>-{action.estimatedSaving.toFixed(1)} kg</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CO₂/week saved</span>
                        </div>
                      </div>

                      {/* Why button */}
                      {action.why && (
                        <div>
                          <button
                            className={styles.whyBtn}
                            onClick={() => setExpandedWhy(expandedWhy === action.id ? null : action.id!)}
                          >
                            💡 {expandedWhy === action.id ? 'Hide' : 'Why this action?'}
                          </button>
                          {expandedWhy === action.id && (
                            <div className={styles.whyBox}>{action.why}</div>
                          )}
                        </div>
                      )}

                      {/* Status actions */}
                      <div className={styles.actionButtons}>
                        <span className={styles.statusLabel} style={{ color: statusColors[action.status] }}>
                          ● {action.status}
                        </span>
                        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                          {action.status !== 'in-progress' && action.status !== 'completed' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(action.id!, 'in-progress')}>Start</button>
                          )}
                          {action.status !== 'completed' && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(action.id!, 'completed')}>✓ Done</button>
                          )}
                          {action.status !== 'skipped' && action.status !== 'completed' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(action.id!, 'skipped')}>Skip</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
