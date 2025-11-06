# Nerdy Operations Dashboard - Product Requirements Document

**Project**: Intelligent Operations Dashboard  
**Goal**: Build a real-time command center that monitors marketplace health, predicts supply/demand imbalances, automatically adjusts tutor recruiting campaigns, and alerts operators to anomalies

**Sprint Duration**: 48 hours  
**Target**: Working prototype with production deployment path

---

## Executive Summary

Nerdy's marketplace operates at scale with 3,000+ daily sessions, complex supply/demand dynamics, and significant churn challenges. This dashboard will provide real-time visibility, predictive insights, and automated interventions to improve retention and operational efficiency.

**Core Value Proposition**: Transform reactive operations into proactive marketplace management through AI-powered insights and automation.

---

## Problem Statement

### Current Pain Points

1. **Visibility Gaps**
   - No unified view of marketplace health
   - Manual correlation of 50+ data streams
   - Delayed detection of supply/demand imbalances
   - Reactive rather than proactive problem-solving

2. **Retention Challenges**
   - 52% churn when students complete goals (no cross-sell)
   - 24% of churners have poor first session experiences
   - 98.2% of reschedules are tutor-initiated
   - ≥2 IB calls in 14 days = high churn risk

3. **Operational Inefficiencies**
   - Manual tutor recruiting adjustments
   - Delayed anomaly detection
   - No early warning system for at-risk customers
   - Disconnected data sources requiring manual analysis

### Business Impact

- Lost revenue from preventable churn
- Inefficient tutor recruiting spend
- Reactive firefighting vs. strategic optimization
- Operator burnout from manual monitoring

---

## User Stories

### Primary User: Operations Manager

- As an operations manager, I want to **see real-time marketplace health metrics** so that I can identify problems before they impact customers
- As an operations manager, I want to **receive alerts for supply/demand imbalances** so that I can adjust recruiting campaigns proactively
- As an operations manager, I want to **view customer health scores** so that I can prioritize retention interventions
- As an operations manager, I want to **see explainable AI predictions** so that I can trust and act on recommendations
- As an operations manager, I want to **track first session success rates by tutor** so that I can improve matching quality
- As an operations manager, I want to **identify at-risk customers automatically** so that I can intervene before they churn

### Secondary User: Customer Success Team

- As a CS agent, I want to **see which customers need immediate attention** so that I can prioritize outreach
- As a CS agent, I want to **understand why a customer is flagged as at-risk** so that I can have informed conversations
- As a CS agent, I want to **track IB call frequency by customer** so that I can identify struggling accounts
- As a CS agent, I want to **see session velocity trends** so that I can re-engage inactive customers

### Tertiary User: Recruiting Team

- As a recruiter, I want to **see demand predictions by subject/time** so that I can target recruiting efforts
- As a recruiter, I want to **receive automated campaign adjustment recommendations** so that I can optimize spend
- As a recruiter, I want to **track tutor supply vs. demand in real-time** so that I can prevent shortages

---

## Key Features for 48-Hour MVP

### 1. Real-Time Marketplace Health Dashboard

**Must Have:**

- **Key Metrics Display**
  - Active sessions (current hour)
  - Daily session volume vs. target
  - Average session rating (rolling 7-day)
  - Tutor utilization rate
  - Customer satisfaction score
  - Supply/demand balance indicator

- **Visual Components**
  - Large metric cards with trend indicators (↑↓)
  - Color-coded health status (green/yellow/red)
  - Sparkline charts for 7-day trends
  - Auto-refresh every 30 seconds

**Success Criteria:**
- Dashboard loads in <2 seconds
- Data updates within 30 seconds of source changes
- Metrics are accurate within 5% margin
- Responsive design (desktop primary, mobile friendly)

### 2. Customer Health Scoring System

**Must Have:**

- **Risk Score Calculation** (0-100 scale)
  - First session success rate weight: 30%
  - Session velocity weight: 25%
  - IB call frequency weight: 20%
  - Goal completion status weight: 15%
  - Tutor consistency weight: 10%

- **Risk Tiers**
  - Critical (0-40): Immediate intervention needed
  - At Risk (41-70): Proactive outreach recommended
  - Healthy (71-85): Standard monitoring
  - Thriving (86-100): Cross-sell opportunity

- **Alert Triggers**
  - ≥2 IB calls in 14 days → Critical alert
  - First session rating <3 stars → At-risk flag
  - No session in 14 days (after 3+ sessions) → Re-engagement alert
  - Goal completed → Cross-sell opportunity

**Display Requirements:**
- Sortable customer list by risk score
- Drill-down to customer detail view
- Export capability (CSV)
- Filter by segment, subject, tutor

**Success Criteria:**
- Risk scores update every 15 minutes
- Alert notifications delivered within 5 minutes
- Accurately identify 80%+ of customers who churn in next 30 days
- False positive rate <30%

### 3. First Session Success Tracking

**Must Have:**

- **Metrics by Dimension**
  - Success rate by tutor (% rated ≥4 stars)
  - Success rate by subject
  - Success rate by customer segment
  - Average first session rating
  - First session completion rate

- **Tutor Performance Dashboard**
  - Sortable table of all tutors
  - Columns: Name, First Session Count, Success Rate, Avg Rating, Trend
  - Flag tutors with <70% success rate (red)
  - Highlight top performers (green)

- **Anomaly Detection**
  - Alert when tutor success rate drops >20% week-over-week
  - Flag subjects with <60% first session success
  - Identify geographic patterns in low success rates

**Success Criteria:**
- Track 100% of first sessions
- Data available within 1 hour of session completion
- Accurate attribution of tutors to sessions
- Historical comparison (week/month/quarter)

### 4. Session Velocity Monitoring

**Must Have:**

- **Velocity Metrics by Cohort**
  - Sessions per week by signup date cohort
  - Time to 2nd session (days)
  - Time to 3rd session (days)
  - Churn rate by velocity segment

- **Visualizations**
  - Cohort retention curves
  - Session frequency histogram
  - Velocity trend over time
  - Comparison to benchmarks

- **Alerts**
  - <3 sessions by Day 7 → Nudge recommendation
  - Decreasing velocity (from 2x/week to 1x/week) → Re-engagement
  - 21+ days since last session → At-risk flag

**Success Criteria:**
- Cohort analysis updates daily
- Velocity alerts trigger within 24 hours
- Segment customers into velocity tiers accurately
- Track impact of velocity on retention

### 5. Supply vs. Demand Predictions

**Must Have:**

- **Demand Forecasting**
  - Predicted session volume by hour (next 7 days)
  - Breakdown by subject area
  - Confidence intervals displayed
  - Historical accuracy tracking

- **Supply Tracking**
  - Available tutor hours by subject (next 7 days)
  - Tutor utilization rate
  - Subject-specific shortages/surpluses
  - Geographic distribution

- **Imbalance Alerts**
  - Subject with <80% coverage → Recruiting alert (12-hour lead time)
  - Time slot with predicted shortage → Capacity warning
  - Surplus capacity → Campaign adjustment recommendation

**ML Model Requirements:**
- Train on 90 days of historical data
- Features: day of week, time, subject, seasonality, trends
- Target: sessions booked per hour
- Update model weekly
- Accuracy target: MAPE <20%

**Success Criteria:**
- Predictions available 7 days in advance
- Alert operators 12+ hours before shortages
- Reduce emergency recruiting by 40%
- Maintain <10% unmet demand rate

### 6. Automated Campaign Recommendations

**Must Have:**

- **Recommendation Engine**
  - Suggest budget increase/decrease by subject
  - Recommend priority subjects for recruiting
  - Propose campaign pause for surplus capacity
  - Calculate expected ROI for changes

- **Display Format**
  - Card-based recommendation feed
  - Each card shows: Action, Reason, Expected Impact, Priority
  - One-click "Implement" or "Dismiss" actions
  - Track recommendation acceptance rate

- **Rule-Based Logic (MVP)**
  - IF demand > supply by 20% → Increase recruiting budget 15%
  - IF surplus > 30% → Reduce recruiting spend 20%
  - IF subject demand growing >30% week-over-week → Flag as priority
  - IF first session success <60% → Pause new tutor onboarding for review

**Success Criteria:**
- Generate 5-10 recommendations daily
- 60%+ acceptance rate by operators
- Recommendations show measurable impact within 2 weeks
- All recommendations have clear explanation

### 7. Anomaly Detection & Alerting

**Must Have:**

- **Monitored Metrics** (50+ data streams)
  - Session booking rate (% change hour-over-hour)
  - Cancellation rate spike
  - Average session rating drop
  - Tutor no-show rate increase
  - Customer support ticket volume
  - Website/app error rates

- **Detection Methods**
  - Statistical outliers (>2 standard deviations)
  - Week-over-week comparison (>20% change)
  - Sequential patterns (3 consecutive drops)
  - Configurable thresholds by metric

- **Alert Delivery**
  - In-dashboard notification banner (red/orange)
  - Email digest (critical alerts immediately, summary hourly)
  - Slack integration (optional, configurable)
  - SMS for critical issues (optional)

- **Alert Content**
  - Metric name and current value
  - Expected value/range
  - Time detected
  - Suggested investigation steps
  - Link to relevant dashboard view

**Success Criteria:**
- Detect anomalies within 5 minutes of occurrence
- False positive rate <20%
- 100% of critical issues flagged
- Alerts include actionable context

### 8. Churn Prediction Dashboard

**Must Have:**

- **Customer Segment Views**
  - Churn risk by acquisition channel
  - Churn risk by subject area
  - Churn risk by tutor consistency
  - Churn risk by session velocity

- **Visualizations**
  - Risk distribution histogram
  - Funnel chart showing churn points
  - Trend over time (improving/worsening)
  - Segment comparison

- **Risk Factor Breakdown**
  - For each at-risk customer, show:
    - Primary risk factors (weighted)
    - Recent behavioral changes
    - Recommended intervention
    - Contact history

**ML Model Requirements:**
- Binary classification (churn in 30 days: yes/no)
- Features: session frequency, ratings, IB calls, goal status, tenure
- Train on 6 months of data
- Target: 80% recall, 70% precision
- Update weekly

**Success Criteria:**
- Predict 80%+ of customers who will churn
- Provide explanations for all predictions
- Segment-level insights actionable
- Track intervention effectiveness

---

## Data Sources & Integration

### Required Data Streams (Phase 1: MVP)

1. **Session Data**
   - Source: Rails DB (sessions table)
   - Fields: session_id, customer_id, tutor_id, subject, start_time, end_time, rating, status
   - Update frequency: Real-time (webhooks) or 5-minute polling
   - Volume: ~3,000 records/day

2. **Customer Data**
   - Source: Rails DB (customers table)
   - Fields: customer_id, signup_date, acquisition_channel, goals, status
   - Update frequency: 1-hour polling
   - Volume: ~50,000 active customers

3. **Tutor Data**
   - Source: Rails DB (tutors table)
   - Fields: tutor_id, subjects, availability, status, rating_avg
   - Update frequency: 1-hour polling
   - Volume: ~5,000 active tutors

4. **Inbound Call Data**
   - Source: Customer support system API
   - Fields: customer_id, call_date, duration, reason_code
   - Update frequency: 15-minute polling
   - Volume: ~500 calls/day

5. **Booking Data**
   - Source: Rails DB (bookings table)
   - Fields: booking_id, customer_id, tutor_id, subject, scheduled_time, status
   - Update frequency: Real-time (webhooks) or 5-minute polling
   - Volume: ~4,000 bookings/day (includes future sessions)

### Data Flow Architecture

Data flows from the Rails PostgreSQL database through a polling or webhook-based ingestion service. The ingestion service transforms and validates data before storing it in TimescaleDB for time-series analysis. A Redis cache layer with fifteen-minute time-to-live reduces database load for frequently accessed data. The Next.js backend queries both the cache and database to serve API requests. Real-time updates push to the React dashboard via Server-Sent Events or WebSockets.

### ML Model Pipeline

Historical data from TimescaleDB feeds into a Python-based machine learning service for feature engineering. The ML service trains models and performs inference, storing predictions in PostgreSQL. The dashboard backend queries these predictions through API endpoints and presents them in the dashboard UI with explanations and confidence scores.

---

## Technical Architecture (MVP)

### Frontend Stack

**Framework**: Next.js 14 (App Router) + React 18  
**UI Library**: Tailwind CSS + shadcn/ui  
**Charts**: Recharts  
**Real-time**: Server-Sent Events (SSE)  
**State Management**: Zustand + React Query  

**Component Structure**:

The application organizes into distinct route-based pages including a main dashboard view, customer health list with individual detail pages, tutor performance tracking, supply-demand forecast visualization, and an alert center. API routes handle health checks, customer data queries, prediction retrieval, and real-time event streaming. Reusable components include metric cards, alert banners, customer tables, risk score displays, and forecast charts.

### Backend Stack

**API**: Next.js API Routes (serverless)  
**Database**: PostgreSQL (Supabase or Neon)  
**Time-Series**: TimescaleDB extension  
**Cache**: Redis (Upstash)  
**Queue**: BullMQ (Redis-backed)  
**Auth**: NextAuth.js  

**Services Architecture**:

The backend organizes services into three main categories. Ingestion services handle polling the Rails API for session data, customer information, and call logs. Processing services calculate customer risk scores, detect anomalies in metrics, and generate demand forecasts. Notification services manage alert creation and delivery through email and other channels.

### ML/AI Stack (Phase 1: Simple Models)

**Approach**: Start with rule-based, add ML iteratively  
**Phase 1 (Hours 0-24)**: Rule-based logic only  
**Phase 2 (Hours 24-36)**: Simple ML models (scikit-learn)  
**Phase 3 (Post-MVP)**: Advanced models (LightGBM, neural nets)  

**MVP Models**:
1. **Demand Forecasting**: ARIMA or Prophet (time-series)
2. **Churn Prediction**: Logistic Regression (binary classification)
3. **Anomaly Detection**: Z-score + moving averages (statistical)

**ML Service** (Optional for MVP):
- **Runtime**: Python FastAPI microservice
- **Deployment**: Docker container on Vercel or Fly.io
- **Training**: Scheduled weekly via cron job
- **Inference**: On-demand API calls from Next.js

### Deployment

**Hosting**: Vercel (Next.js app + API routes)  
**Database**: Supabase (PostgreSQL + real-time subscriptions)  
**Redis**: Upstash (serverless Redis)  
**ML Service**: Fly.io or Railway (Python container)  
**Monitoring**: Vercel Analytics + Sentry  

**Environment Configuration**:

The application requires environment variables for database connection strings, Redis URLs, Rails API endpoints and authentication keys, NextAuth secrets, and SMTP configuration for email alerts. All sensitive credentials should be stored securely and never committed to version control.

---

## Out of Scope for 48-Hour MVP

### Features NOT Included

1. **Advanced ML Models**
   - Deep learning
   - Ensemble methods
   - Real-time model retraining
   - A/B testing framework

2. **Integrations**
   - Slack notifications (manual workaround: email)
   - SMS alerts
   - Salesforce sync
   - Zapier webhooks

3. **Advanced Analytics**
   - Cohort analysis beyond basic retention
   - Multi-touch attribution
   - Funnel analysis
   - Custom report builder

4. **Automation**
   - Automatic campaign budget adjustments (show recommendations only)
   - Auto-email to at-risk customers
   - Auto-assignment of intervention tasks

5. **User Management**
   - Role-based access control (all users see all data in MVP)
   - Audit logs
   - User activity tracking

6. **Mobile Apps**
   - Native iOS/Android
   - Progressive Web App optimizations

### Technical Items NOT Included

1. Comprehensive test suite (focus on critical paths only)
2. Load testing (assume <50 concurrent users)
3. Data warehouse integration
4. Historical data backfill >90 days
5. Multi-region deployment
6. Advanced caching strategies
7. GraphQL API (use REST)

---

## Success Metrics for 48-Hour Checkpoint

### Functional Requirements

- [ ] Dashboard displays 6+ key marketplace metrics with real-time updates
- [ ] Customer health scores calculate correctly for all customers
- [ ] At-risk customer alerts trigger within specified timeframes
- [ ] First session success rates display by tutor with sorting
- [ ] Supply vs. demand forecast shows 7-day predictions
- [ ] Anomaly detection identifies outliers in test data
- [ ] At least 3 automated recommendations generated from rules

### Technical Requirements

- [ ] Dashboard loads in <3 seconds
- [ ] Data updates every 30 seconds without page refresh
- [ ] System handles 50+ concurrent metrics without slowdown
- [ ] API response times <500ms for most endpoints
- [ ] No critical errors in production logs
- [ ] Deployed to public URL with authentication

### Business Value Demonstration

- [ ] Demo shows identifying at-risk customer and suggested intervention
- [ ] Demo shows supply/demand imbalance detection 12 hours in advance
- [ ] Demo shows alert for tutor with declining first session performance
- [ ] Demo shows recommendation with clear explanation and ROI projection
- [ ] Cost analysis shows <$200/month for MVP deployment

---

## MVP Testing Checklist

### Core Dashboard Functionality

- [ ] All metric cards display current values
- [ ] Trend indicators (↑↓) update correctly
- [ ] Color coding (red/yellow/green) matches thresholds
- [ ] Auto-refresh works every 30 seconds
- [ ] Manual refresh button works
- [ ] Dashboard loads with sample data if no real data available

### Customer Health System

- [ ] Risk scores calculate for all test customers
- [ ] Customers sort by risk score correctly
- [ ] At-risk customers show in separate view
- [ ] Drill-down shows customer detail with history
- [ ] Alert triggers fire for test scenarios:
  - [ ] 2+ IB calls in 14 days
  - [ ] First session rating <3 stars
  - [ ] No session in 14 days (after 3+ sessions)
  - [ ] Goal completed

### First Session Tracking

- [ ] Tutor performance table displays all tutors
- [ ] Success rate calculations are accurate
- [ ] Sorting by success rate works
- [ ] Color coding flags low performers (<70%)
- [ ] Filters by subject work correctly

### Supply/Demand Forecasting

- [ ] 7-day forecast displays for each subject
- [ ] Confidence intervals shown
- [ ] Shortage alerts trigger when supply <80% of demand
- [ ] Forecast accuracy metrics display
- [ ] Historical comparison available

### Alert System

- [ ] Alerts appear in dashboard notification banner
- [ ] Critical alerts highlighted in red
- [ ] Alert detail shows context and suggested actions
- [ ] Alert history viewable
- [ ] Email digest sent (test with real email)

### Recommendations Engine

- [ ] Recommendations display in feed format
- [ ] Each recommendation shows reason and expected impact
- [ ] Priority sorting works
- [ ] Dismissing recommendations works
- [ ] Acceptance tracking updates

### Performance & Reliability

- [ ] Dashboard loads in <3 seconds with 100 customers
- [ ] No visual lag during real-time updates
- [ ] Error states handled gracefully (no crashes)
- [ ] Authentication works correctly
- [ ] System recovers from temporary data source failures

---

## Risk Mitigation

**Biggest Risk**: Integration with Rails API takes longer than expected  
**Mitigation**: Use mock data generator for first 24 hours; parallel track integration; create adapter layer for easy switching between mock and real data

**Second Risk**: ML models don't perform well enough in 48 hours  
**Mitigation**: Start with rule-based logic that provides value immediately; ML models are enhancement, not requirement; focus on simple models (linear/logistic regression)

**Third Risk**: Real-time updates cause performance issues  
**Mitigation**: Use SSE instead of WebSockets; implement aggressive caching; limit update frequency to 30s; use Redis for real-time state

**Fourth Risk**: Scope creep during development  
**Mitigation**: Strict prioritization in tasks.md; "must have" vs. "nice to have" clearly marked; timebox each feature to 2-4 hours max; defer anything not critical to post-MVP

**Fifth Risk**: Deployment complexity  
**Mitigation**: Use Vercel for one-click deployment; Supabase for managed DB; minimize infrastructure; Docker container for ML service only if time permits

---

## Post-MVP Roadmap (90 Days)

### Week 1-2: Production Hardening
- Comprehensive test suite
- Load testing with production volumes
- Security audit and hardening
- Role-based access control
- Error monitoring and logging

### Week 3-4: Enhanced ML Models
- Upgrade demand forecasting to LightGBM
- Implement advanced churn prediction (ensemble methods)
- Add customer lifetime value (CLV) prediction
- Model performance dashboards

### Week 5-6: Automation & Integrations
- Auto-adjust recruiting campaigns (within budget limits)
- Slack notifications
- Salesforce sync for at-risk customers
- Email automation for customer re-engagement

### Week 7-8: Advanced Analytics
- Full cohort analysis tool
- Custom report builder
- Multi-touch attribution
- Funnel analysis with drop-off insights

### Week 9-10: Mobile Experience
- Progressive Web App optimizations
- Mobile-specific alert views
- Native app (if needed)

### Week 11-12: Scale & Optimization
- Multi-region deployment
- Advanced caching strategies
- GraphQL API for flexible queries
- Data warehouse integration for historical analysis

---

## Cost Analysis (Production Deployment)

### Monthly Recurring Costs (Estimated)

**Infrastructure**:
- Vercel Pro: $20/month (serverless functions, hosting)
- Supabase Pro: $25/month (2GB database, real-time subscriptions)
- Upstash Redis: $10/month (1GB cache)
- Fly.io (ML service): $15/month (shared CPU, 512MB RAM)
- **Subtotal**: $70/month

**Third-Party Services**:
- SendGrid (email alerts): $15/month (40k emails)
- Sentry (error monitoring): $26/month (100k events)
- **Subtotal**: $41/month

**Data Transfer**:
- API calls to Rails: <$5/month (internal network)
- Vercel bandwidth: Included in Pro plan
- **Subtotal**: $5/month

**Total MVP Cost**: ~$116/month (~$1,400/year)

### One-Time Costs

- Development time: 48 hours (sprint)
- Code review and testing: 8 hours
- Deployment and configuration: 4 hours
- **Total setup time**: ~60 hours

### Scaling Costs (1,000 daily active users)

- Vercel Pro → Enterprise: +$100/month (higher limits)
- Supabase Pro → Team: +$50/month (10GB database)
- Upstash Pro: +$30/month (5GB cache)
- Fly.io: +$30/month (2 instances, auto-scaling)
- **Total at scale**: ~$350/month

### ROI Projection (90 Days)

**Assumptions**:
- Average customer LTV: $2,000
- Current monthly churn: 15% of 10,000 active customers = 1,500 customers
- Monthly churn revenue loss: $3,000,000

**Conservative Impact** (5% churn reduction):
- Retained customers per month: 75
- Monthly revenue saved: $150,000
- 90-day revenue saved: $450,000

**Optimistic Impact** (15% churn reduction):
- Retained customers per month: 225
- Monthly revenue saved: $450,000
- 90-day revenue saved: $1,350,000

**Break-Even Analysis**:
- MVP cost: ~$1,400/year infrastructure + ~$50,000 development (1 engineer @ 60 hours)
- Need to retain: **26 customers/year** to break even
- Expected retention improvement: **75-225 customers/month**

**ROI**: 9x - 27x (90 days) | 35x - 105x (annualized)

---

## Known Limitations & Trade-offs

### MVP Limitations

1. **Single Global View**: No per-region or per-subject drill-down dashboards (all users see same data)
2. **Simple ML Models**: Rule-based logic with basic statistical models (not deep learning)
3. **Manual Interventions**: Recommendations shown but not auto-executed (requires operator approval)
4. **Limited Historical Data**: 90-day lookback only (not full data warehouse)
5. **No Real-Time Model Training**: Models update weekly via batch job (not online learning)
6. **Desktop Optimized**: Mobile experience functional but not optimized
7. **Email Alerts Only**: No SMS, Slack, or push notifications in MVP
8. **Shared Database**: Uses existing Rails DB (not dedicated data warehouse)

### Technical Trade-offs

1. **Polling vs. Webhooks**: Using 5-minute polling for MVP (easier to implement); webhooks in Phase 2
2. **SSE vs. WebSockets**: Server-Sent Events for simpler implementation; WebSockets if needed later
3. **Next.js API Routes vs. Separate Backend**: Keeping backend with frontend for speed; can separate later
4. **Redis vs. Database for Real-Time State**: Using Redis for <15min TTL; PostgreSQL for persistent data
5. **Rule-Based vs. ML**: Starting with rules to ship fast; ML models added iteratively
6. **Managed Services vs. Self-Hosted**: Using Vercel, Supabase, Upstash to minimize ops; can migrate if needed

### Operational Considerations

1. **Data Freshness**: 5-minute lag for most metrics (not truly real-time)
2. **False Positives**: Expect 20-30% false positive rate in alerts (tune over time)
3. **Model Accuracy**: Initial ML models may have 60-70% accuracy (improve with more data)
4. **Manual Review Required**: All recommendations should be reviewed by operator before implementation
5. **Monitoring Required**: Someone needs to check dashboard daily for critical alerts
6. **Maintenance**: Models need retraining weekly; system needs monitoring and updates

---

## Appendix A: Data Schema

### Customer Health Score Table

This table stores calculated risk scores for each customer with timestamps. It includes an overall risk score from zero to one hundred, a risk tier classification (critical, at-risk, healthy, or thriving), and component scores for first session performance, session velocity, inbound call frequency, goal completion status, and tutor consistency. Boolean flags indicate specific risk factors like multiple inbound calls, low first session ratings, low velocity, or completed goals. The table also stores suggested interventions, priority levels, and metadata including creation timestamps. Indexes optimize queries by customer ID, risk tier, and calculation time.

### Tutor Performance Table

This table tracks tutor performance metrics over time. It records first session statistics including total count, success count, and success rate percentage. Overall metrics include total sessions, average rating, and total hours taught. Week-over-week trends track changes in success rate and ratings. Boolean flags identify underperforming tutors or those needing coaching. Indexes enable fast queries by tutor ID, calculation time, and success rate for performance analysis.

### Supply Demand Forecast Table

This table stores hourly demand forecasts by subject area. Each forecast includes predicted session count with confidence intervals (ninety-five percent lower and upper bounds). Supply data captures available tutors and hours. The supply-demand ratio calculation identifies shortages or surpluses. Metadata tracks when forecasts were generated and which model version produced them. Unique constraints prevent duplicate forecasts for the same subject and hour.

### Alerts Table

The alerts table manages all system-generated notifications. Alert types include customer risk, tutor performance, supply-demand imbalances, and anomalies. Severity levels range from critical to warning to informational. Each alert contains a title, detailed message, and suggested action. Foreign keys link alerts to relevant customers, tutors, or subjects. Status tracking records whether alerts are active, acknowledged, resolved, or dismissed, along with timestamps and responsible users. Indexes optimize filtering by status, type, severity, and creation date.

### Recommendations Table

This table stores automated recommendations generated by the system. Recommendation types include recruiting budget adjustments, campaign priority changes, and capacity modifications. Each recommendation describes the suggested action, reasoning, expected impact, and priority level from one (highest) to five (lowest). Related data includes subject areas, estimated return on investment, and confidence scores. Status tracking shows whether recommendations are pending, accepted, or dismissed, along with review timestamps and responsible users. Recommendations can have expiration dates for time-sensitive suggestions.

---

## Appendix B: AI Tools & Prompting Strategy

### AI Tools Used (48-Hour Sprint)

**Hours 0-24 (AI-Only Development)**:
1. **Claude 3.5 Sonnet** (primary coding assistant)
   - Code generation for all components
   - Database schema design
   - API route implementation
   - Test case generation

2. **GitHub Copilot** (supplementary)
   - Autocomplete for repetitive code
   - React component boilerplate
   - TypeScript type definitions

3. **ChatGPT-4** (architecture decisions)
   - High-level system design
   - Technology stack recommendations
   - Trade-off analysis

**Hours 24-36 (Mixed Approach)**:
- Continue with Claude for new features
- Manual debugging of complex issues
- Code review and refactoring

**Hours 36-48 (Production Hardening)**:
- Manual security review
- Performance optimization
- Documentation writing

### Effective Prompting Patterns

**Pattern 1: Specification-Driven Development**

Provide detailed specifications including all requirements, expected input/output schemas, error handling needs, type safety requirements, caching strategies, and performance constraints. This ensures the AI generates production-ready code that meets all requirements in a single iteration.

**Pattern 2: Incremental Feature Building**

Describe the current state of the codebase, clearly define the next task to complete, specify exact requirements with acceptance criteria, and note any constraints around performance or compatibility. This approach builds features step-by-step while maintaining context.

**Pattern 3: Context-Aware Debugging**

When encountering issues, provide the exact error message, relevant code context, attempted solutions, and ask for both diagnosis and fix. This helps the AI understand the full situation and provide accurate solutions rather than generic advice.