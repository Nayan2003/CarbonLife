import { GoogleGenerativeAI } from '@google/generative-ai';

const getGenAI = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  return new GoogleGenerativeAI(apiKey);
};

// ─── Structured Insight Type ─────────────────────────────────────────────────
export interface DashboardInsight {
  emoji: string;
  title: string;
  detail: string;
  estimatedSaving?: string; // e.g. "↓ 8–12 kg/month"
  type: 'tip' | 'warning' | 'praise' | 'info';
}

// ─── Generate AI Insights for Dashboard ──────────────────────────────────────
export const generateDashboardInsights = async (data: {
  weeklyTotal: number;
  lastWeekTotal: number;
  topCategory: string;
  breakdown: Record<string, number>;
  userRole?: string;
  city?: string;
}): Promise<DashboardInsight[]> => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const trendText = data.lastWeekTotal > 0
      ? data.weeklyTotal < data.lastWeekTotal
        ? `DOWN ${((data.lastWeekTotal - data.weeklyTotal) / data.lastWeekTotal * 100).toFixed(0)}% vs last week — great!`
        : `UP ${((data.weeklyTotal - data.lastWeekTotal) / data.lastWeekTotal * 100).toFixed(0)}% vs last week`
      : 'first week of tracking';

    const breakdownText = Object.entries(data.breakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, kg]) => `${cat}: ${kg.toFixed(1)} kg`)
      .join(', ');

    const prompt = `You are a carbon footprint advisor for Indian users. Generate exactly 3 personalized, actionable insights.

User data:
- Role: ${data.userRole || 'general'}
- City: ${data.city || 'India'}
- This week total: ${data.weeklyTotal.toFixed(1)} kg CO2 (${trendText})
- Last week total: ${data.lastWeekTotal.toFixed(1)} kg CO2
- Category breakdown: ${breakdownText}
- Top emitter: ${data.topCategory} (${(data.breakdown[data.topCategory] || 0).toFixed(1)} kg)

Indian context: avg Indian emits ~130 kg CO2/month (~32 kg/week). LPG cooking = ~0.84 kg/day, car commute = 0.21 kg/km.

Rules:
1. Be SPECIFIC with numbers from the data (e.g. "You emitted 33.9 kg from cooking")
2. Give ONE concrete action with estimated saving in kg
3. Be encouraging but honest
4. For type: use "praise" if week improved, "warning" if top category is very high, "tip" for actionable advice, "info" for context

Return ONLY a valid JSON array of exactly 3 objects, no markdown:
[
  {
    "emoji": "🍳",
    "title": "Short title (5 words max)",
    "detail": "1-2 specific sentences with numbers",
    "estimatedSaving": "↓ X–Y kg/month (optional, only if giving actionable tip)",
    "type": "tip|warning|praise|info"
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length >= 1) return parsed.slice(0, 3);
    throw new Error('Invalid response shape');
  } catch {
    // Intelligent fallback with real data
    const topKg = data.breakdown[data.topCategory] || 0;
    const trend = data.lastWeekTotal > 0
      ? ((data.weeklyTotal - data.lastWeekTotal) / data.lastWeekTotal) * 100
      : 0;
    const fallbacks: DashboardInsight[] = [
      {
        emoji: trend <= 0 ? '📉' : '📈',
        title: trend <= 0 ? 'Week-over-week progress' : 'Emissions increased',
        detail: data.lastWeekTotal > 0
          ? `You emitted ${data.weeklyTotal.toFixed(1)} kg this week vs ${data.lastWeekTotal.toFixed(1)} kg last week — ${trend <= 0 ? `that's ${Math.abs(trend).toFixed(0)}% less! Keep it up.` : `${trend.toFixed(0)}% more. Let's work on reducing it.`}`
          : `You emitted ${data.weeklyTotal.toFixed(1)} kg CO₂ this week. The Indian average is ~32 kg/week.`,
        type: trend <= 0 ? 'praise' : 'warning',
      },
      {
        emoji: data.topCategory === 'cooking' ? '🍳' : data.topCategory === 'transport' ? '🚗' : data.topCategory === 'electricity' ? '⚡' : data.topCategory === 'food' ? '🥗' : '🛍️',
        title: `${data.topCategory.charAt(0).toUpperCase() + data.topCategory.slice(1)} is your top emitter`,
        detail: `${data.topCategory.charAt(0).toUpperCase() + data.topCategory.slice(1)} contributed ${topKg.toFixed(1)} kg (${data.weeklyTotal > 0 ? ((topKg / data.weeklyTotal) * 100).toFixed(0) : 0}% of your total). ${data.topCategory === 'cooking' ? 'Switching 3 meals/week to induction can help.' : data.topCategory === 'transport' ? 'Using public transport 2 days/week saves ~4 kg.' : 'Small daily changes add up fast.'}`,
        estimatedSaving: data.topCategory === 'cooking' ? '↓ 8–12 kg/month' : data.topCategory === 'transport' ? '↓ 4–8 kg/month' : undefined,
        type: topKg > data.weeklyTotal * 0.5 ? 'warning' : 'tip',
      },
      {
        emoji: '💡',
        title: 'Log daily for better insights',
        detail: `Gemini analyzes your activities, trends, and goals to give hyper-personalized recommendations. Keep logging every day to unlock deeper insights!`,
        type: 'info',
      },
    ];
    return fallbacks;
  }
};

// ─── Generate Personalized Recommendations ───────────────────────────────────
export interface AIRecommendation {
  title: string;
  description: string;
  category: string;
  estimatedSaving: number;
  why: string;
}

export const generateRecommendations = async (data: {
  topCategories: { name: string; kg: number }[];
  userProfile: { role?: string; city?: string; commuteModes?: string[]; cookingFuel?: string };
  weeklyTotal: number;
}): Promise<AIRecommendation[]> => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a carbon footprint advisor for Indian users. Generate 5 personalized, actionable carbon reduction recommendations.

User data:
- Role: ${data.userProfile.role || 'general'}
- City: ${data.userProfile.city || 'India'}
- Commute modes: ${(data.userProfile.commuteModes || []).join(', ')}
- Cooking fuel: ${data.userProfile.cookingFuel || 'lpg'}
- Weekly emissions: ${data.weeklyTotal.toFixed(1)} kg CO2
- Top emitting categories: ${data.topCategories.map((c) => `${c.name}: ${c.kg.toFixed(1)} kg`).join(', ')}

Return ONLY a JSON array of 5 objects with this exact structure:
[{"title":"...","description":"...","category":"transport|cooking|electricity|food|shopping","estimatedSaving":0.5,"why":"..."}]
estimatedSaving should be kg CO2 per week saved. No markdown, no extra text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      {
        title: 'Switch to public transport 2 days a week',
        description: 'Replace car commute with metro or bus twice weekly',
        category: 'transport',
        estimatedSaving: 4.2,
        why: 'Transport is your top emission source. Even 2 days of public transit saves significant CO2.',
      },
      {
        title: 'Reduce AC temperature by 1°C',
        description: 'Set AC to 25°C instead of 24°C',
        category: 'electricity',
        estimatedSaving: 0.8,
        why: 'Every degree warmer reduces AC energy by ~6%.',
      },
      {
        title: 'Add 2 vegetarian days per week',
        description: 'Replace meat meals with plant-based alternatives',
        category: 'food',
        estimatedSaving: 5.4,
        why: 'A veg day emits about 65% less CO2 than a non-veg day.',
      },
    ];
  }
};

// ─── Generate Baseline Explanation ───────────────────────────────────────────
export const generateBaselineExplanation = async (data: {
  totalMonthlyKg: number;
  transport: number;
  homeEnergy: number;
  cooking: number;
  food: number;
  role?: string;
  city?: string;
}): Promise<string> => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `In 2-3 simple, friendly sentences, explain this person's monthly carbon footprint baseline to them. Be encouraging and highlight the biggest opportunity. Use simple language.

Total: ${data.totalMonthlyKg.toFixed(0)} kg CO2/month
Transport: ${data.transport.toFixed(0)} kg
Home energy: ${data.homeEnergy.toFixed(0)} kg
Cooking: ${data.cooking.toFixed(0)} kg
Food: ${data.food.toFixed(0)} kg
Location: ${data.city || 'India'}
Role: ${data.role || 'general user'}

Average Indian: ~130 kg CO2/month
Return ONLY the explanation text, no JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return `Your estimated footprint is ${data.totalMonthlyKg.toFixed(0)} kg CO₂ per month. Your biggest opportunity is ${
      data.transport > data.homeEnergy && data.transport > data.cooking
        ? 'transport — small shifts like taking public transit can make a big difference'
        : data.homeEnergy > data.cooking
        ? 'home energy — optimizing your AC and electricity use can significantly cut emissions'
        : 'cooking — switching to cleaner fuel or reducing LPG usage helps a lot'
    }. Let's start tracking to reduce it!`;
  }
};

// ─── Generate Action Explanation ─────────────────────────────────────────────
export const generateActionWhy = async (action: {
  title: string;
  category: string;
  estimatedSaving: number;
}): Promise<string> => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `In 2 sentences, explain why this carbon reduction action matters for an Indian user. Be specific with data.
Action: ${action.title}
Category: ${action.category}
Estimated saving: ${action.estimatedSaving} kg CO2/week
Return ONLY the explanation, no JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return `This action can save approximately ${action.estimatedSaving} kg CO₂ per week, which adds up to ${(action.estimatedSaving * 52).toFixed(0)} kg per year — a meaningful contribution to reducing your carbon footprint.`;
  }
};
