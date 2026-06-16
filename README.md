# 🌱 CarbonLife — AI-Powered Carbon Footprint Tracker

<div align="center">

![CarbonLife Banner](https://img.shields.io/badge/CarbonLife-Carbon%20Footprint%20Tracker-22c55e?style=for-the-badge&logo=leaf&logoColor=white)

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Google%20Cloud%20Run-4285F4?style=for-the-badge)](https://carbonlife-582813604963.asia-south1.run.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FF6F00?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Insights-8B5CF6?style=for-the-badge&logo=google)](https://aistudio.google.com)
[![Cloud Run](https://img.shields.io/badge/Google%20Cloud-Run-4285F4?style=for-the-badge&logo=google-cloud)](https://cloud.run)

> **Built for Google PromptWars Virtual — Challenge 3: Carbon Footprint Awareness Platform**

*Helping individuals understand, track, and reduce their carbon footprint through personalized AI insights.*

</div>

---

## 📸 Preview

| Dashboard | Carbon Heatmap | Gemini AI Insights |
|-----------|---------------|-------------------|
| Carbon Score Ring + KPI Cards | 35-day GitHub-style activity map | Real-time personalized tips |

---

## ✨ Features

### 📊 Smart Dashboard
- **Carbon Score Ring** — Animated SVG ring with color-coded status (Excellent / Good / High / Critical)
- **KPI Cards** — Weekly total, monthly baseline, top emitter, activities logged
- **Weekly Emissions Chart** — Line chart showing CO₂ per day over the last 7 days
- **Category Donut Chart** — Breakdown by transport, food, cooking, electricity, shopping

### 📅 35-Day Carbon Activity Heatmap
- GitHub contribution graph-style visualization
- Color intensity based on daily CO₂ (green → yellow → orange → red)
- Hover tooltip showing exact date, kg CO₂, and intensity level
- Stats strip: total kg, days tracked, average per active day

### 🤖 Gemini AI Insights
- Personalized tips powered by **Google Gemini 1.5 Flash**
- Structured JSON responses with emoji, type (tip/warning/praise), and estimated savings
- Refresh anytime for fresh insights based on your latest data

### 🌍 CO₂ Equivalents Widget
- Translates your emissions into relatable real-world comparisons
- Examples: trees to offset, flights equivalent, km driven, smartphones charged
- Count-up animations for engaging UX

### ⚡ Quick Log Shortcuts
- 6 one-tap cards for common activities
- Car commute, cooking, electricity, meals, shopping, metro/bus
- Navigates directly to the tracking page with pre-filled type

### 🎯 Goals & Badges
- Set weekly/monthly carbon reduction targets
- Live progress bars showing current usage vs target
- Achievement badges for milestones

### 🔐 Authentication
- Google Sign-In + Email/Password via Firebase Auth
- Persistent sessions across devices
- Secure Firestore rules — users can only access their own data

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router) + TypeScript |
| **Styling** | Vanilla CSS + CSS Modules + Custom Design System |
| **Auth** | Firebase Authentication |
| **Database** | Cloud Firestore |
| **AI** | Google Gemini 1.5 Flash |
| **Charts** | Recharts |
| **Deployment** | Google Cloud Run (asia-south1 — Mumbai) |
| **Container** | Docker (multi-stage, Node 20 Alpine) |
| **CI/CD** | Google Cloud Build |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Next.js)                 │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │ Auth     │  │Dashboard │  │  Track / Goals /   │ │
│  │ Page     │  │ Page     │  │  Profile Pages     │ │
│  └────┬─────┘  └────┬─────┘  └────────┬───────────┘ │
│       │              │                  │             │
│  ┌────▼──────────────▼──────────────────▼──────────┐ │
│  │           Firebase SDK (Client-Side)             │ │
│  └──────┬──────────────────────────┬───────────────┘ │
└─────────┼──────────────────────────┼─────────────────┘
          │                          │
    ┌─────▼──────┐           ┌───────▼────────┐
    │  Firebase  │           │  Cloud Firestore│
    │    Auth    │           │  (user data,   │
    │            │           │   activities,  │
    └────────────┘           │   goals)       │
                             └────────────────┘
          │
    ┌─────▼──────────────────┐
    │   Google Gemini API    │
    │  (AI Insights Engine)  │
    └────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Firebase project ([create one here](https://console.firebase.google.com))
- Google Gemini API key ([get one here](https://aistudio.google.com))

### 1. Clone the repository
```bash
git clone https://github.com/Nayan2003/CarbonLife.git
cd CarbonLife
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### 4. Set up Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init firestore
```

Enable in Firebase Console:
- ✅ Authentication → Google Sign-In + Email/Password
- ✅ Firestore Database

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📦 Deployment (Google Cloud Run)

### Prerequisites
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed
- Docker installed (or use Cloud Build)

### 1. Create `.env.production` with your actual keys (not committed to git)

### 2. Deploy with one command

```bash
gcloud run deploy carbonlife \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --project YOUR_PROJECT_ID
```

### 3. Deploy Firestore security rules

```bash
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

### 4. Add your Cloud Run URL to Firebase Authorized Domains

Firebase Console → Authentication → Settings → Authorized Domains → Add domain

---

## 📁 Project Structure

```
carbonlife/
├── src/
│   ├── app/
│   │   ├── auth/          # Login / Sign-up page
│   │   ├── dashboard/     # Main dashboard
│   │   ├── track/         # Log new activity
│   │   ├── goals/         # Goals & badges
│   │   ├── actions/       # Recommended eco actions
│   │   ├── profile/       # User settings
│   │   ├── onboarding/    # First-time setup
│   │   └── globals.css    # Design system tokens
│   ├── components/
│   │   ├── charts/        # Recharts wrappers
│   │   ├── layout/        # Sidebar, navigation
│   │   └── ui/            # CarbonScore, Heatmap, CO2Equivalents
│   ├── context/
│   │   └── AuthContext.tsx # Firebase auth state
│   └── lib/
│       ├── firebase.ts    # Firebase initialization
│       ├── firestore.ts   # Database utilities
│       ├── gemini.ts      # Gemini AI integration
│       ├── emissions.ts   # CO₂ calculation factors
│       └── types.ts       # TypeScript interfaces
├── firestore.rules        # Production security rules
├── Dockerfile             # Multi-stage Docker build
└── DEPLOYMENT.md          # Detailed deployment guide
```

---

## 🔒 Security

- **Firestore Rules** — Users can only read/write their own data. Field validation and ownership checks enforced at database level.
- **No secrets in code** — All API keys loaded from environment variables
- **Non-root Docker** — Container runs as unprivileged `nextjs` user
- **Badges immutable** — Once earned, badges cannot be modified via client

---

## 🌍 Carbon Emission Factors

Emission calculations are based on India-specific factors:

| Category | Source |
|----------|--------|
| Transport | km × fuel type factor (car, bike, metro, bus) |
| Cooking | LPG cylinder usage / induction hours |
| Electricity | Units × India grid emission factor (0.82 kg/kWh) |
| Food | Meal type (veg: ~2kg, non-veg: ~5kg per meal) |
| Shopping | Category-based estimates (clothing, electronics, etc.) |

---

## 📊 Firestore Data Model

```
users/{userId}
  ├── baseline/{docId}     # Monthly baseline emissions
  ├── badges/{docId}       # Earned achievement badges
  └── actions/{docId}      # Recommended eco actions

activities/{activityId}
  ├── userId, type, date
  ├── estimatedCO2 (kg)
  └── metadata (distance, fuel, etc.)

goals/{goalId}
  ├── userId, title
  ├── targetKg, period (weekly/monthly)
  └── status (active/completed)
```

---

## 🏆 Hackathon

Built for **Google PromptWars Virtual — Challenge 3**:
> *"Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights."*

**#BuildwithAI #PromptWarsVirtual #Challenge3 #GeminiAI #GoogleCloud**

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ and ☕ by [Nayan Khuje](https://github.com/Nayan2003)

**🌱 Every kg of CO₂ saved matters.**

</div>
