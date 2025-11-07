'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface WeeklySessionData {
  weekNumber: number;
  weekStartDate: string;
  totalSessions: number;
  activeCustomers: number;
  averageSessionsPerCustomer: number;
}

interface CohortData {
  cohortId: string;
  cohortName: string;
  startDate: string;
  totalCustomers: number;
  weeklyData: WeeklySessionData[];
  averageVelocity: number;
  retentionRate: number;
}

interface CustomerVelocity {
  customerId: string;
  customerName: string;
  cohort: string;
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  sessionsPerWeek: number;
  velocityTrend: 'increasing' | 'stable' | 'decreasing' | 'at-risk';
  lastSessionDate: string;
}

interface VelocityAlert {
  type: string;
  severity: string;
  customerId: string;
  customerName: string;
  cohort: string;
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  sessionsPerWeek: number;
  daysSinceLastSession: number;
  message: string;
  createdAt: string;
}

interface VelocityData {
  cohorts: CohortData[];
  customerVelocities: CustomerVelocity[];
  atRiskCount: number;
  decreasingCount: number;
  timestamp: string;
}

interface AlertData {
  alerts: VelocityAlert[];
  totalAlerts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  atRiskCustomers: number;
  decreasingTrendCustomers: number;
  timestamp: string;
}

export default function VelocityMonitoringPage() {
  const [velocityData, setVelocityData] = useState<VelocityData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchData = async () => {
    try {
      const [velocityResponse, alertResponse] = await Promise.all([
        fetch('/api/session-velocity'),
        fetch('/api/velocity-alerts')
      ]);

      if (!velocityResponse.ok || !alertResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const velocity = await velocityResponse.json();
      const alerts = await alertResponse.json();

      setVelocityData(velocity);
      setAlertData(alerts);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl state-loading">Loading velocity monitoring data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl state-error">Error: {error}</div>
      </div>
    );
  }

  if (!velocityData || !alertData) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { backgroundColor: 'var(--error)', color: 'white' };
      case 'high':
        return { backgroundColor: 'var(--warning)', color: 'var(--background)' };
      case 'medium':
        return { backgroundColor: 'var(--info)', color: 'var(--background)' };
      default:
        return { backgroundColor: 'var(--accent)', color: 'var(--background)' };
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'at-risk':
        return 'var(--error)';
      case 'decreasing':
        return 'var(--warning)';
      case 'stable':
        return 'var(--info)';
      case 'increasing':
        return 'var(--success)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'at-risk':
        return '⚠️';
      case 'decreasing':
        return '📉';
      case 'stable':
        return '➡️';
      case 'increasing':
        return '📈';
      default:
        return '';
    }
  };

  const displayedCohort = selectedCohort
    ? velocityData.cohorts.find(c => c.cohortId === selectedCohort)
    : velocityData.cohorts[0];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 drop-in-1">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--info)' }}>
            Session Velocity Monitoring
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time tracking • Last updated: {lastUpdate}
          </p>
        </div>

        {/* Alert Summary */}
        {alertData.totalAlerts > 0 && (
          <div className="rounded-lg p-6 mb-8 border card-hover drop-in-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Velocity Alerts ({alertData.totalAlerts})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error)' }}>
                <p className="font-semibold" style={{ color: 'var(--error)' }}>Critical</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.criticalCount}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: '4px solid var(--warning)' }}>
                <p className="font-semibold" style={{ color: 'var(--warning)' }}>High</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.highCount}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--info)' }}>
                <p className="font-semibold" style={{ color: 'var(--info)' }}>Medium</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.mediumCount}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(212, 165, 116, 0.1)', borderLeft: '4px solid var(--accent)' }}>
                <p className="font-semibold" style={{ color: 'var(--accent)' }}>At Risk</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.atRiskCustomers}</p>
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alertData.alerts.slice(0, 10).map((alert, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg"
                  style={getSeverityColor(alert.severity)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">{alert.message}</p>
                      <p className="text-sm opacity-90">
                        This week: {alert.sessionsThisWeek} | Last week: {alert.sessionsLastWeek} |
                        Avg: {alert.sessionsPerWeek.toFixed(2)}/week
                      </p>
                    </div>
                    <span className="text-xs opacity-75 ml-4">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cohort Selector */}
        <div className="rounded-lg p-6 mb-8 border card-hover drop-in-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Cohort Selection
          </h2>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="input-select w-full p-3 border rounded-lg"
            style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border-color)', color: 'var(--foreground)' }}
          >
            {velocityData.cohorts.map((cohort) => (
              <option key={cohort.cohortId} value={cohort.cohortId}>
                {cohort.cohortName} - {cohort.totalCustomers} customers -
                {cohort.averageVelocity.toFixed(2)} sessions/week avg
              </option>
            ))}
          </select>
        </div>

        {/* Cohort Retention Curve */}
        {displayedCohort && (
          <div className="rounded-lg p-6 mb-8 border card-hover drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Cohort Retention: {displayedCohort.cohortName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--info)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Total Customers</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{displayedCohort.totalCustomers}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Avg Velocity</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {displayedCohort.averageVelocity.toFixed(2)} /week
                </p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(212, 165, 116, 0.1)', borderLeft: '4px solid var(--accent)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Retention Rate</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {displayedCohort.retentionRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={displayedCohort.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="weekNumber"
                  label={{ value: 'Week', position: 'insideBottom', offset: -5 }}
                  stroke="var(--text-secondary)"
                />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  labelFormatter={(value) => `Week ${value}`}
                  formatter={(value: number) => [value, 'Active Customers']}
                  contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }}
                />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Area
                  type="monotone"
                  dataKey="activeCustomers"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  name="Active Customers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Session Frequency Trends */}
        {displayedCohort && (
          <div className="rounded-lg p-6 mb-8 border card-hover drop-in-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Session Frequency Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={displayedCohort.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="weekNumber"
                  label={{ value: 'Week', position: 'insideBottom', offset: -5 }}
                  stroke="var(--text-secondary)"
                />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Line
                  type="monotone"
                  dataKey="totalSessions"
                  stroke="var(--success)"
                  name="Total Sessions"
                />
                <Line
                  type="monotone"
                  dataKey="averageSessionsPerCustomer"
                  stroke="var(--warning)"
                  name="Avg Sessions/Customer"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Customer Velocity Table */}
        <div className="rounded-lg p-6 border card-hover drop-in-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Customer Velocity Details
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'rgba(212, 165, 116, 0.1)' }}>
                <tr>
                  <th className="px-4 py-2 text-left" style={{ color: 'var(--text-secondary)' }}>Customer</th>
                  <th className="px-4 py-2 text-left" style={{ color: 'var(--text-secondary)' }}>Cohort</th>
                  <th className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>This Week</th>
                  <th className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>Last Week</th>
                  <th className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>Avg/Week</th>
                  <th className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>Trend</th>
                  <th className="px-4 py-2 text-left" style={{ color: 'var(--text-secondary)' }}>Last Session</th>
                </tr>
              </thead>
              <tbody>
                {velocityData.customerVelocities.slice(0, 20).map((customer, index) => (
                  <tr key={index} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-2" style={{ color: 'var(--foreground)' }}>{customer.customerName}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--foreground)' }}>{customer.cohort}</td>
                    <td className="px-4 py-2 text-center" style={{ color: 'var(--foreground)' }}>{customer.sessionsThisWeek}</td>
                    <td className="px-4 py-2 text-center" style={{ color: 'var(--foreground)' }}>{customer.sessionsLastWeek}</td>
                    <td className="px-4 py-2 text-center font-semibold" style={{ color: 'var(--accent)' }}>
                      {customer.sessionsPerWeek.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center font-semibold" style={{ color: getTrendColor(customer.velocityTrend) }}>
                      {getTrendIcon(customer.velocityTrend)} {customer.velocityTrend}
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(customer.lastSessionDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
