import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  ageGroup?: string;
  city?: string;
  householdSize?: number;
  role?: 'student' | 'professional' | 'homemaker' | 'retired' | 'other';
  ownsVehicle?: boolean;
  vehicleType?: 'car' | 'bike' | 'both' | 'none';
  commuteModes?: string[];
  cookingFuel?: 'lpg' | 'png' | 'induction' | 'mixed';
  housing?: 'hostel' | 'pg' | 'apartment' | 'house';
  acCount?: number;
  onboardingComplete?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Baseline {
  totalMonthlyKg: number;
  transport: number;
  homeEnergy: number;
  cooking: number;
  food: number;
  shopping: number;
  savedAt?: Timestamp;
}

export interface Activity {
  id?: string;
  userId: string;
  type: 'transport' | 'cooking' | 'electricity' | 'food' | 'shopping';
  subtype?: string;
  details: Record<string, unknown>;
  estimatedCO2: number; // kg CO2
  date: string; // ISO date string
  timestamp?: Timestamp;
  note?: string;
}

export interface Goal {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  targetKg: number;
  period: 'weekly' | 'monthly';
  currentProgress: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'failed';
  createdAt?: Timestamp;
}

export interface Action {
  id?: string;
  userId?: string;
  title: string;
  description: string;
  category: 'transport' | 'cooking' | 'electricity' | 'food' | 'shopping';
  estimatedSaving: number;
  status: 'planned' | 'in-progress' | 'completed' | 'skipped';
  why?: string;
  createdAt?: Timestamp;
}

export interface Badge {
  id?: string;
  badgeType: string;
  title: string;
  description: string;
  icon: string;
  achievedDate?: Timestamp;
}

export interface WeeklyStats {
  week: string; // e.g. "2024-W01"
  totalKg: number;
  transport: number;
  cooking: number;
  electricity: number;
  food: number;
  shopping: number;
}

export interface DailyPoint {
  date: string;
  totalKg: number;
  transport: number;
  cooking: number;
  electricity: number;
  food: number;
  shopping: number;
}
