'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { addActivity, getActivitiesByUser, deleteActivity } from '@/lib/firestore';
import { calcTransport, calcCooking, calcElectricity, calcAC, calcFood, formatKg, getCategoryIcon, getCategoryColor } from '@/lib/emissions';
import { Activity } from '@/lib/types';
import Sidebar from '@/components/layout/Sidebar';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import styles from './page.module.css';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function TrackPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(TODAY);

  // Form states
  const [transportMode, setTransportMode] = useState('car');
  const [transportKm, setTransportKm] = useState(10);
  const [cookingFuel, setCookingFuel] = useState<'lpg' | 'png' | 'induction'>('lpg');
  const [cookingValue, setCookingValue] = useState(0.3);
  const [electricityUnits, setElectricityUnits] = useState(10);
  const [acHours, setAcHours] = useState(4);
  const [acCount, setAcCount] = useState(1);
  const [dietType, setDietType] = useState<'veg' | 'mixed' | 'nonVeg'>('mixed');
  const [shoppingItem, setShoppingItem] = useState('clothes');
  const [shoppingQty, setShoppingQty] = useState(1);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getActivitiesByUser(user.uid, 7).then((acts) => { setActivities(acts); setDataLoading(false); });
  }, [user]);

  const todayActivities = activities.filter((a) => a.date === TODAY);
  const todayTotal = todayActivities.reduce((s, a) => s + a.estimatedCO2, 0);

  const refreshActivities = async () => {
    if (!user) return;
    const acts = await getActivitiesByUser(user.uid, 7);
    setActivities(acts);
  };

  const handleAddTransport = async () => {
    if (!user) return;
    setSaving(true);
    const co2 = calcTransport(transportMode, transportKm);
    await addActivity(user.uid, { type: 'transport', subtype: transportMode, details: { mode: transportMode, distanceKm: transportKm }, estimatedCO2: co2, date, userId: user.uid });
    toast.success(`Logged: ${co2.toFixed(2)} kg CO₂`);
    setActiveCard(null); await refreshActivities(); setSaving(false);
  };

  const handleAddCooking = async () => {
    if (!user) return;
    setSaving(true);
    const co2 = calcCooking(cookingFuel, cookingValue);
    await addActivity(user.uid, { type: 'cooking', subtype: cookingFuel, details: { fuel: cookingFuel, value: cookingValue }, estimatedCO2: co2, date, userId: user.uid });
    toast.success(`Logged: ${co2.toFixed(2)} kg CO₂`);
    setActiveCard(null); await refreshActivities(); setSaving(false);
  };

  const handleAddElectricity = async () => {
    if (!user) return;
    setSaving(true);
    const co2 = calcElectricity(electricityUnits) + calcAC(acHours, acCount);
    await addActivity(user.uid, { type: 'electricity', details: { units: electricityUnits, acHours, acCount }, estimatedCO2: co2, date, userId: user.uid });
    toast.success(`Logged: ${co2.toFixed(2)} kg CO₂`);
    setActiveCard(null); await refreshActivities(); setSaving(false);
  };

  const handleAddFood = async () => {
    if (!user) return;
    setSaving(true);
    const foodMap: Record<string, number> = { veg: 2.5, mixed: 4.5, nonVeg: 7.2 };
    const co2 = foodMap[dietType];
    await addActivity(user.uid, { type: 'food', subtype: dietType, details: { dietType }, estimatedCO2: co2, date, userId: user.uid });
    toast.success(`Logged: ${co2.toFixed(2)} kg CO₂`);
    setActiveCard(null); await refreshActivities(); setSaving(false);
  };

  const handleAddShopping = async () => {
    if (!user) return;
    setSaving(true);
    const shopMap: Record<string, number> = { clothes: 10, electronics: 150, appliance: 300, other: 5 };
    const co2 = shopMap[shoppingItem] * shoppingQty;
    await addActivity(user.uid, { type: 'shopping', subtype: shoppingItem, details: { item: shoppingItem, qty: shoppingQty }, estimatedCO2: co2, date, userId: user.uid });
    toast.success(`Logged: ${co2.toFixed(2)} kg CO₂`);
    setActiveCard(null); await refreshActivities(); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteActivity(id);
    await refreshActivities();
    toast.success('Activity removed');
  };

  if (loading || dataLoading) {
    return <div className="loading-screen"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page-container">
          <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 className="page-title">✏️ Track Today</h1>
              <p className="page-subtitle">Log your activities to calculate your carbon footprint</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green-400)', fontFamily: 'Space Grotesk, sans-serif' }}>
                {formatKg(todayTotal)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>today&apos;s total</div>
            </div>
          </div>

          {/* Date selector */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="form-label" style={{ margin: 0 }}>Date:</label>
            <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 'auto' }} max={TODAY} />
          </div>

          {/* Activity Cards */}
          <div className={styles.cardsGrid}>
            {/* Transport */}
            <div className={`${styles.actCard} ${activeCard === 'transport' ? styles.actCardOpen : ''}`}>
              <div className={styles.actCardHeader} onClick={() => setActiveCard(activeCard === 'transport' ? null : 'transport')}>
                <div className={styles.actCardIcon} style={{ background: '#3b82f620' }}>🚗</div>
                <div className={styles.actCardInfo}>
                  <h3>Transport</h3>
                  <p>Car, bike, bus, train, flight</p>
                </div>
                <span className={styles.actCardArrow}>{activeCard === 'transport' ? '▲' : '▼'}</span>
              </div>
              {activeCard === 'transport' && (
                <div className={styles.actCardBody}>
                  <div className={styles.fieldRow}>
                    <div className="form-group">
                      <label className="form-label">Mode</label>
                      <select className="form-input form-select" value={transportMode} onChange={(e) => setTransportMode(e.target.value)}>
                        {[['car','🚗 Car'],['bike','🏍️ Bike/Scooter'],['bus','🚌 Bus'],['train','🚆 Train'],['metro','🚇 Metro'],['auto','🛺 Auto'],['flight','✈️ Flight'],['walk','🚶 Walk']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Distance (km)</label>
                      <input type="number" className="form-input" value={transportKm} onChange={(e) => setTransportKm(+e.target.value)} min={0} />
                    </div>
                  </div>
                  <div className={styles.co2Preview}>≈ {calcTransport(transportMode, transportKm).toFixed(2)} kg CO₂</div>
                  <button className="btn btn-primary" onClick={handleAddTransport} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                    {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Log Transport'}
                  </button>
                </div>
              )}
            </div>

            {/* Cooking */}
            <div className={`${styles.actCard} ${activeCard === 'cooking' ? styles.actCardOpen : ''}`}>
              <div className={styles.actCardHeader} onClick={() => setActiveCard(activeCard === 'cooking' ? null : 'cooking')}>
                <div className={styles.actCardIcon} style={{ background: '#f59e0b20' }}>🍳</div>
                <div className={styles.actCardInfo}><h3>Cooking</h3><p>LPG, PNG, induction</p></div>
                <span className={styles.actCardArrow}>{activeCard === 'cooking' ? '▲' : '▼'}</span>
              </div>
              {activeCard === 'cooking' && (
                <div className={styles.actCardBody}>
                  <div className={styles.fieldRow}>
                    <div className="form-group">
                      <label className="form-label">Fuel type</label>
                      <select className="form-input form-select" value={cookingFuel} onChange={(e) => setCookingFuel(e.target.value as 'lpg' | 'png' | 'induction')}>
                        <option value="lpg">🔥 LPG</option>
                        <option value="png">🔵 PNG</option>
                        <option value="induction">⚡ Induction</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{cookingFuel === 'lpg' ? 'Cylinders used' : 'Hours used'}</label>
                      <input type="number" className="form-input" value={cookingValue} onChange={(e) => setCookingValue(+e.target.value)} min={0} step={0.1} />
                    </div>
                  </div>
                  <div className={styles.co2Preview}>≈ {calcCooking(cookingFuel, cookingValue).toFixed(2)} kg CO₂</div>
                  <button className="btn btn-primary" onClick={handleAddCooking} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                    {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Log Cooking'}
                  </button>
                </div>
              )}
            </div>

            {/* Electricity */}
            <div className={`${styles.actCard} ${activeCard === 'electricity' ? styles.actCardOpen : ''}`}>
              <div className={styles.actCardHeader} onClick={() => setActiveCard(activeCard === 'electricity' ? null : 'electricity')}>
                <div className={styles.actCardIcon} style={{ background: '#8b5cf620' }}>⚡</div>
                <div className={styles.actCardInfo}><h3>Electricity & AC</h3><p>Units consumed, AC hours</p></div>
                <span className={styles.actCardArrow}>{activeCard === 'electricity' ? '▲' : '▼'}</span>
              </div>
              {activeCard === 'electricity' && (
                <div className={styles.actCardBody}>
                  <div className={styles.fieldRow}>
                    <div className="form-group">
                      <label className="form-label">Units (kWh)</label>
                      <input type="number" className="form-input" value={electricityUnits} onChange={(e) => setElectricityUnits(+e.target.value)} min={0} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">AC hours/day</label>
                      <input type="number" className="form-input" value={acHours} onChange={(e) => setAcHours(+e.target.value)} min={0} max={24} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Number of ACs</label>
                      <input type="number" className="form-input" value={acCount} onChange={(e) => setAcCount(+e.target.value)} min={0} max={10} />
                    </div>
                  </div>
                  <div className={styles.co2Preview}>≈ {(calcElectricity(electricityUnits) + calcAC(acHours, acCount)).toFixed(2)} kg CO₂</div>
                  <button className="btn btn-primary" onClick={handleAddElectricity} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                    {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Log Electricity'}
                  </button>
                </div>
              )}
            </div>

            {/* Food */}
            <div className={`${styles.actCard} ${activeCard === 'food' ? styles.actCardOpen : ''}`}>
              <div className={styles.actCardHeader} onClick={() => setActiveCard(activeCard === 'food' ? null : 'food')}>
                <div className={styles.actCardIcon} style={{ background: '#10b98120' }}>🥗</div>
                <div className={styles.actCardInfo}><h3>Food</h3><p>Diet type for the day</p></div>
                <span className={styles.actCardArrow}>{activeCard === 'food' ? '▲' : '▼'}</span>
              </div>
              {activeCard === 'food' && (
                <div className={styles.actCardBody}>
                  <div className="chip-group" style={{ marginBottom: 16 }}>
                    {[['veg','🥗 Veg day (2.5 kg)'],['mixed','🍱 Mixed day (4.5 kg)'],['nonVeg','🍗 Non-veg day (7.2 kg)']].map(([v,l]) => (
                      <div key={v} className={`chip ${dietType === v ? 'active' : ''}`} onClick={() => setDietType(v as 'veg' | 'mixed' | 'nonVeg')}>{l}</div>
                    ))}
                  </div>
                  <div className={styles.co2Preview}>≈ {({ veg: 2.5, mixed: 4.5, nonVeg: 7.2 }[dietType]).toFixed(2)} kg CO₂</div>
                  <button className="btn btn-primary" onClick={handleAddFood} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                    {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Log Food'}
                  </button>
                </div>
              )}
            </div>

            {/* Shopping */}
            <div className={`${styles.actCard} ${activeCard === 'shopping' ? styles.actCardOpen : ''}`}>
              <div className={styles.actCardHeader} onClick={() => setActiveCard(activeCard === 'shopping' ? null : 'shopping')}>
                <div className={styles.actCardIcon} style={{ background: '#ef444420' }}>🛍️</div>
                <div className={styles.actCardInfo}><h3>Shopping</h3><p>Clothes, electronics, appliances</p></div>
                <span className={styles.actCardArrow}>{activeCard === 'shopping' ? '▲' : '▼'}</span>
              </div>
              {activeCard === 'shopping' && (
                <div className={styles.actCardBody}>
                  <div className={styles.fieldRow}>
                    <div className="form-group">
                      <label className="form-label">Item type</label>
                      <select className="form-input form-select" value={shoppingItem} onChange={(e) => setShoppingItem(e.target.value)}>
                        <option value="clothes">👕 Clothes (10 kg each)</option>
                        <option value="electronics">📱 Electronics (150 kg each)</option>
                        <option value="appliance">🏠 Appliance (300 kg each)</option>
                        <option value="other">📦 Other (5 kg each)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Quantity</label>
                      <input type="number" className="form-input" value={shoppingQty} onChange={(e) => setShoppingQty(+e.target.value)} min={1} />
                    </div>
                  </div>
                  <div className={styles.co2Preview}>≈ {(({ clothes: 10, electronics: 150, appliance: 300, other: 5 } as Record<string,number>)[shoppingItem] ?? 5) * shoppingQty} kg CO₂</div>
                  <button className="btn btn-primary" onClick={handleAddShopping} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                    {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Log Shopping'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Today's log */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📋 Today&apos;s Log</h3>
            {todayActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🌿</div>
                <p style={{ color: 'var(--text-muted)' }}>No activities logged today. Tap a card above to get started!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayActivities.map((act) => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${getCategoryColor(act.type)}20`, fontSize: 18 }}>
                      {getCategoryIcon(act.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{act.type.charAt(0).toUpperCase() + act.type.slice(1)} {act.subtype ? `· ${act.subtype}` : ''}</div>
                    </div>
                    <div style={{ color: getCategoryColor(act.type), fontWeight: 700, fontSize: 15 }}>{formatKg(act.estimatedCO2)}</div>
                    <button onClick={() => act.id && handleDelete(act.id)} className="btn btn-icon btn-danger btn-sm" title="Delete">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
