# Nerdy Operations Dashboard - Development Task List

## Project File Structure

The project organizes into a Next.js application with the App Router pattern. The main application directory contains route-based pages for dashboard views, customer management, tutor performance, supply-demand forecasting, and alerts. API routes handle data fetching, predictions, and real-time streams. Shared components provide reusable UI elements like metric cards, tables, charts, and alert displays.

Services layer includes ingestion modules for polling external APIs, processing modules for calculations and predictions, and notification modules for alerting. Utility functions provide helpers, constants, and type definitions. Database includes migration files and seed data for development. Testing infrastructure covers unit tests, integration tests, and end-to-end scenarios.

Configuration files handle environment variables, TypeScript settings, Tailwind CSS setup, and deployment configurations for Vercel and other platforms.

---

## Phase 1: Project Setup & Infrastructure (Hours 0-4)

### PR #1: Initial Project Configuration

**Branch:** `setup/initial-config`  
**Goal:** Bootstrap project with all dependencies and services configured  
**Time Estimate:** 2 hours

#### Tasks:

- **1.1: Initialize Next.js Project with TypeScript**
  - Create new Next.js fourteen application with App Router
  - Configure TypeScript with strict mode enabled
  - Set up ESLint and Prettier for code quality
  - Verify dev server runs without errors

- **1.2: Install Core Dependencies**
  - Install UI libraries: Tailwind CSS, shadcn/ui components
  - Install data libraries: React Query, Zustand for state management
  - Install charting: Recharts for visualizations
  - Install utilities: date-fns, lodash, zod for validation

- **1.3: Configure Tailwind and UI System**
  - Initialize Tailwind with custom theme colors
  - Set up shadcn/ui component registry
  - Create base layout with navigation structure
  - Test responsive breakpoints work correctly

- **1.4: Set Up Database Connection**
  - Create Supabase project or Neon database
  - Configure connection pooling for serverless
  - Set up TimescaleDB extension for time-series data
  - Test database connection from API routes

- **1.5: Configure Redis Cache**
  - Create Upstash Redis instance
  - Set up connection in environment variables
  - Create cache utility functions with TTL support
  - Test cache read/write operations

- **1.6: Set Up Authentication**
  - Configure NextAuth.js with credentials provider
  - Create login page with email/password form
  - Set up session management
  - Protect dashboard routes with middleware

- **1.7: Create Environment Configuration**
  - Set up environment variable files for development, staging, production
  - Document all required variables in README
  - Create example env file with placeholders
  - Configure variables in Vercel dashboard

- **1.8: Initialize Git Repository**
  - Create repository with proper gitignore
  - Set up branch protection rules
  - Create initial commit with project structure
  - Push to GitHub and configure deployments

**PR Checklist:**
- [ ] Development server runs without errors
- [ ] Database connection successful
- [ ] Redis cache operational
- [ ] Authentication flow works end-to-end
- [ ] Environment variables properly configured
- [ ] Repository pushed to GitHub

---

## Phase 2: Data Ingestion & Storage (Hours 4-12)

### PR #2: Database Schema & Migrations

**Branch:** `feature/database-schema`  
**Goal:** Create all database tables for MVP functionality  
**Time Estimate:** 2 hours

#### Tasks:

- **2.1: Design Core Schema**
  - Create sessions table for historical session data
  - Create customers table for user information
  - Create tutors table for tutor profiles
  - Create inbound_calls table for support interactions
  - Add proper indexes for query performance

- **2.2: Create Customer Health Tables**
  - Create customer_health_scores table with risk calculations
  - Add component score columns and risk tier classification
  - Create indexes on customer_id, risk_tier, calculated_at
  - Add foreign key constraints

- **2.3: Create Tutor Performance Tables**
  - Create tutor_performance table for metrics tracking
  - Add first session statistics columns
  - Add overall performance metrics columns
  - Create indexes for efficient querying

- **2.4: Create Forecast Tables**
  - Create supply_demand_forecasts table for predictions
  - Add subject, hour, predicted sessions columns
  - Add confidence interval columns
  - Create unique constraint on subject and forecast hour

- **2.5: Create Alerts Tables**
  - Create alerts table with type, severity, status columns
  - Add foreign keys to customers, tutors, subjects
  - Add timestamps for lifecycle tracking
  - Create indexes on status, type, severity

- **2.6: Create Recommendations Tables**
  - Create recommendations table for automated suggestions
  - Add action, reason, impact columns
  - Add priority and confidence score columns
  - Create status tracking fields

- **2.7: Run Migrations**
  - Execute all migrations in correct order
  - Verify foreign key constraints work
  - Test rollback functionality
  - Seed with sample data for development

- **2.8: Create Database Utility Functions**
  - Create connection pool manager
  - Create query builder helpers
  - Create transaction wrapper functions
  - Add error handling and logging

**PR Checklist:**
- [ ] All tables created successfully
- [ ] Indexes created for performance
- [ ] Foreign keys enforce referential integrity
- [ ] Migrations are reversible
- [ ] Sample data loads correctly
- [ ] Query helper functions work

---

### PR #3: Data Ingestion System

**Branch:** `feature/data-ingestion`  
**Goal:** Build polling services to fetch data from Rails API  
**Time Estimate:** 3 hours

#### Tasks:

- **3.1: Create Rails API Client**
  - Build authenticated HTTP client for Rails API
  - Implement retry logic with exponential backoff
  - Add request/response logging
  - Handle rate limiting gracefully

- **3.2: Build Session Data Poller**
  - Create service to poll sessions endpoint every five minutes
  - Transform Rails session data to internal schema
  - Validate data before insertion
  - Handle incremental updates (only new/changed sessions)

- **3.3: Build Customer Data Poller**
  - Create service to poll customers endpoint hourly
  - Map customer fields to internal schema
  - Update existing records efficiently
  - Track last sync timestamp

- **3.4: Build Tutor Data Poller**
  - Create service to poll tutors endpoint hourly
  - Extract availability and subject data
  - Calculate tutor utilization metrics
  - Store in tutor performance table

- **3.5: Build Inbound Call Poller**
  - Create service to poll support system API every fifteen minutes
  - Extract customer_id, call_date, reason_code
  - Count calls per customer in rolling windows
  - Flag customers with multiple recent calls

- **3.6: Set Up Background Job Queue**
  - Configure BullMQ with Redis backend
  - Create job definitions for each poller
  - Set up cron schedules for regular execution
  - Add job monitoring dashboard

- **3.7: Implement Error Handling**
  - Add comprehensive try-catch blocks
  - Log errors with context to monitoring service
  - Implement dead letter queue for failed jobs
  - Alert on repeated failures

- **3.8: Create Data Validation Layer**
  - Use Zod schemas to validate incoming data
  - Reject malformed records with clear errors
  - Log validation failures for debugging
  - Create metrics on data quality

**PR Checklist:**
- [ ] All pollers fetch data successfully
- [ ] Data transforms correctly to internal schema
- [ ] Background jobs run on schedule
- [ ] Errors are logged and monitored
- [ ] Validation catches malformed data
- [ ] Performance is acceptable (no bottlenecks)

---

### PR #4: Mock Data Generator (For Testing)

**Branch:** `feature/mock-data`  
**Goal:** Create realistic mock data for development without Rails dependency  
**Time Estimate:** 2 hours

#### Tasks:

- **4.1: Create Session Generator**
  - Generate random sessions with realistic distributions
  - Include various subjects, ratings, durations
  - Create patterns (daily peaks, weekend dips)
  - Export as JSON and database seed

- **4.2: Create Customer Generator**
  - Generate customer profiles with goals
  - Assign acquisition channels realistically
  - Create cohorts by signup date
  - Include variety of activity levels

- **4.3: Create Tutor Generator**
  - Generate tutor profiles with subjects
  - Create performance distributions (some good, some struggling)
  - Assign availability schedules
  - Include first session success rate variance

- **4.4: Create Inbound Call Generator**
  - Generate support call records
  - Cluster some customers with multiple calls
  - Distribute reason codes realistically
  - Create time-based patterns

- **4.5: Create Data Seeding Script**
  - Write script to populate all tables with mock data
  - Ensure referential integrity (valid foreign keys)
  - Create ninety days of historical data
  - Add recent data for real-time testing

- **4.6: Create Mock API Server**
  - Build simple Express server mimicking Rails API
  - Serve mock data with pagination
  - Support incremental updates
  - Add configurable delays for testing

- **4.7: Create Toggle for Mock vs Real Data**
  - Add environment variable to switch data sources
  - Update pollers to use mock API when enabled
  - Document how to switch between modes
  - Test both modes work correctly

- **4.8: Validate Mock Data Quality**
  - Verify distributions are realistic
  - Check for edge cases and anomalies
  - Ensure sufficient data volume for testing
  - Document any known limitations

**PR Checklist:**
- [ ] Mock data generators produce realistic data
- [ ] All tables can be seeded with mock data
- [ ] Mock API server responds correctly
- [ ] Can switch between mock and real data easily
- [ ] Sufficient data volume for testing all features
- [ ] Documentation explains mock data system

---

## Phase 3: Core Processing & Calculations (Hours 12-20)

### PR #5: Customer Health Scoring

**Branch:** `feature/customer-health`  
**Goal:** Calculate risk scores for all customers  
**Time Estimate:** 3 hours

#### Tasks:

- **5.1: Design Risk Score Algorithm**
  - Define scoring weights: first session thirty percent, velocity twenty-five percent, IB calls twenty percent, goals fifteen percent, tutor consistency ten percent
  - Create component score formulas (zero to one hundred scale)
  - Define risk tier thresholds: critical zero to forty, at-risk forty-one to seventy, healthy seventy-one to eighty-five, thriving eighty-six to one hundred
  - Document scoring logic in detail

- **5.2: Build First Session Score Calculator**
  - Query sessions table for first session per customer
  - Calculate success rate (rating greater than or equal to four stars equals success)
  - Score: one hundred times success rate
  - Handle customers without first session

- **5.3: Build Velocity Score Calculator**
  - Calculate sessions per week for last thirty days
  - Compare to benchmark (two sessions per week optimal)
  - Score: one hundred times (actual divided by benchmark), cap at one hundred
  - Handle new customers with few sessions

- **5.4: Build IB Call Score Calculator**
  - Count calls in last fourteen days
  - Scoring: zero calls equals one hundred, one call equals seventy-five, two calls equals forty, three plus calls equals zero
  - Flag customers with two plus calls as critical
  - Query inbound_calls table efficiently

- **5.5: Build Goal Status Score Calculator**
  - Check if primary goal is completed
  - Scoring: not completed equals one hundred, completed without new goal equals fifty, completed with new goal equals eighty
  - Identify cross-sell opportunities
  - Query customer goals table

- **5.6: Build Tutor Consistency Score Calculator**
  - Calculate percentage of sessions with same tutor
  - Scoring: one hundred times consistency percentage
  - Penalize customers who switch tutors frequently
  - Aggregate session data by tutor

- **5.7: Create Overall Risk Score Aggregator**
  - Combine component scores with defined weights
  - Calculate weighted average (zero to one hundred scale)
  - Assign risk tier based on thresholds
  - Store in customer_health_scores table

- **5.8: Build Risk Score Update Service**
  - Create scheduled job to recalculate scores every fifteen minutes
  - Update only customers with recent activity changes
  - Track calculation performance and duration
  - Add monitoring for scoring service health

**PR Checklist:**
- [ ] All component scores calculate correctly
- [ ] Overall risk score aggregates properly
- [ ] Risk tiers assigned accurately
- [ ] Scores update on fifteen-minute schedule
- [ ] Performance is acceptable (under five seconds per batch)
- [ ] Edge cases handled (new customers, inactive customers)

---

### PR #6: Tutor Performance Analytics

**Branch:** `feature/tutor-performance`  
**Goal:** Track and analyze tutor performance metrics  
**Time Estimate:** 2 hours

#### Tasks:

- **6.1: Build First Session Tracker**
  - Identify first sessions between each tutor-customer pair
  - Calculate success rate (rating greater than or equal to four stars)
  - Count total first sessions per tutor
  - Store in tutor_performance table

- **6.2: Calculate Overall Tutor Metrics**
  - Calculate average rating across all sessions
  - Calculate total sessions and hours taught
  - Track completion rate
  - Aggregate by time period (weekly, monthly)

- **6.3: Build Trend Detection**
  - Compare current week to previous week metrics
  - Calculate week-over-week percentage change
  - Flag significant drops (greater than twenty percent)
  - Track trend direction (improving, declining, stable)

- **6.4: Create Performance Flags**
  - Flag tutors with first session success rate less than seventy percent as underperforming
  - Flag tutors with declining trends as needing coaching
  - Flag tutors with high cancellation rates
  - Store flags in tutor_performance table

- **6.5: Build Subject Performance Breakdown**
  - Calculate success rates by subject per tutor
  - Identify tutor strengths and weaknesses
  - Compare to subject benchmarks
  - Store in separate tutor_subject_performance table

- **6.6: Create Performance Update Service**
  - Schedule daily calculation of tutor metrics
  - Update performance table with latest data
  - Track historical performance over time
  - Add monitoring for service health

- **6.7: Build Tutor Ranking System**
  - Rank tutors by first session success rate
  - Create percentile rankings
  - Identify top performers for recognition
  - Store rankings for leaderboard display

- **6.8: Create Anomaly Detection for Tutors**
  - Detect sudden drops in performance
  - Flag tutors with unusual patterns
  - Generate alerts for coaching team
  - Track alert resolution

**PR Checklist:**
- [ ] First session metrics calculate accurately
- [ ] Overall performance metrics aggregate correctly
- [ ] Trends detect week-over-week changes
- [ ] Performance flags identify struggling tutors
- [ ] Daily updates run successfully
- [ ] Rankings are accurate and fair

---

### PR #7: Supply & Demand Forecasting

**Branch:** `feature/supply-demand`  
**Goal:** Predict future session demand and track tutor supply  
**Time Estimate:** 3 hours

#### Tasks:

- **7.1: Design Forecasting Approach**
  - Choose time-series model: start with moving average, upgrade to ARIMA or Prophet if time permits
  - Define features: day of week, hour, subject, historical trends, seasonality
  - Define forecast horizon: seven days ahead, hourly granularity
  - Set accuracy target: mean absolute percentage error less than twenty percent

- **7.2: Build Historical Data Aggregator**
  - Query sessions table for ninety days of history
  - Aggregate by subject, date, hour
  - Calculate session counts per bucket
  - Handle missing data and outliers

- **7.3: Implement Simple Moving Average Forecast**
  - Calculate four-week moving average per subject and hour
  - Apply day-of-week adjustments
  - Generate seven-day forecast
  - Store predictions in supply_demand_forecasts table

- **7.4: Calculate Confidence Intervals**
  - Calculate historical standard deviation per bucket
  - Apply ninety-five percent confidence interval (mean plus/minus 1.96 times standard deviation)
  - Store upper and lower bounds
  - Use wider intervals for uncertain predictions

- **7.5: Track Current Tutor Supply**
  - Query tutor availability for next seven days
  - Count available hours per subject and hour
  - Consider tutor utilization rates
  - Store in supply_demand_forecasts table

- **7.6: Detect Supply-Demand Imbalances**
  - Calculate supply-to-demand ratio
  - Flag shortages: ratio less than 0.8
  - Flag surpluses: ratio greater than 1.3
  - Prioritize by severity and timing

- **7.7: Create Forecast Update Service**
  - Schedule daily forecast generation
  - Update predictions based on latest data
  - Track forecast accuracy over time
  - Improve model based on performance

- **7.8: Build Accuracy Tracking**
  - Compare predictions to actual outcomes
  - Calculate mean absolute percentage error
  - Track accuracy by subject and time
  - Report accuracy metrics in dashboard

**PR Checklist:**
- [ ] Forecasts generate for all subjects
- [ ] Seven-day predictions available
- [ ] Confidence intervals are reasonable
- [ ] Supply data is current and accurate
- [ ] Imbalances are detected correctly
- [ ] Daily updates run successfully
- [ ] Accuracy is tracked and improving

---

## Phase 4: Dashboard UI Development (Hours 20-32)

### PR #8: Main Dashboard View

**Branch:** `feature/main-dashboard`  
**Goal:** Create main operations dashboard with key metrics  
**Time Estimate:** 3 hours

#### Tasks:

- **8.1: Design Dashboard Layout**
  - Create responsive grid layout
  - Define metric card placement
  - Design header with filters and refresh button
  - Plan mobile-responsive breakpoints

- **8.2: Build Metric Card Component**
  - Create reusable card with title, value, trend indicator
  - Add color coding (red, yellow, green based on thresholds)
  - Include sparkline chart for seven-day trend
  - Make card clickable for drill-down

- **8.3: Create Active Sessions Metric**
  - Display current active session count
  - Show comparison to average
  - Add trend indicator
  - Link to session list view

- **8.4: Create Daily Session Volume Metric**
  - Display today's session count vs target
  - Show progress bar
  - Calculate percentage of target achieved
  - Highlight if below/above target

- **8.5: Create Satisfaction Score Metric**
  - Display rolling seven-day average rating
  - Show trend compared to previous period
  - Add color coding based on thresholds
  - Include star rating visualization

- **8.6: Create Supply-Demand Balance Metric**
  - Display overall supply-demand ratio
  - Color code: green for balanced, yellow for imbalance, red for critical
  - Show breakdown by subject on hover
  - Link to supply-demand forecast view

- **8.7: Implement Auto-Refresh**
  - Refresh metrics every thirty seconds
  - Use Server-Sent Events for real-time updates
  - Show loading state during refresh
  - Add manual refresh button

- **8.8: Add Time Range Filter**
  - Create dropdown to select time range (today, seven days, thirty days)
  - Update all metrics based on selected range
  - Persist selection in URL params
  - Default to today view

**PR Checklist:**
- [ ] Dashboard displays all key metrics
- [ ] Metric cards are visually consistent
- [ ] Color coding works correctly
- [ ] Trends show accurate direction
- [ ] Auto-refresh works without flickering
- [ ] Mobile responsive layout works
- [ ] Performance is good (loads in under three seconds)

---

### PR #9: Customer Health Dashboard

**Branch:** `feature/customer-dashboard`  
**Goal:** Display customer health scores and risk analysis  
**Time Estimate:** 3 hours

#### Tasks:

- **9.1: Build Customer List View**
  - Create table with sortable columns
  - Display: customer name, risk score, risk tier, last session, next action
  - Add pagination (twenty-five customers per page)
  - Include search by customer name

- **9.2: Create Risk Score Display Component**
  - Show score as progress bar with color gradient
  - Display numeric score (zero to one hundred)
  - Show risk tier badge
  - Add tooltip with score breakdown

- **9.3: Implement Risk Tier Filtering**
  - Add filter buttons: All, Critical, At Risk, Healthy, Thriving
  - Update table to show only selected tier
  - Display count per tier
  - Default to showing Critical and At Risk

- **9.4: Build Customer Detail View**
  - Create page showing full customer profile
  - Display all component scores with explanations
  - Show session history with ratings
  - List recent inbound calls

- **9.5: Create Risk Factor Breakdown**
  - Show which factors contribute most to risk
  - Display component scores as horizontal bars
  - Highlight critical factors in red
  - Explain what each factor measures

- **9.6: Add Suggested Interventions**
  - Display recommended action for each at-risk customer
  - Prioritize interventions by urgency
  - Include expected impact
  - Add one-click action buttons (email, call, assign task)

- **9.7: Build Export Functionality**
  - Add export button to download customer list as CSV
  - Include all visible columns and filters
  - Format for use in spreadsheets
  - Limit to current filter selection

- **9.8: Create Alert Integration**
  - Show alert count per customer
  - Display most recent alert
  - Link to full alert history
  - Highlight unacknowledged alerts

**PR Checklist:**
- [ ] Customer list loads quickly
- [ ] Sorting and filtering work correctly
- [ ] Risk scores display accurately
- [ ] Detail view shows complete information
- [ ] Suggested interventions are actionable
- [ ] Export produces valid CSV
- [ ] Pagination handles large datasets

---

### PR #10: Tutor Performance Dashboard

**Branch:** `feature/tutor-dashboard`  
**Goal:** Display tutor performance metrics and coaching needs  
**Time Estimate:** 2 hours

#### Tasks:

- **10.1: Build Tutor Performance Table**
  - Create sortable table with columns: name, first session count, success rate, average rating, trend
  - Add color coding: green for high performers, red for underperformers
  - Include search by tutor name
  - Add pagination

- **10.2: Create Success Rate Visualization**
  - Display success rate as percentage with progress bar
  - Show comparison to benchmark (seventy percent)
  - Add sparkline for trend over time
  - Color code based on performance tier

- **10.3: Build Subject Performance Breakdown**
  - Show tutors success rate by subject
  - Create horizontal bar chart
  - Identify strongest and weakest subjects
  - Link to subject-specific coaching resources

- **10.4: Create Tutor Detail View**
  - Display complete tutor profile
  - Show all performance metrics over time
  - List recent sessions with ratings
  - Display coaching recommendations

- **10.5: Add Performance Flags**
  - Show badge for underperforming tutors
  - Display coaching needed flag
  - Highlight declining trends
  - Add ability to assign coaching tasks

- **10.6: Implement Filter by Performance Tier**
  - Add filters: All, Top Performers, Needs Improvement, Critical
  - Update table based on selection
  - Show count per tier
  - Default to showing all

- **10.7: Create Tutor Leaderboard**
  - Display top ten tutors by first session success rate
  - Show rankings and scores
  - Include recognition badges
  - Update daily

- **10.8: Build Trend Detection Display**
  - Show week-over-week change prominently
  - Flag significant drops with alert icon
  - Display trend chart
  - Suggest investigation for large changes

**PR Checklist:**
- [ ] Tutor table displays all metrics correctly
- [ ] Success rates calculate accurately
- [ ] Color coding identifies performance tiers
- [ ] Subject breakdown is informative
- [ ] Detail view provides complete context
- [ ] Filters work smoothly
- [ ] Performance is good with hundreds of tutors

---

### PR #11: Supply-Demand Forecast View

**Branch:** `feature/forecast-view`  
**Goal:** Visualize supply-demand predictions and imbalances  
**Time Estimate:** 3 hours

#### Tasks:

- **11.1: Design Forecast Layout**
  - Create timeline view showing seven days ahead
  - Organize by subject area
  - Use visual indicators for imbalances
  - Include legend and filters

- **11.2: Build Forecast Chart Component**
  - Create line chart showing demand forecast
  - Add confidence interval shading
  - Overlay supply availability
  - Highlight shortage/surplus areas

- **11.3: Create Subject Filter**
  - Add dropdown to select subject
  - Show all subjects by default
  - Update chart based on selection
  - Display subject-specific metrics

- **11.4: Display Imbalance Alerts**
  - Show cards for predicted shortages
  - Display: subject, time, severity, recommended action
  - Sort by urgency (soonest first)
  - Color code by severity

- **11.5: Build Hourly Breakdown View**
  - Show hour-by-hour forecast for selected day
  - Display predicted sessions and available capacity
  - Identify peak hours and gaps
  - Use heatmap visualization

- **11.6: Create Capacity Utilization Metric**
  - Calculate average utilization rate
  - Show by subject and overall
  - Display as percentage
  - Color code: green for optimal, red for over/under

- **11.7: Add Forecast Accuracy Display**
  - Show historical accuracy metrics
  - Display mean absolute percentage error
  - Compare forecast to actual by subject
  - Update weekly

- **11.8: Implement Recommendation Feed**
  - Display automated recruiting recommendations
  - Show: subject, action, reason, expected impact
  - Add one-click accept or dismiss
  - Track acceptance rate

**PR Checklist:**
- [ ] Forecast chart is clear and informative
- [ ] Confidence intervals display correctly
- [ ] Imbalances are visually obvious
- [ ] Hourly breakdown is detailed
- [ ] Recommendations are actionable
- [ ] Filters update view correctly
- [ ] Performance handles multiple subjects

---

### PR #12: Alert Center

**Branch:** `feature/alert-center`  
**Goal:** Create centralized alert management interface  
**Time Estimate:** 2 hours

#### Tasks:

- **12.1: Build Alert List View**
  - Create table showing all active alerts
  - Display: type, severity, message, time, status
  - Sort by severity then time
  - Add pagination

- **12.2: Create Alert Card Component**
  - Design card showing alert details
  - Include title, description, suggested action
  - Show related entity (customer, tutor, subject)
  - Add status badge

- **12.3: Implement Alert Filtering**
  - Filter by type: customer risk, tutor performance, supply-demand, anomaly
  - Filter by severity: critical, warning, info
  - Filter by status: active, acknowledged, resolved, dismissed
  - Combine filters logically

- **12.4: Build Alert Detail Modal**
  - Show full alert context
  - Display related data and history
  - Provide action buttons: acknowledge, resolve, dismiss, escalate
  - Link to relevant dashboard view

- **12.5: Create Alert Notification Banner**
  - Display critical alerts at top of dashboard
  - Make dismissible but persistent until acknowledged
  - Limit to three most urgent alerts
  - Link to alert center

- **12.6: Add Alert Actions**
  - Implement acknowledge button
  - Implement resolve button with notes
  - Implement dismiss button with reason
  - Track who performed action and when

- **12.7: Build Alert History View**
  - Show resolved and dismissed alerts
  - Display resolution notes
  - Allow reopening if needed
  - Track time to resolution

- **12.8: Create Alert Summary Dashboard**
  - Show count by type and severity
  - Display average time to resolution
  - Track alert trends over time
  - Identify recurring issues

**PR Checklist:**
- [ ] Alert list displays all alerts correctly
- [ ] Filtering works for all dimensions
- [ ] Alert actions update status properly
- [ ] Critical alerts show in banner
- [ ] History view is complete
- [ ] Performance is good with hundreds of alerts
- [ ] Mobile view is usable

---

## Phase 5: Real-Time Updates & Notifications (Hours 32-40)

### PR #13: Server-Sent Events Implementation

**Branch:** `feature/realtime-updates`  
**Goal:** Add real-time updates to dashboard without page refresh  
**Time Estimate:** 2 hours

#### Tasks:

- **13.1: Create SSE API Route**
  - Build Next.js API route for Server-Sent Events
  - Stream updates every thirty seconds
  - Handle client connections and disconnections
  - Add heartbeat to keep connection alive

- **13.2: Build Event Publisher Service**
  - Create service to detect data changes
  - Publish events to connected clients
  - Include only changed data in events
  - Handle multiple simultaneous connections

- **13.3: Implement Dashboard Event Listener**
  - Connect to SSE endpoint on dashboard mount
  - Parse incoming events
  - Update relevant metrics without page reload
  - Handle connection errors and reconnection

- **13.4: Add Optimistic Updates**
  - Update UI immediately on user actions
  - Revert if server update fails
  - Show loading state during sync
  - Display error messages on failure

- **13.5: Create Connection Status Indicator**
  - Show green dot when connected
  - Show red dot when disconnected
  - Display "Reconnecting..." message
  - Attempt automatic reconnection

- **13.6: Implement Event Prioritization**
  - Send critical updates immediately
  - Batch non-critical updates
  - Limit event frequency to avoid overwhelming client
  - Drop old events if client lags behind

- **13.7: Add Browser Notification Support**
  - Request notification permission on dashboard load
  - Send browser notification for critical alerts
  - Include action buttons in notification
  - Respect user preferences

- **13.8: Test Real-Time Performance**
  - Verify updates arrive within target latency
  - Test with multiple concurrent users
  - Check for memory leaks over long sessions
  - Validate reconnection logic

**PR Checklist:**
- [ ] SSE connection establishes successfully
- [ ] Updates arrive within thirty seconds
- [ ] Dashboard reflects changes without refresh
- [ ] Connection status indicator accurate
- [ ] Reconnection works after network interruption
- [ ] No memory leaks during extended use
- [ ] Performance acceptable with twenty plus clients

---

### PR #14: Email Alert System

**Branch:** `feature/email-alerts`  
**Goal:** Send email notifications for critical alerts  
**Time Estimate:** 2 hours

#### Tasks:

- **14.1: Configure Email Service**
  - Set up SendGrid or similar email service
  - Configure API keys and sender address
  - Create verified sender identity
  - Test email delivery

- **14.2: Design Email Templates**
  - Create template for critical customer risk alerts
  - Create template for tutor performance alerts
  - Create template for supply-demand alerts
  - Create template for daily summary digest

- **14.3: Build Email Sender Service**
  - Create service to queue and send emails
  - Implement rate limiting to avoid spam
  - Track delivery status
  - Handle bounces and failures

- **14.4: Create Alert Email Trigger**
  - Trigger email when critical alert created
  - Include alert details and suggested action
  - Add link to dashboard alert detail
  - Respect user notification preferences

- **14.5: Build Daily Summary Email**
  - Generate daily digest at configurable time
  - Include key metrics summary
  - List new alerts since last digest
  - Provide dashboard link

- **14.6: Implement Email Preferences**
  - Allow users to configure notification settings
  - Support per-alert-type preferences
  - Allow opt-out of non-critical emails
  - Store preferences in user table

- **14.7: Add Email Tracking**
  - Track open rates
  - Track click-through rates
  - Monitor delivery failures
  - Adjust sending strategy based on engagement

- **14.8: Create Email Testing Tools**
  - Build admin panel to send test emails
  - Preview templates before sending
  - Test with different data scenarios
  - Verify formatting across email clients

**PR Checklist:**
- [ ] Email service configured and working
- [ ] Templates render correctly
- [ ] Critical alerts trigger emails
- [ ] Daily digest sends on schedule
- [ ] Users can configure preferences
- [ ] Delivery tracking works
- [ ] Test tools are functional

---

## Phase 6: ML Models & Predictions (Hours 40-44)

### PR #15: Demand Forecasting Model

**Branch:** `feature/ml-forecasting`  
**Goal:** Implement basic machine learning for demand prediction  
**Time Estimate:** 2 hours

#### Tasks:

- **15.1: Prepare Training Data**
  - Extract ninety days of historical session data
  - Create features: day of week, hour, subject, week number, holiday flag
  - Create target: session count per hour
  - Split into training and validation sets

- **15.2: Train Initial Model**
  - Start with linear regression or simple ARIMA
  - Train separate model per subject
  - Evaluate on validation set
  - Calculate mean absolute percentage error

- **15.3: Improve Model (If Time Permits)**
  - Try Prophet for automatic seasonality detection
  - Add trend components
  - Include external features (weather, school calendar)
  - Tune hyperparameters

- **15.4: Create Model Training Service**
  - Build script to train models weekly
  - Save trained models to disk or database
  - Version models for rollback capability
  - Track model performance over time

- **15.5: Build Prediction Service**
  - Load trained models
  - Generate seven-day hourly predictions
  - Calculate confidence intervals
  - Store in supply_demand_forecasts table

- **15.6: Create Model Monitoring**
  - Track prediction accuracy over time
  - Compare forecasts to actuals daily
  - Alert if accuracy drops below threshold
  - Retrain model if performance degrades

- **15.7: Build Model Explainability**
  - Show which features drive predictions
  - Display feature importance
  - Explain large prediction changes
  - Make predictions interpretable to operators

- **15.8: Document Model Approach**
  - Write detailed documentation of model architecture
  - Explain feature engineering decisions
  - Document known limitations
  - Provide improvement roadmap

**PR Checklist:**
- [ ] Model trains without errors
- [ ] Predictions are reasonable
- [ ] Accuracy meets twenty percent MAPE target
- [ ] Models update weekly
- [ ] Monitoring tracks performance
- [ ] Documentation is complete
- [ ] Code is maintainable

---

### PR #16: Churn Prediction Model

**Branch:** `feature/churn-prediction`  
**Goal:** Predict customer churn probability  
**Time Estimate:** 2 hours

#### Tasks:

- **16.1: Prepare Training Data**
  - Label historical customers: churned (no session in sixty days) vs active
  - Create features: session frequency, rating average, IB call count, goal status, tenure
  - Balance classes (downsample or use class weights)
  - Split into training and validation sets

- **16.2: Train Classification Model**
  - Start with logistic regression
  - Train on historical data (six months)
  - Evaluate precision, recall, F1 score
  - Aim for eighty percent recall (catch most churners)

- **16.3: Tune Model Threshold**
  - Adjust probability threshold for prediction
  - Optimize for recall (prefer false positives over false negatives)
  - Calculate optimal threshold using validation set
  - Document threshold choice

- **16.4: Create Prediction Service**
  - Generate churn predictions for all active customers
  - Update customer_health_scores table with predictions
  - Run predictions daily
  - Store prediction confidence scores

- **16.5: Build Feature Importance Display**
  - Show which features predict churn
  - Display per-customer feature contributions
  - Explain why customer is at risk
  - Make predictions actionable

- **16.6: Validate Predictions**
  - Track which predictions turn into actual churn
  - Calculate true positive rate over time
  - Measure false positive rate
  - Adjust model if needed

- **16.7: Create Intervention Tracking**
  - Track which at-risk customers receive interventions
  - Measure effectiveness of interventions
  - Compare churn rates: intervened vs not intervened
  - Calculate ROI of intervention program

- **16.8: Document Model Approach**
  - Write detailed documentation
  - Explain feature selection
  - Document model limitations
  - Provide improvement roadmap

**PR Checklist:**
- [ ] Model trains successfully
- [ ] Predictions have acceptable accuracy
- [ ] Feature importance is interpretable
- [ ] Predictions update daily
- [ ] Validation tracking works
- [ ] Documentation complete
- [ ] Code is maintainable

---

## Phase 7: Testing & Quality Assurance (Hours 44-48)

### PR #17: Testing Infrastructure

**Branch:** `test/infrastructure`  
**Goal:** Set up comprehensive testing framework  
**Time Estimate:** 2 hours

#### Tasks:

- **17.1: Configure Testing Framework**
  - Set up Jest or Vitest for unit tests
  - Configure React Testing Library
  - Set up Playwright for end-to-end tests
  - Add test scripts to package.json

- **17.2: Create Test Utilities**
  - Build mock data factories
  - Create test database setup/teardown
  - Build API mock server for testing
  - Create custom testing utilities

- **17.3: Write Database Tests**
  - Test all database queries
  - Verify indexes improve performance
  - Test transaction handling
  - Validate foreign key constraints

- **17.4: Write Service Tests**
  - Test data ingestion services
  - Test risk scoring calculations
  - Test forecast generation
  - Test alert triggering logic

- **17.5: Write API Route Tests**
  - Test all API endpoints
  - Verify authentication required
  - Test error handling
  - Validate response schemas

- **17.6: Write Component Tests**
  - Test metric card rendering
  - Test table sorting and filtering
  - Test form submissions
  - Test chart components

- **17.7: Write End-to-End Tests**
  - Test complete user flows
  - Test login and navigation
  - Test dashboard interactions
  - Test alert acknowledgment workflow

- **17.8: Set Up CI/CD Testing**
  - Configure GitHub Actions to run tests
  - Run tests on every pull request
  - Block merge if tests fail
  - Generate coverage reports

**PR Checklist:**
- [ ] Testing framework configured
- [ ] Test utilities are reusable
- [ ] Database tests pass
- [ ] Service tests have good coverage
- [ ] API tests cover all routes
- [ ] Component tests render correctly
- [ ] End-to-end tests complete critical flows
- [ ] CI/CD runs tests automatically

---

### PR #18: Performance Optimization

**Branch:** `optimize/performance`  
**Goal:** Ensure dashboard meets performance targets  
**Time Estimate:** 1 hour

#### Tasks:

- **18.1: Audit Database Queries**
  - Use query analyzer to find slow queries
  - Add missing indexes
  - Optimize joins and aggregations
  - Implement query result caching

- **18.2: Optimize API Routes**
  - Add Redis caching for frequently accessed data
  - Implement pagination for large datasets
  - Compress API responses
  - Reduce unnecessary data in responses

- **18.3: Optimize Frontend Bundle**
  - Analyze bundle size with webpack analyzer
  - Code split large components
  - Lazy load non-critical features
  - Remove unused dependencies

- **18.4: Implement Loading States**
  - Add skeleton loaders for all async operations
  - Show progress indicators
  - Provide feedback during long operations
  - Improve perceived performance

- **18.5: Optimize Chart Rendering**
  - Reduce data points for large datasets
  - Use data sampling for visualization
  - Implement virtualization for long lists
  - Debounce expensive re-renders

- **18.6: Add Performance Monitoring**
  - Integrate monitoring service (Vercel Analytics, Sentry)
  - Track Core Web Vitals
  - Monitor API response times
  - Alert on performance regressions

- **18.7: Load Test Application**
  - Simulate fifty concurrent users
  - Test database under load
  - Verify caching reduces database hits
  - Identify bottlenecks

- **18.8: Document Performance Targets**
  - Document achieved performance metrics
  - Note any areas needing future optimization
  - Provide monitoring dashboard
  - Set alerts for performance degradation

**PR Checklist:**
- [ ] Dashboard loads in under three seconds
- [ ] API response times under five hundred milliseconds
- [ ] No unnecessary re-renders
- [ ] Caching reduces database load
- [ ] Bundle size is reasonable
- [ ] Performance monitoring active
- [ ] Load testing shows acceptable performance

---

### PR #19: Security & Error Handling

**Branch:** `security/hardening`  
**Goal:** Secure application and handle errors gracefully  
**Time Estimate:** 1 hour

#### Tasks:

- **19.1: Audit Authentication**
  - Verify all protected routes require authentication
  - Check session expiration handling
  - Test password reset flow
  - Validate token security

- **19.2: Implement Authorization**
  - Define user roles (admin, operator, viewer)
  - Restrict sensitive operations to admins
  - Implement row-level security in database
  - Test unauthorized access attempts

- **19.3: Sanitize Inputs**
  - Validate all user inputs with Zod schemas
  - Prevent SQL injection with parameterized queries
  - Escape outputs to prevent XSS
  - Test with malicious inputs

- **19.4: Add Rate Limiting**
  - Implement rate limits on API routes
  - Protect against brute force attacks
  - Limit expensive operations
  - Return appropriate error codes

- **19.5: Handle Errors Gracefully**
  - Add try-catch blocks to all async operations
  - Log errors with context to monitoring service
  - Display user-friendly error messages
  - Provide recovery suggestions

- **19.6: Create Error Boundaries**
  - Add React error boundaries to catch rendering errors
  - Display fallback UI when errors occur
  - Log component errors for debugging
  - Allow user to recover gracefully

- **19.7: Audit Dependencies**
  - Run npm audit to find vulnerabilities
  - Update vulnerable dependencies
  - Remove unused dependencies
  - Document security considerations

- **19.8: Document Security Measures**
  - Document authentication approach
  - Explain authorization model
  - Provide security best practices
  - Create incident response plan

**PR Checklist:**
- [ ] All routes properly authenticated
- [ ] Authorization works correctly
- [ ] Inputs are validated and sanitized
- [ ] Rate limiting prevents abuse
- [ ] Errors are handled gracefully
- [ ] Error boundaries catch rendering errors
- [ ] No critical security vulnerabilities
- [ ] Documentation is complete

---

## Phase 8: Deployment & Documentation (Hours 48+)

### PR #20: Production Deployment

**Branch:** `deploy/production`  
**Goal:** Deploy application to production environment  
**Time Estimate:** Post-sprint (if time allows)

#### Tasks:

- **20.1: Configure Production Environment**
  - Set up production database (Supabase or Neon)
  - Configure production Redis instance
  - Set all environment variables in Vercel
  - Enable production security features

- **20.2: Deploy to Vercel**
  - Connect GitHub repository to Vercel
  - Configure build settings
  - Deploy main branch to production
  - Verify deployment successful

- **20.3: Set Up Custom Domain (Optional)**
  - Register domain or use subdomain
  - Configure DNS records
  - Enable HTTPS with automatic certificates
  - Verify domain accessibility

- **20.4: Configure Database Backups**
  - Enable automated backups in Supabase
  - Test restore process
  - Set backup retention policy
  - Document recovery procedures

- **20.5: Set Up Monitoring**
  - Configure error tracking (Sentry)
  - Set up uptime monitoring
  - Configure alert notifications
  - Create monitoring dashboard

- **20.6: Create Admin Tools**
  - Build admin panel for user management
  - Add data migration tools
  - Create manual alert creation interface
  - Provide database query interface

- **20.7: Conduct Production Testing**
  - Test all features in production
  - Verify data ingestion works
  - Check alert delivery
  - Validate performance

- **20.8: Create Runbook**
  - Document deployment process
  - Provide troubleshooting guide
  - List common issues and solutions
  - Include rollback procedures

**PR Checklist:**
- [ ] Application deployed to production
- [ ] All features work in production
- [ ] Monitoring and alerts configured
- [ ] Backups are operational
- [ ] Documentation complete
- [ ] Team trained on using dashboard
- [ ] Incident response plan ready

---

## MVP Completion Checklist

### Core Functionality (Must Have)

- [ ] Main dashboard displays six plus key metrics with real-time updates
- [ ] Customer health scores calculate correctly for all customers
- [ ] At-risk customer alerts trigger within specified timeframes
- [ ] First session success rates display by tutor with sorting
- [ ] Supply vs demand forecast shows seven-day predictions
- [ ] Anomaly detection identifies outliers in metrics
- [ ] Three plus automated recommendations generated from rules
- [ ] Alert center manages all alerts with filtering and actions
- [ ] Email alerts send for critical issues

### Performance Targets

- [ ] Dashboard loads in under three seconds
- [ ] API response times under five hundred milliseconds for most endpoints
- [ ] Data updates every thirty seconds without page refresh
- [ ] System handles fifty plus concurrent metrics without slowdown
- [ ] Real-time updates arrive within thirty seconds
- [ ] No critical errors in production logs

### Data Quality

- [ ] All data sources integrated (session, customer, tutor, inbound calls)
- [ ] Data validation prevents malformed records
- [ ] Historical data available for ninety days
- [ ] Forecasts generate daily for all subjects
- [ ] Risk scores update every fifteen minutes
- [ ] Performance metrics calculate accurately

### User Experience

- [ ] Authentication works reliably
- [ ] Navigation is intuitive
- [ ] Tables sort and filter correctly
- [ ] Charts are clear and informative
- [ ] Mobile view is functional
- [ ] Error messages are helpful
- [ ] Loading states provide feedback

### Deployment & Operations

- [ ] Deployed to public URL with HTTPS
- [ ] Environment variables properly configured
- [ ] Database backups enabled
- [ ] Monitoring and alerting operational
- [ ] Documentation complete and accurate
- [ ] Runbook provides troubleshooting guidance

### Business Value Demonstration

- [ ] Demo shows identifying at-risk customer with intervention suggestion
- [ ] Demo shows supply-demand imbalance detection twelve hours ahead
- [ ] Demo shows alert for tutor with declining performance
- [ ] Demo shows recommendation with clear explanation and ROI
- [ ] Cost analysis confirms under two hundred dollars per month
- [ ] ROI calculation shows positive return within ninety days

---

## Post-MVP: 90-Day Enhancement Plan

### Week 1-2: Production Hardening
- Comprehensive test coverage (eighty percent plus)
- Load testing with production volumes (three thousand sessions per day)
- Security audit and penetration testing
- Performance optimization for large datasets
- Monitoring and alerting refinement

### Week 3-4: Advanced ML Models
- Upgrade demand forecasting to LightGBM or Prophet
- Implement ensemble methods for churn prediction
- Add customer lifetime value prediction
- Create model performance dashboards
- Implement A/B testing framework

### Week 5-6: Automation & Integrations
- Auto-adjust recruiting campaigns within budget limits
- Implement Slack notification integration
- Build Salesforce sync for at-risk customers
- Create automated email re-engagement campaigns
- Add webhook support for external systems

### Week 7-8: Advanced Analytics
- Build comprehensive cohort analysis tool
- Create custom report builder
- Implement multi-touch attribution analysis
- Add funnel analysis with drop-off insights
- Create executive summary reports

### Week 9-10: Mobile & Accessibility
- Develop Progressive Web App features
- Optimize mobile experience
- Add offline support
- Improve accessibility (WCAG compliance)
- Create native app if justified

### Week 11-12: Scale & Optimization
- Implement multi-region deployment
- Add advanced caching strategies (CDN)
- Build GraphQL API for flexible queries
- Integrate data warehouse for historical analysis
- Create self-service analytics tools

---

## Risk Mitigation Strategies

### Technical Risks

**Risk**: Integration with Rails API takes longer than expected  
**Mitigation**: Use mock data generator for first twenty-four hours; parallel track integration; create adapter layer for easy switching; test with mock data first

**Risk**: Machine learning models don't perform well enough  
**Mitigation**: Start with rule-based logic that provides immediate value; ML models are enhancement not requirement; focus on simple interpretable models; can improve post-MVP

**Risk**: Real-time updates cause performance issues  
**Mitigation**: Use Server-Sent Events instead of WebSockets; implement aggressive caching with Redis; limit update frequency to thirty seconds; batch non-critical updates

**Risk**: Database queries become bottlenecks  
**Mitigation**: Add indexes early; implement Redis caching layer; use TimescaleDB for time-series queries; monitor slow queries continuously

### Scope Risks

**Risk**: Feature creep during development  
**Mitigation**: Strict prioritization in task list; "must have" versus "nice to have" clearly marked; timebox each feature to two to four hours maximum; defer anything not critical

**Risk**: Testing takes longer than planned  
**Mitigation**: Focus on critical path testing only; automate repetitive tests; use AI to generate test cases; accept some technical debt for post-MVP

**Risk**: Deployment complexity delays launch  
**Mitigation**: Use Vercel for one-click deployment; use managed services (Supabase, Upstash); minimize custom infrastructure; defer ML service containerization if needed

### Business Risks

**Risk**: Mock data doesn't represent reality well  
**Mitigation**: Consult with operations team on realistic distributions; validate mock data patterns; plan for real data integration from start; iterate on mock data quality

**Risk**: Dashboard doesn't meet user needs  
**Mitigation**: Show wireframes to stakeholders early; get feedback on priorities; focus on top three use cases; plan for iteration post-MVP

**Risk**: ML predictions are not trusted by operators  
**Mitigation**: Provide clear explanations for all predictions; show confidence scores; compare to human judgment; start with recommendations not automation

---

## AI Development Strategy

### Hours 0-24: AI-Only Development

**Primary Tool**: Claude Sonnet for all code generation  
**Approach**: Specification-driven development with detailed prompts  
**Focus**: Speed over perfection, working code over optimal code

**Prompting Pattern**:
- Provide complete context: "We are building X for Y purpose"
- Specify exact requirements: "Must include A, B, C features"
- Define constraints: "Use Next.js App Router, TypeScript strict mode"
- Request complete solutions: "Generate entire component with all imports"
- Ask for testing: "Include basic tests for happy path"

**Success Criteria**:
- Generate working components on first try
- Minimal manual debugging needed
- Code follows consistent patterns
- All dependencies properly imported

### Hours 24-36: Mixed Approach

**Strategy**: AI for new features, manual for complex debugging  
**Tools**: Claude for code generation, manual for integration issues  
**Focus**: Refinement and integration

**Activities**:
- Use AI to generate new features
- Manually debug integration issues
- Refactor generated code for consistency
- Add error handling and edge cases
- Improve test coverage

### Hours 36-48: Production Hardening

**Strategy**: Primarily manual with AI assistance  
**Tools**: AI for test generation, manual for security review  
**Focus**: Quality and reliability

**Activities**:
- Manual security audit
- Performance profiling and optimization
- Documentation writing with AI help
- Deployment preparation
- Final testing and validation

---

## Success Metrics

### Technical Metrics

- Dashboard loads in under three seconds: **Target Met / Not Met**
- API response times under five hundred milliseconds: **Target Met / Not Met**
- Real-time updates within thirty seconds: **Target Met / Not Met**
- Zero critical production errors: **Target Met / Not Met**
- Test coverage above sixty percent: **Target Met / Not Met**

### Functional Metrics

- All six key metrics display correctly: **Yes / No**
- Customer health scores calculate accurately: **Yes / No**
- Forecasts generate for seven days ahead: **Yes / No**
- Alerts trigger within specified timeframes: **Yes / No**
- Recommendations are actionable: **Yes / No**

### Business Metrics

- Cost under two hundred dollars per month: **Yes / No**
- ROI calculation shows positive return: **Yes / No**
- Operators can use without training: **Yes / No**
- Identifies real business problems: **Yes / No**
- Clear path to production within two weeks: **Yes / No**

### Demo Quality

- Five-minute demo covers all features: **Yes / No**
- Demo shows real business value: **Yes / No**
- Technical complexity appropriate: **Yes / No**
- AI sophistication demonstrated: **Yes / No**
- Production readiness evident: **Yes / No**

---

## Conclusion

This task list provides a comprehensive roadmap for building the Intelligent Operations Dashboard in forty-eight hours using AI-first development. The phased approach ensures steady progress from infrastructure setup through deployment, with clear success criteria at each stage.

Key success factors:
- Start with mock data to decouple from external dependencies
- Use AI extensively in first twenty-four hours for maximum speed
- Focus on must-have features and defer nice-to-haves
- Test continuously rather than waiting until the end
- Deploy early and often to catch integration issues
- Document as you build rather than retroactively

The result will be a working prototype that demonstrates clear business value, leverages AI in sophisticated ways, and has a realistic path to production deployment within ninety days.