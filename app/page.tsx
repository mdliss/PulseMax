'use client';

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 drop-in-1">
          <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            PulseMax Analytics
          </h1>
          <p className="text-lg md:text-xl" style={{ color: 'var(--text-secondary)' }}>
            Welcome back
          </p>
        </div>

        <div className="text-center mb-12 drop-in-2">
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Real-time marketplace health monitoring and customer success tracking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link
            href="/dashboard"
            className="card-hover rounded-lg p-6 border drop-in-3"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderTopWidth: '4px',
              borderTopColor: 'var(--accent)'
            }}
          >
            <h2 className="text-xl font-semibold mb-2">
              Marketplace Health
            </h2>
            <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Real-time sessions, utilization, and satisfaction metrics
            </p>
            <div className="font-medium" style={{ color: 'var(--accent)' }}>
              View Dashboard →
            </div>
          </Link>

          <Link
            href="/success-tracking"
            className="card-hover rounded-lg p-6 border drop-in-4"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderTopWidth: '4px',
              borderTopColor: 'var(--accent)'
            }}
          >
            <h2 className="text-xl font-semibold mb-2">
              Success Tracking
            </h2>
            <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              First session success rates with anomaly detection
            </p>
            <div className="font-medium" style={{ color: 'var(--accent)' }}>
              View Dashboard →
            </div>
          </Link>

          <Link
            href="/supply-demand"
            className="card-hover rounded-lg p-6 border drop-in-5"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderTopWidth: '4px',
              borderTopColor: 'var(--accent)'
            }}
          >
            <h2 className="text-xl font-semibold mb-2">
              Supply-Demand
            </h2>
            <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI-powered forecasting with proactive alerts
            </p>
            <div className="font-medium" style={{ color: 'var(--accent)' }}>
              View Dashboard →
            </div>
          </Link>

          <Link
            href="/churn-prediction"
            className="card-hover rounded-lg p-6 border drop-in-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderTopWidth: '4px',
              borderTopColor: 'var(--accent)'
            }}
          >
            <h2 className="text-xl font-semibold mb-2">
              Churn Prediction
            </h2>
            <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Identify at-risk customers and prevent churn
            </p>
            <div className="font-medium" style={{ color: 'var(--accent)' }}>
              View Dashboard →
            </div>
          </Link>

          <Link
            href="/campaign-recommendations"
            className="card-hover rounded-lg p-6 border drop-in-7"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderTopWidth: '4px',
              borderTopColor: 'var(--accent)'
            }}
          >
            <h2 className="text-xl font-semibold mb-2">
              Campaign Recommendations
            </h2>
            <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI-powered customer engagement strategies
            </p>
            <div className="font-medium" style={{ color: 'var(--accent)' }}>
              View Dashboard →
            </div>
          </Link>

          <Link
            href="/alert-history"
            className="card-hover rounded-lg p-6 border drop-in-8"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderTopWidth: '4px',
              borderTopColor: 'var(--accent)'
            }}
          >
            <h2 className="text-xl font-semibold mb-2">
              Alert History
            </h2>
            <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              View and manage system alerts and notifications
            </p>
            <div className="font-medium" style={{ color: 'var(--accent)' }}>
              View Dashboard →
            </div>
          </Link>
        </div>

        <div className="rounded-lg p-8 border card-hover drop-in-11 bg-card border-default">
          <h3 className="text-2xl font-semibold mb-6">
            Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full mt-2 mr-3 bg-accent"></div>
              <div>
                <h4 className="font-semibold mb-1">Real-time Data</h4>
                <p className="text-secondary">Auto-refreshing dashboards with live metrics</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full mt-2 mr-3 bg-accent"></div>
              <div>
                <h4 className="font-semibold mb-1">Smart Alerts</h4>
                <p className="text-secondary">Anomaly detection with severity levels</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full mt-2 mr-3 bg-accent"></div>
              <div>
                <h4 className="font-semibold mb-1">Interactive Charts</h4>
                <p className="text-secondary">Visualize trends with Recharts</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full mt-2 mr-3 bg-accent"></div>
              <div>
                <h4 className="font-semibold mb-1">Cohort Analysis</h4>
                <p className="text-secondary">Track retention and velocity by cohort</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
