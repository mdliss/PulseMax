# Firebase Setup Guide

## Quick Setup Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "pulsemax-dashboard")
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Firestore Database
1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we'll set rules later)
4. Select a location (e.g., us-central1)
5. Click "Enable"

### 3. Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (</>)
4. Register app with nickname (e.g., "PulseMax Dashboard")
5. Copy the firebaseConfig object

### 4. Configure Environment Variables

Add these to your `.env` file:

```bash
# Firebase Client Config (from step 3)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:..."

# Firebase Admin (Service Account)
# Get from: Project Settings → Service Accounts → Generate New Private Key
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# Optional: Use emulator in development
NEXT_PUBLIC_FIREBASE_EMULATOR="false"
```

### 5. Get Service Account Key (for server-side)
1. In Firebase Console, go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the entire JSON content and set as `FIREBASE_SERVICE_ACCOUNT_KEY` env variable

### 6. Set Firestore Security Rules

Go to Firestore Database → Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    // Sessions
    match /sessions/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Customers
    match /customers/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Tutors
    match /tutors/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Customer Health Scores
    match /customer_health_scores/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Tutor Performance
    match /tutor_performance/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Alerts
    match /alerts/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Recommendations
    match /recommendations/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Supply Demand Forecasts
    match /supply_demand_forecasts/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Metrics Cache
    match /metrics_cache/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Inbound Calls
    match /inbound_calls/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

### 7. Create Firestore Indexes

Go to Firestore Database → Indexes and create these composite indexes:

**Alerts:**
- Collection: `alerts`
- Fields: `status` (Ascending), `createdAt` (Descending)

**Customer Health:**
- Collection: `customer_health_scores`
- Fields: `riskTier` (Ascending), `riskScore` (Descending)

**Supply Demand:**
- Collection: `supply_demand_forecasts`
- Fields: `subject` (Ascending), `forecastHour` (Ascending)

### 8. Optional: Set up Firebase Emulator (for local development)

```bash
npm install -g firebase-tools
firebase login
firebase init emulators
# Select: Firestore, Authentication
firebase emulators:start
```

Then set `NEXT_PUBLIC_FIREBASE_EMULATOR="true"` in `.env`

## Firestore Collections Structure

```
collections/
├── sessions/               # Time-series session data
│   └── {sessionId}
├── customers/             # Customer master data
│   └── {customerId}
├── tutors/               # Tutor master data
│   └── {tutorId}
├── customer_health_scores/  # Calculated health scores
│   └── {scoreId}
├── tutor_performance/    # Tutor performance metrics
│   └── {performanceId}
├── alerts/              # System alerts
│   └── {alertId}
├── recommendations/     # AI recommendations
│   └── {recommendationId}
├── supply_demand_forecasts/  # Demand predictions
│   └── {forecastId}
├── inbound_calls/       # Customer support calls
│   └── {callId}
└── metrics_cache/       # Cached dashboard metrics
    └── dashboard       # Single doc with latest metrics
```

## Testing Firebase Connection

1. Start the dev server: `npm run dev`
2. Open browser console on http://localhost:3000
3. You should see Firebase initialized without errors
4. Check Firestore console for any read/write operations

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Check Firestore security rules are published
- Ensure user is authenticated (use Firebase Auth)

### Error: "Firebase not initialized"
- Verify all env variables are set
- Check `.env` file is in project root
- Restart dev server after changing env vars

### Error: "Quota exceeded"
- Firebase free tier limits:
  - 50k reads/day
  - 20k writes/day
  - 1 GiB storage
- Upgrade to Blaze plan for production

## Next Steps

1. Set up Firebase Authentication for user login
2. Configure Cloud Functions for background processing
3. Set up Firebase Storage for file uploads (if needed)
4. Enable Firebase Analytics for usage tracking
