# PulseMax Analytics

Real-time marketplace health monitoring and AI-powered analytics platform for online tutoring marketplaces.

## Overview

PulseMax is a comprehensive analytics dashboard that provides real-time insights, predictive analytics, and automated alerting for marketplace operations. Built with Next.js and Firebase, it offers live monitoring of key metrics, AI-powered forecasting, and actionable recommendations to optimize marketplace performance.

## Features

### 1. Marketplace Health Dashboard
- **Real-time Monitoring**: Live tracking of active sessions, daily volumes, and ratings
- **Performance Metrics**: Tutor utilization rates, customer satisfaction scores, and supply-demand balance
- **Data Visualization**: Interactive charts and graphs using Recharts
- **Data Export**: CSV export functionality for deeper analysis

### 2. Supply-Demand Predictions
- **24-Hour Forecasting**: AI-powered predictions using Holt-Winters Exponential Smoothing
- **Risk Classification**: Automatic categorization (Critical, High, Medium, Low)
- **Proactive Alerts**: Real-time notifications for supply-demand imbalances
- **Actionable Recommendations**: Specific guidance on tutor recruitment and scheduling

### 3. First Session Success Tracking
- **Success Rate Analytics**: Track first session outcomes by tutor and subject
- **Anomaly Detection**: Automated detection of performance drops
- **Segmentation Analysis**: Success rates broken down by customer segment (K-12, College, Professional, Test Prep)
- **Performance Monitoring**: Real-time alerts for tutors performing below baseline

### 4. Customer Churn Prediction
- **ML-Powered Predictions**: Logistic regression model for churn probability
- **Risk Factor Analysis**: Detailed breakdown of churn indicators (ratings, session velocity, engagement)
- **Intervention Strategies**: Personalized recommendations to reduce churn
- **Customer Segmentation**: Risk analysis by customer cohort

### 5. Campaign Recommendations
- **AI-Driven Optimization**: Automated suggestions for marketing spend and resource allocation
- **Budget Planning**: Data-driven recommendations for budget increases/decreases
- **Recruitment Guidance**: Targeted tutor recruitment strategies
- **Schedule Optimization**: Algorithmic improvements to tutor-student matching

## Tech Stack

### Frontend
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Recharts 3.3.0** - Data visualization
- **Lucide React** - Icon library

### Backend & Database
- **Firebase** - Real-time database and authentication
- **Firebase Admin** - Server-side Firebase operations
- **Next.js API Routes** - Serverless API endpoints

### Infrastructure
- **Vercel** - Deployment platform
- **Upstash Redis** - Caching and session management
- **BullMQ** - Job queue for background processing
- **Sentry** - Error monitoring and tracking

### AI & Analytics
- **simple-statistics** - Statistical computations
- **regression** - ML model implementations
- **Custom algorithms** - Holt-Winters, anomaly detection, churn prediction

### Authentication & Communication
- **NextAuth** - Authentication framework
- **SendGrid** - Email delivery

## Installation

### Prerequisites
- Node.js 20+
- npm or yarn
- Firebase project
- Upstash Redis account (optional)
- SendGrid API key (optional, for email alerts)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd PulseMax
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# Upstash Redis
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# SendGrid (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Sentry (Optional)
SENTRY_DSN=your_sentry_dsn

# Mock Data Mode (Development)
NEXT_PUBLIC_USE_MOCK_DATA=true
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
PulseMax/
├── app/
│   ├── api/                      # API routes
│   │   ├── supply-demand/        # Prediction endpoints
│   │   ├── churn-prediction/     # Churn analysis endpoints
│   │   ├── success-tracking/     # Success metrics endpoints
│   │   ├── campaign-recommendations/ # Campaign endpoints
│   │   └── webhooks/             # External integrations
│   ├── dashboard/                # Marketplace health dashboard
│   ├── supply-demand/            # Supply-demand predictions page
│   ├── success-tracking/         # Success tracking page
│   ├── churn-prediction/         # Churn prediction page
│   ├── campaign-recommendations/ # Campaign recommendations page
│   ├── alert-history/            # Alert management page
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles and design system
│   └── page.tsx                  # Homepage
├── components/
│   ├── AnimatedCounter.tsx       # Animated number component
│   ├── FeedbackButton.tsx        # User feedback widget
│   ├── FeedbackForm.tsx          # Feedback form modal
│   └── SessionProvider.tsx       # Auth session wrapper
├── lib/
│   ├── firebase.ts               # Firebase configuration
│   ├── mockData.ts               # Mock data generators
│   ├── auth.ts                   # Authentication utilities
│   └── sentry.ts                 # Error monitoring setup
├── scripts/
│   └── populate-firebase.ts      # Database seeding script
├── public/                       # Static assets
├── .env.local                    # Environment variables (not in repo)
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind configuration
└── vercel.json                   # Vercel deployment config
```

## Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Set up the following collections:
   - `sessions` - Tutoring session data
   - `tutors` - Tutor profiles and availability
   - `customers` - Customer information and behavior

4. Create indexes (see `firestore.indexes.json`):
```bash
firebase deploy --only firestore:indexes
```

### Data Population

To populate Firebase with sample data:

```bash
npm run populate-firebase
```

This creates realistic test data for development and testing.

### Mock Data Mode

For development without Firebase:

1. Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local`
2. Mock data generators in `lib/mockData.ts` will provide realistic simulated data
3. All dashboards will update with randomized data every 5 seconds

## Usage

### Marketplace Health Dashboard

Navigate to `/dashboard` to view:
- Active sessions count
- Daily session volume
- Average rating (1-5 stars)
- Tutor utilization rate
- Customer satisfaction score
- Supply-demand balance

**Export Data**: Click "Export Data" button to download CSV of customer metrics.

### Supply-Demand Predictions

Navigate to `/supply-demand` to view:
- 24-hour forecast of session demand vs. tutor availability
- Risk hours breakdown (Critical, High, Medium, Low)
- Real-time alerts for imbalances
- Supply-demand ratio trends
- Model confidence scores

**Alert Types**:
- Critical: Ratio > 1.5 (severe shortage)
- High: Ratio 1.2-1.5 (significant shortage)
- Medium: Ratio 0.9-1.2 (balanced)
- Low: Ratio < 0.9 (excess capacity)

### Success Tracking

Navigate to `/success-tracking` to view:
- Overall first session success rate
- Success rates by tutor and subject
- Success rates by customer segment
- Anomaly alerts for performance drops

**Anomaly Detection**: Automatically identifies when tutor performance drops below historical baseline (configurable threshold).

### Churn Prediction

Navigate to `/churn-prediction` to view:
- Customer churn probabilities
- Risk factors and their impact weights
- Recommended interventions
- Segmentation analysis

**Risk Levels**:
- Critical: >80% churn probability
- High: 60-80% churn probability
- Medium: 40-60% churn probability
- Low: <40% churn probability

### Campaign Recommendations

Navigate to `/campaign-recommendations` to view:
- Marketing budget recommendations
- Tutor recruitment strategies
- Schedule optimization suggestions
- Demand incentive campaigns

## API Documentation

### Core Endpoints

#### GET `/api/marketplace/health`
Returns current marketplace health metrics.

**Response**:
```json
{
  "activeSessions": 25,
  "dailySessionVolume": 150,
  "averageRating": 4.7,
  "tutorUtilizationRate": 78.5,
  "customerSatisfactionScore": 92.3,
  "supplyDemandBalance": 1.1,
  "timestamp": "2025-11-08T12:00:00.000Z"
}
```

#### GET `/api/supply-demand`
Returns supply-demand predictions and alerts.

**Response**:
```json
{
  "predictionData": {
    "predictions": [...],
    "summary": {
      "totalPredictions": 24,
      "criticalRiskHours": 3,
      "averageConfidence": 0.85
    },
    "modelInfo": {
      "method": "Holt-Winters Exponential Smoothing",
      "dataPoints": 720,
      "historicalDays": 30
    }
  },
  "alertData": {
    "alerts": [...],
    "summary": {
      "totalAlerts": 5,
      "criticalCount": 2
    }
  }
}
```

#### GET `/api/success-tracking`
Returns first session success metrics and anomalies.

#### GET `/api/churn-prediction`
Returns customer churn predictions and risk factors.

#### GET `/api/campaign-recommendations`
Returns AI-generated campaign recommendations.

#### GET `/api/customers/export`
Exports customer data as CSV.

### Webhook Integration

#### POST `/api/webhooks/rails`
Receives events from external systems (e.g., Rails backend).

**Payload**:
```json
{
  "event": "session.completed",
  "data": {
    "sessionId": "sess_123",
    "rating": 5,
    "duration": 60,
    "tutorId": "tutor_456"
  }
}
```

## Development

### Running Tests

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

### Environment-Specific Builds

The app automatically adapts to environment:
- **Development**: Uses mock data if Firebase not configured
- **Production**: Requires Firebase credentials

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy:

```bash
vercel --prod
```

### Environment Variables in Vercel

Add all `.env.local` variables to Vercel's environment settings:
- Dashboard → Settings → Environment Variables

### Logs and Monitoring

View production logs:
```bash
vercel logs
```

Inspect deployment:
```bash
vercel inspect <deployment-url>
```

## Design System

PulseMax uses a custom design system inspired by Netflix's dark theme:

### Color Palette
- **Background**: `#141414` (Netflix black)
- **Foreground**: `#ffffff` (White)
- **Accent**: `#14b8a6` (Teal)
- **Card Background**: `#1f1f1f`
- **Border**: `#2a2a2a`

### Animations
- Drop-in staggered animations (11 levels)
- Card hover effects with elevation
- Loading states and skeletons
- Smooth transitions (200ms cubic-bezier)

### Typography
- Font: Roboto Mono (monospace for technical aesthetic)
- Weights: 400, 500, 600, 700

## Performance Optimizations

1. **Polling Strategy**: 5-second intervals instead of WebSockets (Vercel Free tier compatible)
2. **Mock Data**: Development mode doesn't require Firebase
3. **Lazy Loading**: Components load on-demand
4. **Memoization**: AnimatedCounter prevents unnecessary re-renders
5. **Code Splitting**: Automatic with Next.js App Router

## Error Handling

- **Sentry Integration**: Production error tracking
- **Graceful Fallbacks**: Mock data when Firebase unavailable
- **User Feedback**: Built-in feedback widget on all pages
- **Connection Status**: Visual indicators for live/disconnected states

## Security

- **Environment Variables**: Sensitive data never committed to repo
- **Firebase Rules**: Configured for read/write permissions
- **API Rate Limiting**: Upstash Redis prevents abuse
- **Authentication**: NextAuth ready for production auth

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

### Firebase Connection Issues
- Verify `.env.local` has correct Firebase credentials
- Check Firebase console for API key restrictions
- Enable Firestore in Firebase console

### Mock Data Not Updating
- Confirm `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local`
- Clear browser cache and reload
- Check console for errors

### Build Failures
- Delete `.next` folder and rebuild
- Clear `node_modules` and reinstall dependencies
- Verify Node.js version (20+)

## License

Proprietary - All rights reserved

## Support

For issues or questions, use the feedback widget in the app or contact support.

---

Built with Next.js, Firebase, and AI-powered analytics.
