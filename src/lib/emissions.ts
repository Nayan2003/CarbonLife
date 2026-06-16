// India-specific emission factors (kg CO2)
export const EMISSION_FACTORS = {
  transport: {
    car: 0.21,        // per km (petrol car)
    bike: 0.09,       // per km (motorcycle/scooter)
    bus: 0.089,       // per km
    train: 0.041,     // per km (Indian Railways)
    auto: 0.12,       // per km (auto-rickshaw CNG)
    flight: 0.255,    // per km (economy class)
    walk: 0,
    cycle: 0,
    metro: 0.031,     // per km
    ev: 0.05,         // per km (EV based on Indian grid)
  },
  cooking: {
    lpgPerCylinder: 37.7, // 14.2 kg cylinder
    lpgPerDay: 37.7 / 45, // avg 45 days per cylinder
    pngPerHour: 0.68,     // PNG cooking per hour
    inductionPerHour: 0.41, // grid emission per kWh * ~0.5kWh
  },
  electricity: {
    gridFactor: 0.82, // kg CO2 per kWh (Indian average)
    acPerHour: 1.5 * 0.82, // 1.5kW AC * grid factor
  },
  food: {
    veg: 2.5,        // kg CO2/day
    mixed: 4.5,      // kg CO2/day
    nonVeg: 7.2,     // kg CO2/day
  },
  shopping: {
    clothes: 10,       // per item avg
    electronics: 150,  // per device avg
    appliance: 300,    // per appliance avg
    other: 5,
  },
};

// Calculate transport emissions
export const calcTransport = (mode: string, distanceKm: number): number => {
  const factor = EMISSION_FACTORS.transport[mode as keyof typeof EMISSION_FACTORS.transport] ?? 0;
  return parseFloat((factor * distanceKm).toFixed(3));
};

// Calculate cooking emissions
export const calcCooking = (
  fuel: 'lpg' | 'png' | 'induction',
  value: number, // cylinders for LPG, hours for others
): number => {
  if (fuel === 'lpg') return parseFloat((value * EMISSION_FACTORS.cooking.lpgPerCylinder).toFixed(3));
  if (fuel === 'png') return parseFloat((value * EMISSION_FACTORS.cooking.pngPerHour).toFixed(3));
  if (fuel === 'induction') return parseFloat((value * EMISSION_FACTORS.cooking.inductionPerHour).toFixed(3));
  return 0;
};

// Calculate electricity emissions
export const calcElectricity = (units: number): number => {
  return parseFloat((units * EMISSION_FACTORS.electricity.gridFactor).toFixed(3));
};

// Calculate AC emissions
export const calcAC = (hours: number, count: number): number => {
  return parseFloat((hours * count * EMISSION_FACTORS.electricity.acPerHour).toFixed(3));
};

// Calculate food emissions
export const calcFood = (dietType: 'veg' | 'mixed' | 'nonVeg'): number => {
  return EMISSION_FACTORS.food[dietType];
};

// Calculate baseline from onboarding data
export const calcBaseline = (profile: {
  commuteModes?: string[];
  dailyCommuteKm?: number;
  cookingFuel?: string;
  monthlyElectricityUnits?: number;
  dietType?: string;
  acCount?: number;
  acHoursPerDay?: number;
}): {
  totalMonthlyKg: number;
  transport: number;
  homeEnergy: number;
  cooking: number;
  food: number;
  shopping: number;
} => {
  const days = 30;

  // Transport (monthly)
  const primaryMode = profile.commuteModes?.[0] ?? 'bus';
  const dailyKm = profile.dailyCommuteKm ?? 10;
  const transport = calcTransport(primaryMode, dailyKm) * 2 * days; // round trip

  // Cooking (monthly)
  let cooking = 0;
  if (profile.cookingFuel === 'lpg') {
    cooking = EMISSION_FACTORS.cooking.lpgPerDay * days;
  } else if (profile.cookingFuel === 'png') {
    cooking = EMISSION_FACTORS.cooking.pngPerHour * 2 * days; // 2 hrs/day
  } else if (profile.cookingFuel === 'induction') {
    cooking = EMISSION_FACTORS.cooking.inductionPerHour * 2 * days;
  } else {
    cooking = EMISSION_FACTORS.cooking.lpgPerDay * 20; // mixed
  }

  // Electricity (monthly)
  const units = profile.monthlyElectricityUnits ?? 100;
  const acKwh = (profile.acCount ?? 0) * (profile.acHoursPerDay ?? 4) * 1.5 * days;
  const homeEnergy = calcElectricity(units + acKwh);

  // Food (monthly)
  const dietType = profile.dietType === 'veg' ? 'veg' : profile.dietType === 'nonVeg' ? 'nonVeg' : 'mixed';
  const food = calcFood(dietType as 'veg' | 'mixed' | 'nonVeg') * days;

  // Shopping estimate (monthly)
  const shopping = 20; // average baseline

  const totalMonthlyKg = transport + cooking + homeEnergy + food + shopping;
  return { totalMonthlyKg, transport, homeEnergy, cooking, food, shopping };
};

// Format kg for display
export const formatKg = (kg: number): string => {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg.toFixed(1)} kg`;
};

// Get color for category
export const getCategoryColor = (cat: string): string => {
  const map: Record<string, string> = {
    transport: '#3b82f6',
    cooking: '#f59e0b',
    electricity: '#8b5cf6',
    food: '#10b981',
    shopping: '#ef4444',
    homeEnergy: '#8b5cf6',
  };
  return map[cat] ?? '#6b7280';
};

export const getCategoryIcon = (cat: string): string => {
  const map: Record<string, string> = {
    transport: '🚗',
    cooking: '🍳',
    electricity: '⚡',
    food: '🥗',
    shopping: '🛍️',
    homeEnergy: '⚡',
  };
  return map[cat] ?? '📊';
};
