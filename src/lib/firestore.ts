import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, Activity, Goal, Action, Badge, Baseline } from './types';

// ─── User Profile ────────────────────────────────────────────────────────────
export const saveUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  await setDoc(doc(db, 'users', userId), { ...data, updatedAt: Timestamp.now() }, { merge: true });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

// ─── Baseline ────────────────────────────────────────────────────────────────
export const saveBaseline = async (userId: string, baseline: Baseline) => {
  await setDoc(doc(db, 'users', userId, 'baseline', 'current'), { ...baseline, savedAt: Timestamp.now() });
};

export const getBaseline = async (userId: string): Promise<Baseline | null> => {
  const snap = await getDoc(doc(db, 'users', userId, 'baseline', 'current'));
  return snap.exists() ? (snap.data() as Baseline) : null;
};

// ─── Activities ──────────────────────────────────────────────────────────────
export const addActivity = async (userId: string, activity: Omit<Activity, 'id'>) => {
  const ref = await addDoc(collection(db, 'activities'), {
    ...activity,
    userId,
    timestamp: Timestamp.now(),
  });
  return ref.id;
};

export const getActivitiesByUser = async (userId: string, days = 30): Promise<Activity[]> => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const q = query(
    collection(db, 'activities'),
    where('userId', '==', userId),
    where('timestamp', '>=', Timestamp.fromDate(since)),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
};

export const deleteActivity = async (activityId: string) => {
  await deleteDoc(doc(db, 'activities', activityId));
};

// ─── Goals ───────────────────────────────────────────────────────────────────
export const addGoal = async (userId: string, goal: Omit<Goal, 'id'>) => {
  const ref = await addDoc(collection(db, 'goals'), { ...goal, userId, createdAt: Timestamp.now() });
  return ref.id;
};

export const getGoals = async (userId: string): Promise<Goal[]> => {
  const q = query(collection(db, 'goals'), where('userId', '==', userId), orderBy('startDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal));
};

export const updateGoal = async (goalId: string, data: Partial<Goal>) => {
  await updateDoc(doc(db, 'goals', goalId), data);
};

export const deleteGoal = async (goalId: string) => {
  await deleteDoc(doc(db, 'goals', goalId));
};

// ─── Actions (Recommendations) ──────────────────────────────────────────────
export const saveActions = async (userId: string, actions: Omit<Action, 'id'>[]) => {
  const batch = actions.map((a) =>
    addDoc(collection(db, 'users', userId, 'actions'), { ...a, createdAt: Timestamp.now() })
  );
  await Promise.all(batch);
};

export const getActions = async (userId: string): Promise<Action[]> => {
  const q = query(collection(db, 'users', userId, 'actions'), orderBy('createdAt', 'desc'), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Action));
};

export const updateAction = async (userId: string, actionId: string, data: Partial<Action>) => {
  await updateDoc(doc(db, 'users', userId, 'actions', actionId), data);
};

// ─── Badges ──────────────────────────────────────────────────────────────────
export const getBadges = async (userId: string): Promise<Badge[]> => {
  const q = query(collection(db, 'users', userId, 'badges'), orderBy('achievedDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Badge));
};

export const awardBadge = async (userId: string, badge: Omit<Badge, 'id'>) => {
  await addDoc(collection(db, 'users', userId, 'badges'), { ...badge, achievedDate: Timestamp.now() });
};
