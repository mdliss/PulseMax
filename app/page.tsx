import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--accent)' }}>
            PulseMax Analytics
          </h1>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Real-time marketplace health monitoring and customer success tracking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Link
            href="/dashboard"
            className="card-hover rounded-lg p-8 border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderTopWidth: '4px',
              borderTopColor: 'var(--accent)'
            }}
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold mb-3">
              Marketplace Health
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Monitor active sessions, tutor utilization, customer satisfaction, and supply/demand balance in real-time.
            </p>
            <div className="font-medium" style={{ color: 'var(--accent)' }}>
              View Dashboard →
            </div>
          </Link>

          <Link
            href="/success-tracking"
            className="card-hover rounded-lg p-8 border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderTopWidth: '4px',
              borderTopColor: 'var(--success)'
            }}
          >
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-semibold mb-3">
              Success Tracking
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Track first session success rates by tutor, subject, and customer segment with anomaly detection.
            </p>
            <div className="font-medium" style={{ color: 'var(--success)' }}>
              View Dashboard →
            </div>
          </Link>

          <Link
            href="/velocity-monitoring"
            className="card-hover rounded-lg p-8 border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderTopWidth: '4px',
              borderTopColor: 'var(--info)'
            }}
          >
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="text-2xl font-semibold mb-3">
              Velocity Monitoring
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Analyze session velocity by cohort, retention curves, and identify at-risk customers.
            </p>
            <div className="font-medium" style={{ color: 'var(--info)' }}>
              View Dashboard →
            </div>
          </Link>

          <Link
            href="/supply-demand"
            className="card-hover rounded-lg p-8 border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderTopWidth: '4px',
              borderTopColor: 'var(--warning)'
            }}
          >
            <div className="text-4xl mb-4">🔮</div>
            <h2 className="text-2xl font-semibold mb-3">
              Supply-Demand Predictions
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              AI-powered forecasting for supply-demand imbalances with proactive alerts.
            </p>
            <div className="font-medium" style={{ color: 'var(--warning)' }}>
              View Dashboard →
            </div>
          </Link>
        </div>

        <div className="rounded-lg p-8 border card-hover" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-2xl font-semibold mb-6">
            Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="text-2xl mr-3">✅</div>
              <div>
                <h4 className="font-semibold mb-1">Real-time Data</h4>
                <p style={{ color: 'var(--text-secondary)' }}>Auto-refreshing dashboards with live metrics</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-3">🔔</div>
              <div>
                <h4 className="font-semibold mb-1">Smart Alerts</h4>
                <p style={{ color: 'var(--text-secondary)' }}>Anomaly detection with severity levels</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-3">📈</div>
              <div>
                <h4 className="font-semibold mb-1">Interactive Charts</h4>
                <p style={{ color: 'var(--text-secondary)' }}>Visualize trends with Recharts</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-3">🎨</div>
              <div>
                <h4 className="font-semibold mb-1">Cohort Analysis</h4>
                <p style={{ color: 'var(--text-secondary)' }}>Track retention and velocity by cohort</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
