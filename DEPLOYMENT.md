# CarbonLife — Deployment Guide

## Prerequisites
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Google Cloud CLI: https://cloud.google.com/sdk/docs/install

---

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable these services:
   - **Authentication** → Sign-in methods → Enable Google and Email/Password
   - **Firestore Database** → Create in production mode
   - **Hosting** → Set up
3. Get your Firebase config from Project Settings → Your apps → Web app

---

## Step 2: Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API key" → Create API key
3. Copy the key

---

## Step 3: Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=yourproject
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

---

## Step 4: Update Firebase Project ID

Edit `.firebaserc`:
```json
{
  "projects": {
    "default": "your-actual-firebase-project-id"
  }
}
```

---

## Step 5: Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Step 6: Deploy to Firebase Hosting

```bash
# Login to Firebase
firebase login

# Build the static export
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at: `https://yourproject.web.app`

---

## Step 7: Deploy Firestore Rules & Indexes

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## Step 8: Set up Firestore Security Rules

The `firestore.rules` file is already configured to:
- Allow users to only read/write their own data
- Protect all collections with auth checks

---

## Firestore Collections Created Automatically

| Collection | Description |
|---|---|
| `users/{userId}` | User profile and settings |
| `users/{userId}/baseline/current` | Monthly baseline emissions |
| `users/{userId}/badges/{badgeId}` | Earned achievement badges |
| `users/{userId}/actions/{actionId}` | AI recommendations |
| `activities/{activityId}` | Daily logged activities |
| `goals/{goalId}` | User goals |

---

## Google Cloud CLI Commands

```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Initialize and authenticate
gcloud init
gcloud auth login

# Set your project
gcloud config set project your-firebase-project-id

# View Firebase hosting deployments
gcloud firebase hosting:channel:list
```

---

## Environment for Production

For production, consider:
1. Setting Firestore to **production mode** (already done in rules)
2. Adding a **budget alert** in Google Cloud Console
3. Enabling **Firebase App Check** for security

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Styling | CSS Modules + CSS Variables |
| Charts | Recharts |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| AI | Google Gemini 1.5 Flash |
| Hosting | Firebase Hosting |
| Deployment | Firebase CLI + Google Cloud CLI |
