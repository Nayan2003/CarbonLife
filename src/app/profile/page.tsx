'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { saveUserProfile, getBaseline } from '@/lib/firestore';
import { Baseline } from '@/lib/types';
import { formatKg } from '@/lib/emissions';
import Sidebar from '@/components/layout/Sidebar';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile, logout } = useAuth();
  const router = useRouter();
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [city, setCity] = useState(profile?.city || '');
  const [role, setRole] = useState(profile?.role || 'professional');
  const [householdSize, setHouseholdSize] = useState(profile?.householdSize || 2);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setCity(profile.city || '');
      setRole(profile.role || 'professional');
      setHouseholdSize(profile.householdSize || 2);
    }
  }, [profile]);

  useEffect(() => {
    if (user) getBaseline(user.uid).then(setBaseline);
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveUserProfile(user.uid, { displayName, city, role: role as 'student' | 'professional' | 'homemaker' | 'retired' | 'other', householdSize });
      await refreshProfile();
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  const baselineCats = baseline ? [
    { label: 'Transport', kg: baseline.transport, color: '#3b82f6', icon: '🚗' },
    { label: 'Home Energy', kg: baseline.homeEnergy, color: '#8b5cf6', icon: '⚡' },
    { label: 'Cooking', kg: baseline.cooking, color: '#f59e0b', icon: '🍳' },
    { label: 'Food', kg: baseline.food, color: '#10b981', icon: '🥗' },
    { label: 'Shopping', kg: baseline.shopping, color: '#ef4444', icon: '🛍️' },
  ] : [];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content" aria-label="Profile">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">👤 Profile</h1>
            <p className="page-subtitle">Manage your account and view your baseline footprint</p>
          </div>

          <div className={styles.layout}>
            {/* Profile form */}
            <div className={styles.card}>
              <div className={styles.avatarSection}>
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="avatar" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback}>
                    {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{profile?.displayName || 'User'}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</p>
                </div>
              </div>

              <div className="divider" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Display Name</label>
                  <input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" />
                </div>
                <div className="form-group">
                  <label className="form-label">Household Size</label>
                  <input type="number" className="form-input" value={householdSize} onChange={(e) => setHouseholdSize(+e.target.value)} min={1} max={20} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">I am a...</label>
                  <div className="chip-group">
                    {(['student','professional','homemaker','retired','other'] as const).map((r) => (
                      <div key={r} className={`chip ${role === r ? 'active' : ''}`} onClick={() => setRole(r)}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => router.push('/onboarding')}>
                  Redo Onboarding
                </button>
              </div>
            </div>

            {/* Baseline + danger zone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Baseline card */}
              {baseline && (
                <div className={styles.card}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📊 Your Baseline</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Estimated monthly footprint from onboarding</p>
                  <div className={styles.baselineTotal}>
                    {formatKg(baseline.totalMonthlyKg)}
                    <span>/ month</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                    {baselineCats.map((c) => (
                      <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16 }}>{c.icon}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{c.label}</span>
                        <div style={{ width: 100, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 999, background: c.color, width: `${Math.min(100, (c.kg / baseline.totalMonthlyKg) * 100)}%` }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, width: 60, textAlign: 'right' }}>{c.kg.toFixed(0)} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Danger zone */}
              <div className={styles.dangerCard}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--red-400)', marginBottom: 8 }}>⚠️ Account</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Sign out of your CarbonLife account</p>
                <button className="btn btn-danger" onClick={handleLogout}>Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
