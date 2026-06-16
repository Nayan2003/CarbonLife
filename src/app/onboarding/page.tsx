'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { saveUserProfile, saveBaseline } from '@/lib/firestore';
import { calcBaseline } from '@/lib/emissions';
import { generateBaselineExplanation } from '@/lib/gemini';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const STEPS = ['Personal', 'Lifestyle', 'Energy & Diet'];

const COMMUTE_OPTIONS = [
  { value: 'car', label: '🚗 Car', },
  { value: 'bike', label: '🏍️ Bike/Scooter' },
  { value: 'bus', label: '🚌 Bus' },
  { value: 'train', label: '🚆 Train' },
  { value: 'metro', label: '🚇 Metro' },
  { value: 'auto', label: '🛺 Auto-rickshaw' },
  { value: 'walk', label: '🚶 Walk' },
  { value: 'cycle', label: '🚲 Cycle' },
];

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    displayName: profile?.displayName || '',
    ageGroup: '25-34',
    city: '',
    householdSize: 2,
    role: 'professional' as const,
    ownsVehicle: false,
    vehicleType: 'none' as const,
    commuteModes: ['bus'],
    dailyCommuteKm: 10,
    cookingFuel: 'lpg' as const,
    housing: 'apartment' as const,
    acCount: 1,
    acHoursPerDay: 6,
    monthlyElectricityUnits: 100,
    dietType: 'mixed',
  });

  useEffect(() => {
    if (!user) router.push('/auth');
  }, [user, router]);

  const update = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const toggleCommute = (mode: string) => {
    setForm((f) => ({
      ...f,
      commuteModes: f.commuteModes.includes(mode)
        ? f.commuteModes.filter((m) => m !== mode)
        : [...f.commuteModes, mode],
    }));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveUserProfile(user.uid, { ...form, onboardingComplete: true });
      const baseline = calcBaseline({
        commuteModes: form.commuteModes,
        dailyCommuteKm: form.dailyCommuteKm,
        cookingFuel: form.cookingFuel,
        monthlyElectricityUnits: form.monthlyElectricityUnits,
        dietType: form.dietType,
        acCount: form.acCount,
        acHoursPerDay: form.acHoursPerDay,
      });
      await saveBaseline(user.uid, baseline);
      await refreshProfile();
      toast.success('Profile saved! Welcome to CarbonLife 🌿');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.container}>
        {/* Progress */}
        <div className={styles.progressHeader}>
          <div className={styles.logoText}>🌿 CarbonLife</div>
          <div className={styles.stepsIndicator}>
            {STEPS.map((s, i) => (
              <div key={i} className={`${styles.stepDot} ${i <= step ? styles.stepDotActive : ''}`}>
                <div className={styles.stepDotInner}>{i < step ? '✓' : i + 1}</div>
                <span className={styles.stepDotLabel}>{s}</span>
              </div>
            ))}
          </div>
          <div className="progress-bar" style={{ height: 4, marginTop: 12 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step 0: Personal */}
        {step === 0 && (
          <div className={styles.stepCard}>
            <h2 className={styles.stepTitle}>Tell us about yourself</h2>
            <p className={styles.stepSubtitle}>We'll personalize your experience based on your profile</p>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input className="form-input" value={form.displayName} onChange={(e) => update('displayName', e.target.value)} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="e.g. Mumbai, Delhi, Bangalore" />
              </div>
              <div className="form-group">
                <label className="form-label">Age Group</label>
                <select className="form-input form-select" value={form.ageGroup} onChange={(e) => update('ageGroup', e.target.value)}>
                  {['Under 18','18-24','25-34','35-44','45-54','55+'].map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Household Size</label>
                <input type="number" className="form-input" value={form.householdSize} onChange={(e) => update('householdSize', +e.target.value)} min={1} max={20} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">I am a...</label>
                <div className="chip-group">
                  {['student','professional','homemaker','retired','other'].map((r) => (
                    <div key={r} className={`chip ${form.role === r ? 'active' : ''}`} onClick={() => update('role', r)}>
                      {{ student:'🎓 Student', professional:'💼 Professional', homemaker:'🏠 Homemaker', retired:'🌴 Retired', other:'✨ Other' }[r]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Lifestyle */}
        {step === 1 && (
          <div className={styles.stepCard}>
            <h2 className={styles.stepTitle}>Your travel & home</h2>
            <p className={styles.stepSubtitle}>This helps us calculate your transport and home emissions accurately</p>
            <div className={styles.formGrid}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">How do you commute? (select all that apply)</label>
                <div className="chip-group">
                  {COMMUTE_OPTIONS.map((o) => (
                    <div key={o.value} className={`chip ${form.commuteModes.includes(o.value) ? 'active' : ''}`} onClick={() => toggleCommute(o.value)}>
                      {o.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Daily commute distance (km one-way)</label>
                <input type="number" className="form-input" value={form.dailyCommuteKm} onChange={(e) => update('dailyCommuteKm', +e.target.value)} min={0} max={200} />
              </div>
              <div className="form-group">
                <label className="form-label">Housing type</label>
                <select className="form-input form-select" value={form.housing} onChange={(e) => update('housing', e.target.value)}>
                  <option value="hostel">🏫 Hostel</option>
                  <option value="pg">🏠 PG/Paying Guest</option>
                  <option value="apartment">🏢 Apartment</option>
                  <option value="house">🏡 Independent House</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cooking fuel</label>
                <select className="form-input form-select" value={form.cookingFuel} onChange={(e) => update('cookingFuel', e.target.value)}>
                  <option value="lpg">🔥 LPG Cylinder</option>
                  <option value="png">🔵 Piped Natural Gas (PNG)</option>
                  <option value="induction">⚡ Induction cooktop</option>
                  <option value="mixed">🔀 Mixed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Number of ACs at home</label>
                <input type="number" className="form-input" value={form.acCount} onChange={(e) => update('acCount', +e.target.value)} min={0} max={10} />
              </div>
              <div className="form-group">
                <label className="form-label">AC usage per day (hours)</label>
                <input type="number" className="form-input" value={form.acHoursPerDay} onChange={(e) => update('acHoursPerDay', +e.target.value)} min={0} max={24} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Energy & Diet */}
        {step === 2 && (
          <div className={styles.stepCard}>
            <h2 className={styles.stepTitle}>Energy &amp; diet habits</h2>
            <p className={styles.stepSubtitle}>Last step! Tell us about your electricity usage and diet</p>
            <div className={styles.formGrid}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Monthly electricity consumption (units/kWh)</label>
                <input type="number" className="form-input" value={form.monthlyElectricityUnits} onChange={(e) => update('monthlyElectricityUnits', +e.target.value)} min={0} max={2000} />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Check your electricity bill for the exact units. Average Indian household: 100-250 units/month.</p>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Your typical diet</label>
                <div className="chip-group">
                  {[
                    { value: 'veg', label: '🥗 Mostly Vegetarian' },
                    { value: 'mixed', label: '🍱 Mixed (veg + non-veg)' },
                    { value: 'nonVeg', label: '🍗 Heavy Non-veg' },
                  ].map((d) => (
                    <div key={d.value} className={`chip ${form.dietType === d.value ? 'active' : ''}`} onClick={() => update('dietType', d.value)}>
                      {d.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Baseline preview */}
              <div className={styles.baselinePreview} style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)' }}>📊 Estimated monthly footprint preview</h4>
                {(() => {
                  const b = calcBaseline({ commuteModes: form.commuteModes, dailyCommuteKm: form.dailyCommuteKm, cookingFuel: form.cookingFuel, monthlyElectricityUnits: form.monthlyElectricityUnits, dietType: form.dietType, acCount: form.acCount, acHoursPerDay: form.acHoursPerDay });
                  const cats = [
                    { label: 'Transport', kg: b.transport, color: '#3b82f6' },
                    { label: 'Home Energy', kg: b.homeEnergy, color: '#8b5cf6' },
                    { label: 'Cooking', kg: b.cooking, color: '#f59e0b' },
                    { label: 'Food', kg: b.food, color: '#10b981' },
                    { label: 'Shopping', kg: b.shopping, color: '#ef4444' },
                  ];
                  return (
                    <>
                      <div className={styles.totalBig}>{b.totalMonthlyKg.toFixed(0)} <span>kg CO₂/month</span></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                        {cats.map((c) => (
                          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 90 }}>{c.label}</span>
                            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 999, background: c.color, width: `${Math.min(100, (c.kg / b.totalMonthlyKg) * 100)}%`, transition: 'width 0.5s ease' }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text-primary)', width: 60, textAlign: 'right' }}>{c.kg.toFixed(0)} kg</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.navButtons}>
          {step > 0 && (
            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Next: {STEPS[step + 1]} →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleFinish} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : '🚀 Start tracking →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
