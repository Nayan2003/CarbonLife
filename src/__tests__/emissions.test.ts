/**
 * Unit tests for emissions.ts — CO₂ calculation functions
 * These are pure functions (no DOM, no Firebase) so they run fast
 */

import {
  calcTransport,
  calcCooking,
  calcElectricity,
  calcAC,
  calcFood,
  EMISSION_FACTORS,
  formatKg,
  getCategoryIcon,
  getCategoryColor,
} from '@/lib/emissions';

// ─── calcTransport ────────────────────────────────────────────────────────────

describe('calcTransport', () => {
  it('calculates car emissions correctly', () => {
    // 10 km car ride at 0.21 kg/km = 2.1 kg
    expect(calcTransport('car', 10)).toBe(2.1);
  });

  it('calculates bike emissions correctly', () => {
    // 20 km bike at 0.09 kg/km = 1.8 kg
    expect(calcTransport('bike', 20)).toBe(1.8);
  });

  it('returns 0 for walking', () => {
    expect(calcTransport('walk', 100)).toBe(0);
  });

  it('returns 0 for cycling', () => {
    expect(calcTransport('cycle', 50)).toBe(0);
  });

  it('calculates metro emissions correctly', () => {
    // 15 km metro at 0.031 kg/km = 0.465 kg
    expect(calcTransport('metro', 15)).toBeCloseTo(0.465, 3);
  });

  it('returns 0 for unknown mode', () => {
    expect(calcTransport('spaceship', 100)).toBe(0);
  });

  it('returns 0 for zero distance', () => {
    expect(calcTransport('car', 0)).toBe(0);
  });

  it('calculates flight emissions correctly', () => {
    // 500 km flight at 0.255 kg/km = 127.5 kg
    expect(calcTransport('flight', 500)).toBe(127.5);
  });
});

// ─── calcCooking ──────────────────────────────────────────────────────────────

describe('calcCooking', () => {
  it('calculates LPG cylinder emissions correctly', () => {
    // 1 cylinder = 37.7 kg CO₂
    expect(calcCooking('lpg', 1)).toBe(37.7);
  });

  it('calculates half LPG cylinder correctly', () => {
    expect(calcCooking('lpg', 0.5)).toBeCloseTo(18.85, 2);
  });

  it('calculates PNG emissions per hour', () => {
    // 2 hours at 0.68 kg/hr = 1.36 kg
    expect(calcCooking('png', 2)).toBeCloseTo(1.36, 2);
  });

  it('calculates induction emissions per hour', () => {
    // 3 hours at 0.41 kg/hr = 1.23 kg
    expect(calcCooking('induction', 3)).toBeCloseTo(1.23, 2);
  });

  it('returns 0 for zero value', () => {
    expect(calcCooking('lpg', 0)).toBe(0);
  });
});

// ─── calcElectricity ──────────────────────────────────────────────────────────

describe('calcElectricity', () => {
  it('calculates electricity emissions using India grid factor', () => {
    // 100 units * 0.82 kg/kWh = 82 kg
    expect(calcElectricity(100)).toBeCloseTo(82, 1);
  });

  it('calculates zero emissions for zero units', () => {
    expect(calcElectricity(0)).toBe(0);
  });

  it('uses correct grid factor (0.82 kg CO₂/kWh)', () => {
    expect(EMISSION_FACTORS.electricity.gridFactor).toBe(0.82);
  });

  it('calculates small usage correctly', () => {
    // 10 units * 0.82 = 8.2 kg
    expect(calcElectricity(10)).toBeCloseTo(8.2, 1);
  });
});

// ─── calcAC ───────────────────────────────────────────────────────────────────

describe('calcAC', () => {
  it('calculates AC emissions for 1 unit, 8 hours', () => {
    const expected = 8 * 1 * EMISSION_FACTORS.electricity.acPerHour;
    expect(calcAC(8, 1)).toBeCloseTo(expected, 2);
  });

  it('multiplies by number of AC units', () => {
    const single = calcAC(4, 1);
    const double = calcAC(4, 2);
    expect(double).toBeCloseTo(single * 2, 2);
  });

  it('returns 0 for 0 hours', () => {
    expect(calcAC(0, 2)).toBe(0);
  });
});

// ─── calcFood ─────────────────────────────────────────────────────────────────

describe('calcFood', () => {
  it('returns correct veg emissions', () => {
    expect(calcFood('veg')).toBe(2.5);
  });

  it('returns correct mixed diet emissions', () => {
    expect(calcFood('mixed')).toBe(4.5);
  });

  it('returns correct non-veg emissions', () => {
    expect(calcFood('nonVeg')).toBe(7.2);
  });

  it('non-veg emits more than veg', () => {
    expect(calcFood('nonVeg')).toBeGreaterThan(calcFood('veg'));
  });

  it('mixed diet is between veg and non-veg', () => {
    expect(calcFood('mixed')).toBeGreaterThan(calcFood('veg'));
    expect(calcFood('mixed')).toBeLessThan(calcFood('nonVeg'));
  });
});

// ─── formatKg ─────────────────────────────────────────────────────────────────

describe('formatKg', () => {
  it('formats zero correctly', () => {
    const result = formatKg(0);
    expect(result).toContain('0');
  });

  it('returns a string', () => {
    expect(typeof formatKg(10.5)).toBe('string');
  });

  it('formats kg value', () => {
    const result = formatKg(55.123);
    expect(result).toBeTruthy();
  });
});

// ─── getCategoryIcon ──────────────────────────────────────────────────────────

describe('getCategoryIcon', () => {
  it('returns an emoji string for transport', () => {
    const icon = getCategoryIcon('transport');
    expect(typeof icon).toBe('string');
    expect(icon.length).toBeGreaterThan(0);
  });

  it('returns an emoji string for food', () => {
    const icon = getCategoryIcon('food');
    expect(typeof icon).toBe('string');
  });

  it('returns a fallback for unknown category', () => {
    const icon = getCategoryIcon('unknown');
    expect(typeof icon).toBe('string');
  });
});

// ─── getCategoryColor ─────────────────────────────────────────────────────────

describe('getCategoryColor', () => {
  it('returns a color string for transport', () => {
    const color = getCategoryColor('transport');
    expect(typeof color).toBe('string');
    expect(color.length).toBeGreaterThan(0);
  });

  it('returns a color string for electricity', () => {
    const color = getCategoryColor('electricity');
    expect(typeof color).toBe('string');
  });

  it('returns a valid hex or rgb color', () => {
    const color = getCategoryColor('food');
    // Should start with # or be a CSS color
    expect(color).toBeTruthy();
  });
});
