# Nerdy Operations Dashboard - Architecture Document

## Executive Summary

The Intelligent Operations Dashboard is a real-time monitoring and prediction system designed to transform Nerdy's reactive operations into proactive marketplace management. Built using Next.js, PostgreSQL with TimescaleDB, Redis, and Python-based machine learning services, the system processes fifty plus data streams to provide actionable insights for operations managers, customer success teams, and recruiting coordinators.

**Architecture Philosophy**: Prioritize speed of development and deployment using managed services while maintaining flexibility for future optimization. Start simple with rule-based logic, add machine learning incrementally, and design for horizontal scalability from day one.

---

## System Overview

### High-Level Architecture

The system consists of five main layers:

**1. Data Sources Layer**
- Rails PostgreSQL database (existing system)
- Customer support system API
- External data sources (optional: weather, school calendars)

**2. Ingestion & Processing Layer**
- Polling services for external APIs
- Data transformation and validation
- Background job queue for scheduled tasks

**3. Storage Layer**
- PostgreSQL with TimescaleDB for time-series data
- Redis for caching and real-time state
- File storage for trained ML models

**4. Application Layer**
- Next.js frontend and API routes
- Machine learning inference service
- Real-time update service

**5. Presentation Layer**
- React-based dashboard UI
- Server-Sent Events for real-time updates
- Email notification system

---

## Detailed Component Architecture

### Frontend Architecture

#### Technology Stack

**Framework**: Next.js 14 with App Router and React 18

**Why Next.js**:
- Server-side rendering for fast initial loads
- API routes eliminate need for separate backend
- Built-in optimization (image optimization, code splitting)
- Excellent developer experience with hot reload
- Easy deployment to Vercel

**UI Components**: shadcn/ui (Radix UI primitives with Tailwind)

**Why shadcn/ui**:
- Copy-paste components (no package lock-in)
- Fully customizable with Tailwind
- Accessible by default (ARIA compliant)
- TypeScript support out of the box
- Active development and community

**State Management**:
- **Zustand** for global client state (simple, minimal boilerplate)
- **React Query** for server state (automatic caching, refetching)
- **React Context** for theme and auth state (native, no dependencies)

**Data Fetching**: React Query with Server-Sent Events

**Why This Combination**:
- React Query handles caching and background refetching automatically
- Server-Sent Events provide real-time updates with simpler implementation than WebSockets
- Combines pull (query) and push (SSE) patterns effectively
- Built-in error handling and retry logic

**Charts & Visualization**: Recharts

**Why Recharts**:
- Pure React implementation (no D3 complexity)
- Responsive by default
- Composable chart components
- Good performance with thousands of data points
- TypeScript support

#### Component Hierarchy

**App Shell**:
- Root layout provides authentication wrapper
- Navigation sidebar with route highlighting
- Header with user profile and notifications
- Main content area for route-specific views

**Page Components** (Route-Based):
- Dashboard overview (main metrics)
- Customer health list and detail views
- Tutor performance list and detail views
- Supply-demand forecast visualization
- Alert center with filtering
- Settings and user management

**Feature Components** (Reusable):
- MetricCard: displays single metric with trend
- AlertBanner: shows critical alerts at top
- DataTable: sortable, filterable table with pagination
- RiskScoreBadge: displays customer risk with color coding
- ForecastChart: line chart with confidence intervals
- RecommendationCard: shows AI-generated suggestions

**Utility Components**:
- LoadingSpinner: consistent loading states
- ErrorBoundary: catches rendering errors
- EmptyState: handles no data scenarios
- ConfirmDialog: confirms destructive actions
- Toast: shows success/error messages

#### State Management Patterns

**Server State** (React Query):
- All API data cached with stale-while-revalidate
- Background refetching every thirty seconds for dashboard metrics
- Infinite queries for paginated tables
- Optimistic updates for user actions
- Query invalidation on mutations

**Client State** (Zustand):
- Selected filters and sort preferences
- UI state (sidebar collapsed, theme)
- Transient form state
- Real-time connection status

**URL State**:
- Current page and filters in query params
- Enables deep linking and browser back/forward
- Syncs with client state via custom hook

#### Performance Optimizations

**Code Splitting**:
- Route-based splitting (automatic with Next.js)
- Dynamic imports for heavy components (charts, tables)
- Lazy load modal and drawer components

**Bundle Size**:
- Tree shaking enabled for all libraries
- Remove unused CSS with PurgeCSS
- Minimize dependencies (prefer native alternatives)
- Target: under 300KB initial bundle (gzipped)

**Rendering Optimization**:
- React.memo for expensive components
- useMemo for expensive calculations
- useCallback for stable function references
- Virtualization for long lists (react-virtual)

**Data Loading**:
- Skeleton loaders for perceived performance
- Progressive loading (critical data first)
- Prefetch on hover for predictable navigation
- Image optimization with Next.js Image component

---

### Backend Architecture

#### Technology Stack

**Runtime**: Node.js with Next.js API Routes

**Why Next.js API Routes**:
- Colocated with frontend code (simpler development)
- Serverless by default (scales automatically)
- Built-in request/response helpers
- TypeScript support
- Easy CORS and middleware configuration

**Database**: PostgreSQL 15 with TimescaleDB extension

**Why PostgreSQL + TimescaleDB**:
- PostgreSQL: robust, ACID compliant, excellent JSON support
- TimescaleDB: optimized for time-series queries (sessions over time)
- Automatic data retention policies
- Continuous aggregates for fast rollups
- Familiar SQL interface

**Cache**: Redis 7 (Upstash for serverless)

**Why Redis**:
- Sub-millisecond latency for reads
- Automatic expiration with TTL
- Pub/sub for real-time updates (if needed)
- Atomic operations for counters and flags
- Serverless pricing model (Upstash)

**Job Queue**: BullMQ (Redis-backed)

**Why BullMQ**:
- Redis-based (shares infrastructure)
- Reliable job processing with retries
- Scheduled and delayed jobs
- Job prioritization
- Built-in monitoring dashboard

#### API Design

**REST Principles**:
- Resource-based URLs: /api/customers, /api/tutors, /api/forecasts
- HTTP methods: GET (read), POST (create), PATCH (update), DELETE (remove)
- Standard status codes: 200 (success), 400 (client error), 500 (server error)
- JSON request/response bodies with consistent shape

**API Route Structure**:

**Health Endpoint** (/api/health):
- Returns system status and version
- Checks database and Redis connectivity
- Used by uptime monitoring

**Customer Endpoints**:
- GET /api/customers - list with filtering and pagination
- GET /api/customers/[id] - single customer detail
- GET /api/customers/[id]/health - risk score and components
- GET /api/customers/at-risk - shortcut for high-risk customers

**Tutor Endpoints**:
- GET /api/tutors - list with filtering
- GET /api/tutors/[id] - single tutor detail
- GET /api/tutors/[id]/performance - performance metrics over time
- GET /api/tutors/underperforming - tutors needing coaching

**Forecast Endpoints**:
- GET /api/forecasts - predictions for next seven days
- GET /api/forecasts/subject/[subject] - subject-specific forecast
- GET /api/forecasts/imbalances - current supply-demand gaps

**Alert Endpoints**:
- GET /api/alerts - list with filtering
- POST /api/alerts/[id]/acknowledge - mark alert as seen
- POST /api/alerts/[id]/resolve - mark alert as fixed
- POST /api/alerts/[id]/dismiss - dismiss alert

**Recommendation Endpoints**:
- GET /api/recommendations - active recommendations
- POST /api/recommendations/[id]/accept - accept recommendation
- POST /api/recommendations/[id]/dismiss - dismiss recommendation

**Real-Time Endpoint**:
- GET /api/sse - Server-Sent Events stream
- Pushes updates every thirty seconds
- Includes only changed data to minimize bandwidth

#### Caching Strategy

**Cache Layers**:

**Level 1: Application Cache** (in-memory)
- Next.js built-in data cache (server components)
- Short TTL (10 seconds) for frequently accessed data
- Automatic revalidation on updates

**Level 2: Redis Cache**
- API response caching (15-minute TTL)
- Computed aggregates (session counts, averages)
- Real-time state (cursor positions, active users)

**Level 3: Database Cache**
- PostgreSQL query result cache
- Materialized views for complex aggregations
- TimescaleDB continuous aggregates

**Cache Invalidation**:
- Time-based: TTL expires cache automatically
- Event-based: mutations trigger cache invalidation
- Manual: admin can clear cache on demand

**Cache Keys**:
- Consistent naming: entity:id:attribute
- Examples: customer:123:health, forecast:math:2024-01-15
- Include version in key for breaking changes

#### Background Jobs

**Job Types**:

**Polling Jobs** (high frequency):
- Session poller: every 5 minutes
- Inbound call poller: every 15 minutes
- Customer poller: every 60 minutes
- Tutor poller: every 60 minutes

**Processing Jobs** (medium frequency):
- Risk score calculator: every 15 minutes
- Performance metrics: every 60 minutes
- Alert checker: every 5 minutes

**ML Jobs** (low frequency):
- Forecast generation: daily at 2 AM
- Model training: weekly on Sunday
- Churn prediction: daily at 3 AM

**Job Reliability**:
- Automatic retries with exponential backoff
- Dead letter queue for repeated failures
- Timeout for long-running jobs (5 minute maximum)
- Idempotent job handlers (safe to retry)

---

### Data Architecture

#### Database Schema Design

**Design Principles**:
- Normalize to third normal form, denormalize for performance
- Use foreign keys for referential integrity
- Add indexes on frequently queried columns
- Use TimescaleDB hypertables for time-series data
- Store JSON for flexible, evolving data structures

**Core Tables**:

**Sessions Table** (hypertable, partitioned by time):
- Stores all historical session data
- Indexed on: customer_id, tutor_id, subject, start_time
- Compressed after 7 days for storage efficiency
- Retention policy: keep 90 days, drop older data

**Customers Table**:
- Stores customer profiles and goals
- Indexed on: signup_date, status, acquisition_channel
- Soft delete with deleted_at timestamp
- Includes JSONB column for flexible attributes

**Tutors Table**:
- Stores tutor profiles and subjects
- Indexed on: status, subjects (GIN index for arrays)
- Includes availability schedule (JSONB)
- Links to performance metrics table

**Inbound Calls Table** (hypertable):
- Stores customer support call records
- Indexed on: customer_id, call_date
- Includes reason code for categorization
- Retention policy: keep 180 days

**Customer Health Scores Table** (hypertable):
- Stores calculated risk scores over time
- Indexed on: customer_id, calculated_at, risk_tier
- Enables tracking score changes over time
- Most recent score per customer in separate view

**Tutor Performance Table** (hypertable):
- Stores tutor metrics over time
- Indexed on: tutor_id, calculated_at, success_rate
- Enables performance trend analysis
- Daily snapshots for efficiency

**Supply Demand Forecasts Table**:
- Stores predictions for future sessions
- Indexed on: subject, forecast_hour, forecasted_at
- Unique constraint on subject + forecast_hour + forecasted_at
- Cleanup job removes stale forecasts

**Alerts Table**:
- Stores all generated alerts
- Indexed on: status, type, severity, created_at
- Soft delete for historical analysis
- Includes relationships to customers, tutors, subjects

**Recommendations Table**:
- Stores AI-generated recommendations
- Indexed on: status, priority, created_at
- Includes expiration timestamp
- Tracks acceptance and effectiveness

**Users Table**:
- Stores dashboard user accounts
- Indexed on: email (unique)
- Includes role for authorization
- Password hashed with bcrypt

#### Data Flow Patterns

**Ingestion Flow**:
1. Background job polls external API
2. Transform data to internal schema
3. Validate with Zod schema
4. Insert into PostgreSQL
5. Invalidate relevant caches
6. Trigger downstream processing if needed

**Query Flow**:
1. API route receives request
2. Check Redis cache for result
3. If cache miss, query PostgreSQL
4. Transform result to API schema
5. Store in Redis with TTL
6. Return JSON response

**Update Flow**:
1. API route receives mutation request
2. Validate input with Zod schema
3. Update PostgreSQL in transaction
4. Invalidate relevant caches
5. Publish event for real-time updates
6. Return success response

**Real-Time Flow**:
1. Client connects to SSE endpoint
2. Server checks cache for latest data
3. Send initial data to client
4. Background job detects changes
5. Publish change event
6. Server sends update to connected clients

---

### Machine Learning Architecture

#### ML Service Design

**Deployment**: Separate Python service (optional for MVP)

**Why Separate Service**:
- Python ecosystem better for ML (scikit-learn, Prophet)
- Isolate compute-intensive work from API service
- Scale ML independently from web tier
- Easier to upgrade models without frontend deployment

**Communication**: REST API between Next.js and ML service

**Endpoints**:
- POST /predict/demand - generate demand forecast
- POST /predict/churn - predict customer churn
- GET /models/info - return active model versions
- POST /models/train - trigger model retraining

**Fallback Strategy**: If ML service unavailable, use rule-based logic

#### Demand Forecasting Model

**Model Type**: ARIMA or Prophet (time-series forecasting)

**Why ARIMA/Prophet**:
- Specifically designed for time-series data
- Automatically handles seasonality
- Provides confidence intervals
- Interpretable results
- Fast training and inference

**Features**:
- Historical session counts (90 days)
- Day of week (weekday vs weekend patterns)
- Hour of day (peak hours vs off-hours)
- Subject area (different demand patterns)
- Week of year (seasonality, school breaks)
- Holiday indicator (lower demand on holidays)

**Training**:
- Train separate model per subject
- Use 80/20 train/validation split
- Optimize on mean absolute percentage error
- Retrain weekly with latest data

**Inference**:
- Generate 7-day hourly forecast
- Calculate 95% confidence intervals
- Store predictions in database
- Serve via API to dashboard

**Monitoring**:
- Track prediction accuracy daily
- Compare forecast to actual sessions
- Alert if accuracy drops below threshold
- Retrain model if performance degrades

#### Churn Prediction Model

**Model Type**: Logistic Regression (binary classification)

**Why Logistic Regression**:
- Simple and interpretable (important for trust)
- Fast training and inference
- Provides probability scores
- Feature importance clearly defined
- Good baseline before complex models

**Features**:
- Session frequency (sessions per week)
- Session recency (days since last session)
- Average session rating (satisfaction indicator)
- Inbound call count (support issues indicator)
- Goal completion status (engagement indicator)
- Tutor consistency (switching indicates problems)
- Tenure (days since signup)
- Acquisition channel (different retention rates)

**Training**:
- Label: churned (no session in 60 days)
- Use 6 months of historical data
- Balance classes with SMOTE or class weights
- Optimize recall (catch most churners)
- 80/20 train/validation split

**Inference**:
- Generate churn probability for all active customers
- Threshold at 0.5 for binary prediction
- Store predictions in customer health table
- Update daily with latest features

**Explainability**:
- SHAP values for feature importance per customer
- Show top 3 risk factors in UI
- Explain why customer is at risk
- Suggest specific interventions based on factors

#### Model Lifecycle

**Development**:
1. Explore data in Jupyter notebook
2. Engineer features from raw data
3. Train candidate models
4. Evaluate on validation set
5. Select best performing model
6. Document approach and results

**Deployment**:
1. Export trained model (pickle or joblib)
2. Store model file in cloud storage
3. Load model in ML service
4. Expose prediction endpoint
5. Test with production data
6. Monitor inference latency

**Monitoring**:
1. Track prediction accuracy daily
2. Compare predictions to actual outcomes
3. Monitor feature distributions for drift
4. Alert on performance degradation
5. Track inference latency and errors

**Retraining**:
1. Schedule weekly retraining job
2. Fetch latest training data
3. Train new model with same pipeline
4. Evaluate on holdout set
5. Deploy if better than current model
6. Version models for rollback capability

---

### Real-Time Update Architecture

#### Server-Sent Events (SSE)

**Why SSE Over WebSockets**:
- Simpler implementation (HTTP-based)
- Automatic reconnection in browsers
- Works through most proxies and firewalls
- One-way server-to-client (sufficient for dashboard)
- Built-in event ID for resuming after disconnect
- Lower overhead for read-heavy workloads

**SSE Implementation**:

**Server Side** (Next.js API route):
1. Client connects to /api/sse endpoint
2. Server verifies authentication
3. Server creates event stream
4. Server sends initial data snapshot
5. Background job detects changes
6. Server publishes events to Redis pub/sub
7. SSE handler subscribes to Redis channel
8. Server streams events to connected clients
9. Server sends heartbeat every 30 seconds to keep connection alive

**Client Side** (React component):
1. Component creates EventSource connection
2. Register event listeners for different event types
3. Parse incoming JSON events
4. Update React Query cache with new data
5. React Query triggers component re-render
6. Handle connection errors and reconnection
7. Close connection on component unmount

**Event Types**:
- metric_update: new metric value (dashboard)
- alert_created: new alert generated
- alert_updated: alert status changed
- recommendation_created: new recommendation
- customer_health_updated: risk score changed
- forecast_updated: new predictions available

**Event Format**:

Each event includes:
- event: event type identifier
- data: JSON payload with changed data
- id: sequential event ID for resuming
- retry: reconnection delay in milliseconds

**Scalability Considerations**:

**Connection Limits**:
- Vercel serverless: 100 concurrent connections per instance
- Scale horizontally by adding more instances
- Use sticky sessions (not required with Redis pub/sub)

**Redis Pub/Sub**:
- Publish changes to Redis channel
- All SSE handlers subscribe to channel
- Distributed architecture (works across instances)
- No state stored on individual servers

**Fallback Strategy**:
- If SSE unavailable, fall back to polling every 30 seconds
- Client detects SSE failure automatically
- Graceful degradation of real-time features

---

### Authentication & Authorization

#### Authentication Strategy

**Auth Provider**: NextAuth.js

**Why NextAuth.js**:
- Built for Next.js (seamless integration)
- Supports multiple providers (email, Google, etc.)
- Secure by default (CSRF protection, HTTP-only cookies)
- Session management built-in
- TypeScript support

**Authentication Flow**:

1. User navigates to dashboard
2. Middleware checks for valid session
3. If no session, redirect to login page
4. User enters credentials or uses Google OAuth
5. NextAuth validates credentials
6. If valid, create session token
7. Store token in HTTP-only cookie
8. Redirect to dashboard
9. Middleware allows access

**Session Management**:
- JWT tokens for stateless sessions
- 7-day expiration with automatic refresh
- HTTP-only cookies prevent XSS attacks
- Secure flag in production (HTTPS only)
- SameSite attribute prevents CSRF

#### Authorization Strategy

**Role-Based Access Control**:

**Roles**:
- **Admin**: full access, can manage users
- **Operator**: read/write access, can acknowledge alerts
- **Viewer**: read-only access, no mutations

**Implementation**:
- Store role in user table
- Include role in JWT token
- Check role in API route middleware
- Protect UI elements based on role

**Authorization Flow**:

1. API route receives request
2. Extract session from cookie
3. Verify JWT signature
4. Check user role from token
5. Compare role to required permission
6. Allow or deny access
7. Return 403 if unauthorized

**Protected Resources**:
- Alert acknowledgment: Operator or Admin only
- User management: Admin only
- Data export: Operator or Admin only
- All read operations: All authenticated users

---

### Infrastructure & Deployment

#### Hosting Platform

**Frontend & API**: Vercel

**Why Vercel**:
- Built for Next.js (creators of framework)
- Automatic deployments from Git
- Global CDN for static assets
- Serverless functions scale automatically
- Preview deployments for PRs
- Easy custom domains and SSL
- Generous free tier

**Database**: Supabase or Neon

**Why Supabase/Neon**:
- Managed PostgreSQL (no ops overhead)
- Built-in connection pooling (serverless-friendly)
- Automatic backups
- Point-in-time recovery
- Global edge caching (Neon)
- Real-time subscriptions (Supabase)
- Free tier sufficient for MVP

**Cache**: Upstash Redis

**Why Upstash**:
- Serverless pricing model (pay per request)
- Global replication (low latency worldwide)
- REST API (works in serverless environment)
- No connection limits (HTTP-based)
- Free tier: 10,000 commands/day

**ML Service** (optional): Fly.io or Railway

**Why Fly.io/Railway**:
- Docker container deployment
- Global regions for low latency
- Automatic HTTPS
- Persistent volumes for model storage
- Pay for actual usage
- Easy scaling (horizontal and vertical)

#### Deployment Pipeline

**Development Workflow**:

1. Developer creates feature branch
2. Make changes and commit
3. Push branch to GitHub
4. GitHub Actions runs linter and tests
5. If passing, Vercel creates preview deployment
6. Review preview in PR
7. Merge to main after approval
8. Vercel deploys to production automatically
9. Monitor for errors in Sentry

**Environment Management**:

**Development**:
- Local development with npm run dev
- Docker Compose for local database and Redis
- Mock data generator for testing
- Hot reload for fast iteration

**Staging** (optional):
- Separate Vercel deployment
- Uses staging database
- Preview features before production
- Test with production-like data

**Production**:
- Main branch deploys automatically
- Environment variables in Vercel dashboard
- Production database and Redis
- Monitoring and alerting enabled

**Database Migrations**:

1. Create migration file with Prisma or SQL
2. Test migration on development database
3. Review migration in PR
4. Apply to staging database after merge
5. Verify application works in staging
6. Apply to production database
7. Monitor for errors

**Rollback Strategy**:

1. Detect production issue via monitoring
2. Revert deployment in Vercel dashboard (one click)
3. Investigate and fix issue in separate branch
4. Test fix thoroughly
5. Deploy fixed version
6. Monitor for resolution

---

### Monitoring & Observability

#### Logging Strategy

**Log Levels**:
- **ERROR**: application errors, exceptions, failures
- **WARN**: potential issues, degraded performance
- **INFO**: significant events, state changes
- **DEBUG**: detailed information for troubleshooting

**Structured Logging**:
- JSON format for machine parsing
- Include context: user ID, request ID, timestamp
- Use consistent field names across services
- Avoid logging sensitive data (passwords, tokens)

**Log Aggregation**:
- Use Vercel Logs for Next.js (built-in)
- Optional: Forward to Datadog or Logtail
- Retention: 7 days in Vercel, longer in external service
- Search and filter by fields

#### Error Tracking

**Service**: Sentry

**Why Sentry**:
- Automatic error capture
- Source map support (original line numbers)
- User context and breadcrumbs
- Performance monitoring
- Release tracking
- Slack and email notifications

**Error Monitoring**:
- Capture all unhandled exceptions
- Group similar errors automatically
- Track error frequency and users affected
- Alert on error spikes
- Include request context for debugging

#### Performance Monitoring

**Metrics to Track**:

**Application Metrics**:
- API response times (p50, p95, p99)
- Database query duration
- Cache hit/miss ratio
- Background job duration
- SSE connection count

**Business Metrics**:
- Active sessions count
- Customer health score distribution
- Alert generation rate
- Recommendation acceptance rate
- Forecast accuracy (MAPE)

**Infrastructure Metrics**:
- Serverless function invocations
- Database connection pool usage
- Redis memory usage
- Disk space (for ML service)
- Network bandwidth

**Dashboard**:
- Vercel Analytics for web vitals
- Database dashboard in Supabase/Neon
- Redis dashboard in Upstash
- Custom Grafana dashboards (if needed)

#### Alerting

**Alert Channels**:
- Email for critical issues
- Slack for team notifications (optional)
- PagerDuty for on-call rotation (optional)

**Alert Conditions**:

**Critical**:
- Database connection failure
- API error rate > 10%
- Alert generation service down
- ML service unavailable for > 1 hour

**Warning**:
- API response time p95 > 1 second
- Cache hit ratio < 50%
- Background job failure rate > 5%
- Forecast accuracy drops below 80%

**Info**:
- New deployment completed
- Model retraining finished
- Daily data ingestion summary

---

### Security Architecture

#### Threat Model

**Threats to Mitigate**:
- Unauthorized access to sensitive customer data
- SQL injection attacks on database
- Cross-site scripting (XSS) attacks
- Cross-site request forgery (CSRF)
- Brute force attacks on login
- Data exfiltration through APIs
- Denial of service attacks

**Defenses**:

**Authentication Security**:
- Passwords hashed with bcrypt (10 rounds)
- HTTP-only cookies prevent XSS theft
- CSRF tokens in all forms
- Rate limiting on login endpoint (10 attempts per hour)
- Account lockout after 5 failed attempts
- Password reset requires email verification

**API Security**:
- All routes require authentication
- Role-based authorization checks
- Input validation with Zod schemas
- SQL injection prevention (parameterized queries)
- XSS prevention (escape all outputs)
- CORS configured for dashboard domain only
- Rate limiting on expensive endpoints

**Data Security**:
- Encryption at rest (PostgreSQL)
- Encryption in transit (HTTPS, TLS 1.3)
- Row-level security (if using Supabase)
- Audit logs for sensitive operations
- Data retention policies
- Secure deletion (overwrite, not just unlink)

**Infrastructure Security**:
- Environment variables for secrets (not in code)
- Vercel serverless functions isolated per request
- Database firewall rules (allow Vercel IP ranges only)
- Redis requires authentication
- Regular dependency updates (Dependabot)
- Security headers (CSP, X-Frame-Options, etc.)

#### Compliance Considerations

**GDPR Compliance** (if serving EU users):
- User consent for data processing
- Right to access personal data
- Right to deletion (implement hard delete)
- Data portability (export functionality)
- Breach notification procedures

**FERPA Compliance** (education data):
- Parental consent for minor data
- Secure storage of education records
- Access logs for sensitive data
- Data sharing restrictions

**Best Practices**:
- Privacy policy clearly displayed
- Terms of service acceptance
- Data retention policy documented
- User data minimization
- Audit trail for compliance

---

### Disaster Recovery

#### Backup Strategy

**Database Backups**:
- Automated daily backups (Supabase/Neon)
- Point-in-time recovery (up to 7 days)
- Manual backups before major changes
- Test restore procedure monthly
- Store backups in separate region

**Application Backups**:
- Git repository (single source of truth)
- Environment variables documented
- Configuration as code
- ML models versioned and stored separately

**Recovery Time Objectives**:
- **RTO**: 1 hour to restore service
- **RPO**: Maximum 24 hours of data loss
- **RTO Critical**: 15 minutes for dashboard access

#### Failure Scenarios

**Database Failure**:
1. Supabase/Neon automatically fails over to replica
2. If complete failure, restore from backup
3. Redeploy application if needed
4. Verify data integrity
5. Communicate downtime to users

**Application Failure**:
1. Vercel automatically retries failed functions
2. If persistent, roll back to previous deployment
3. Investigate and fix issue
4. Deploy fix when ready
5. Monitor for recurrence

**Data Corruption**:
1. Identify affected tables and time range
2. Stop writes to affected tables
3. Restore affected data from backup
4. Verify data integrity
5. Resume normal operations
6. Post-mortem to prevent recurrence

**Cache Failure**:
1. Application continues with database queries (slower)
2. Investigate Redis issue
3. Restore Redis if needed
4. Repopulate cache
5. Monitor performance

---

### Performance Benchmarks

#### Target Metrics

**Dashboard Load Time**:
- First Contentful Paint: < 1 second
- Time to Interactive: < 3 seconds
- Fully Loaded: < 5 seconds

**API Response Times**:
- Simple queries (customer list): < 200ms
- Complex queries (forecast): < 500ms
- Mutations (alert acknowledge): < 300ms
- Real-time updates latency: < 30 seconds

**Database Queries**:
- Customer health score lookup: < 50ms
- Session aggregation: < 200ms
- Forecast generation: < 1 second
- Full table scan: < 5 seconds (should be avoided)

**Background Jobs**:
- Session polling: < 30 seconds
- Risk score calculation: < 5 minutes
- Daily forecast generation: < 10 minutes
- Model training: < 1 hour

#### Scalability Limits

**Current Architecture** (MVP):
- Concurrent users: 50
- Customers in database: 100,000
- Sessions per day: 3,000
- Alerts per day: 100
- API requests per minute: 1,000

**Scaling Plan**:

**10x Growth**:
- Add database read replicas
- Increase Redis cache size
- Enable CDN caching for static data
- Optimize expensive queries
- Add database indexes

**100x Growth**:
- Migrate to dedicated database instance
- Implement database sharding (by customer ID)
- Add load balancer for ML service
- Use message queue for background jobs
- Implement rate limiting per user

---

### Development Workflow

#### AI-Assisted Development

**Phase 1 (Hours 0-24): AI-Only**:

**Prompting Strategy**:
- Provide complete context: project goals, tech stack, constraints
- Request complete, working solutions (not pseudo-code)
- Specify exact requirements with acceptance criteria
- Include error handling in prompt
- Ask for TypeScript types
- Request basic tests

**Example Prompt Template**:

"Create a Next.js API route that fetches customer health scores from PostgreSQL. 

Requirements:
- Endpoint: GET /api/customers/health
- Query customers table joined with customer_health_scores
- Support filtering by risk_tier query parameter
- Return JSON array of customers with their latest risk score
- Include pagination (25 per page)
- Cache results in Redis for 15 minutes
- Handle errors gracefully with appropriate status codes
- Use TypeScript with proper types
- Include authentication check using NextAuth

Technical Context:
- Using Next.js 14 App Router
- PostgreSQL client: node-postgres
- Redis client: ioredis
- Auth: NextAuth.js

Return complete, working code ready to use."

**Phase 2 (Hours 24-36): Mixed Approach**:
- Use AI for new feature generation
- Manual debugging for complex integration issues
- Refactor AI-generated code for consistency
- Add comprehensive error handling manually
- Write integration tests manually

**Phase 3 (Hours 36-48): Manual with AI Assist**:
- Manual security review
- Performance profiling and optimization
- Documentation writing (with AI help for structure)
- Final testing and edge case handling
- Deployment preparation

#### Testing Strategy

**Test Pyramid**:

**Unit Tests** (60% of tests):
- Utility functions (helpers, formatters)
- Service functions (risk scoring, forecasting)
- Data transformations
- Fast, isolated, no external dependencies

**Integration Tests** (30% of tests):
- API routes with test database
- Database queries with test data
- Background jobs with mocked external APIs
- Auth flows with test users

**End-to-End Tests** (10% of tests):
- Critical user paths (login, view dashboard, acknowledge alert)
- Full stack with test environment
- Automated in CI/CD pipeline
- Run before production deployment

**Test Coverage Goals**:
- Overall: 70%+
- Critical paths: 90%+
- UI components: 50%+

---

### Cost Optimization

#### Cost Breakdown (Monthly)

**Vercel Pro**: $20
- Serverless functions
- Bandwidth
- Preview deployments

**Supabase Pro**: $25
- 8GB database
- 500GB bandwidth
- Daily backups

**Upstash Redis**: $10
- 1GB storage
- 1M commands/month

**Fly.io** (ML service): $15
- Shared CPU
- 512MB RAM
- 10GB disk

**SendGrid**: $15
- 40,000 emails/month

**Sentry**: $26
- 100K events/month
- Performance monitoring

**Total**: $111/month

#### Cost Optimization Strategies

**Immediate (MVP)**:
- Use free tiers where possible
- Aggressive caching reduces database queries
- Optimize images and bundle size
- Use serverless for variable load

**Short-term (1-3 months)**:
- Analyze query patterns, add indexes
- Compress old data in TimescaleDB
- Batch email notifications
- Implement data retention policies

**Long-term (6-12 months)**:
- Evaluate reserved capacity for predictable load
- Consider self-hosted options if scale justifies
- Implement tiered storage (hot/cold data)
- Negotiate volume discounts with providers

---

### Future Architecture Considerations

#### Microservices Migration (If Needed)

**When to Consider**:
- Team grows beyond 10 engineers
- Components need independent scaling
- Different technology requirements per service
- Clear service boundaries established

**Candidate Services**:
- Data ingestion service (Node.js)
- ML inference service (Python)
- Notification service (Node.js)
- Reporting service (Node.js)
- Auth service (Node.js)

**Benefits**:
- Independent deployments
- Technology flexibility
- Better fault isolation
- Team autonomy

**Costs**:
- Increased operational complexity
- Network latency between services
- Distributed system challenges
- More difficult debugging

#### Data Warehouse Integration

**When to Consider**:
- Historical analysis requires > 1 year of data
- Complex analytical queries slow down operations
- Business intelligence tools need separate access
- Compliance requires long-term data retention

**Architecture**:
- ETL pipeline exports from PostgreSQL to data warehouse
- Separate read path for analytical queries
- BI tools connect to warehouse
- Operational database stays fast

**Technology Options**:
- Snowflake (managed, expensive)
- Google BigQuery (pay per query)
- Amazon Redshift (cheaper at scale)
- ClickHouse (open source, self-hosted)

#### Real-Time Stream Processing

**When to Consider**:
- Need sub-second update latency
- High volume event processing (>10K events/sec)
- Complex event patterns (CEP)
- Real-time ML inference

**Architecture**:
- Apache Kafka or Amazon Kinesis for event streaming
- Stream processing with Apache Flink or Kafka Streams
- Real-time aggregations
- Separate from batch processing

**Use Cases**:
- Real-time session quality monitoring
- Instant churn prediction on behavior change
- Live tutor-student matching
- Dynamic pricing optimization

---

## Conclusion

This architecture provides a solid foundation for the Intelligent Operations Dashboard while prioritizing speed of development, ease of deployment, and cost-effectiveness. By leveraging managed services and serverless technologies, the system can scale automatically while keeping operational overhead minimal.

The architecture is designed to evolve: start simple with rule-based logic and monolithic structure, add machine learning incrementally, and migrate to more complex architectures only when justified by scale and team size.

Key strengths of this architecture:
- Fast development with AI-assisted coding
- Simple deployment with one-click updates
- Automatic scaling with serverless
- Low operational overhead with managed services
- Clear path for future optimization
- Cost-effective for MVP and early growth

The system processes over fifty data streams, serves real-time updates to operators, and provides AI-powered predictions while maintaining sub-three-second page loads and sub-five-hundred-millisecond API responses. It's production-ready architecture built for rapid iteration.